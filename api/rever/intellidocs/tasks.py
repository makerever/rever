import contextlib
import json
import logging
import time
from decimal import Decimal
from pathlib import Path
from typing import Any

from celery import shared_task
from django.contrib.contenttypes.models import ContentType
from django.core.serializers.json import DjangoJSONEncoder
from django.db import models, transaction
from django.utils import timezone

from rever.db.models.attachment import Attachment
from rever.db.models.auth import Organization
from rever.db.models.payable import Bill, BillItem, PurchaseOrder, PurchaseOrderItem
from rever.intellidocs.constants import ProcessingStatus
from rever.intellidocs.models import DocumentExtraction

from .models import OCRLog
from .parsers.factory import DocumentParserFactory
from .services.ocr_service import OCRService
from .services.vendor_matcher import VendorMatcher
from .utils import (
    clean_decimal,
    clean_string,
    normalize_payment_terms,
    parse_date,
    truncate_string,
)

logger = logging.getLogger(__name__)


def validate_amounts(subtotal: Decimal, tax: Decimal, total: Decimal) -> tuple[bool, Decimal]:
    """
    Validate if subtotal + tax ~= total
    Returns (is_valid, discrepancy)
    """
    try:
        calculated = subtotal + tax
        diff = abs(calculated - total)
        # Allow small rounding difference (0.05)
        return diff < Decimal("0.05"), diff
    except Exception:
        return False, Decimal("0")


def _perform_ocr(file_path: str | Path, engine: str) -> tuple[str, float, dict]:
    """Perform OCR on the document"""
    start_time = time.time()
    ocr_service = OCRService(use_preprocessing=True)

    logger.info(f"Processing file: {file_path}")
    ocr_result = ocr_service.process_document(file_path, engine)
    ocr_time = time.time() - start_time

    raw_text = ocr_result.get("text", "")
    cleaned_text = raw_text.replace("\x00", "")

    if not cleaned_text or len(cleaned_text) < 10:
        raise ValueError("OCR produced insufficient text (< 10 characters)")

    return cleaned_text, ocr_time, ocr_result


def _parse_document(text: str, document_type: str = "bill") -> tuple[dict, float]:
    """Parse document text using factory-provided parser"""
    logger.info(f"Parsing {document_type} data")
    start_time = time.time()

    parser = DocumentParserFactory.get_parser(document_type)
    parsed_data = parser.parse(text)

    parse_time = time.time() - start_time
    logger.info(f"Parsed {document_type} data: {len(parsed_data.get('line_items', []))} items")

    return parsed_data, parse_time


def _create_document_extraction(
    organization_id: str | int,
    file_path: str | Path,
    file_name: str,
    text: str,
    parsed_data: dict,
    timings: dict,
    document_type: str = "bill",
) -> DocumentExtraction:
    """Create DocumentExtraction record (Staging)"""
    try:
        file_size = Path(file_path).stat().st_size
    except OSError:
        file_size = 0

    ext_bill_number = parsed_data.get("bill_number")
    ext_po_number = parsed_data.get("purchase_order") or parsed_data.get("po_number")
    ext_vendor_name = parsed_data.get("vendor", {}).get("name")
    ext_total = parsed_data.get("amounts", {}).get("total")

    ext_bill_date = parse_date(parsed_data.get("bill_date"))
    ext_due_date = parse_date(parsed_data.get("due_date"))
    ext_total_amount = clean_decimal(ext_total) if ext_total else None

    # Convert Decimal objects to strings for JSON serialization
    json_safe_data = json.loads(json.dumps(parsed_data, cls=DjangoJSONEncoder))

    return DocumentExtraction.objects.create(
        organization_id=organization_id,
        file=str(file_path),
        file_name=file_name,
        file_size=file_size,
        file_type="application/pdf" if file_name.lower().endswith(".pdf") else "image/jpeg",
        status=ProcessingStatus.COMPLETED,
        raw_text=text,
        extracted_data=json_safe_data,
        processing_time=timings.get("ocr_time", 0) + timings.get("parse_time", 0),
        extraction_engine="ollama",
        document_type=document_type,
        bill_number=ext_bill_number,
        po_number=ext_po_number,
        vendor_name=ext_vendor_name,
        bill_date=ext_bill_date,
        due_date=ext_due_date,
        total_amount=ext_total_amount,
        currency=parsed_data.get("currency", "USD"),
    )


def _match_purchase_order(
    organization_id: str | int, po_number: str | None
) -> PurchaseOrder | None:
    """Try to find Purchase Order"""
    if not po_number:
        return None

    try:
        matched_po = PurchaseOrder.objects.filter(
            organization_id=organization_id, po_number__iexact=po_number
        ).first()
        if matched_po:
            logger.info(f"Matched Purchase Order: {matched_po.po_number}")
        return matched_po
    except Exception as e:
        logger.warning(f"Error matching PO: {e}")
        return None


def _match_vendor(
    organization: Organization, vendor_data: dict, matched_po: PurchaseOrder | None
) -> tuple[Any | None, bool, float]:
    """
    Extract vendor data and perform semantic matching
    Returns (matched_vendor, vendor_created, vendor_confidence)
    """
    vendor_name = vendor_data.get("name")
    vendor_matcher = VendorMatcher()

    # If we have a matched PO but no matched vendor, use the PO's vendor
    if matched_po and matched_po.vendor:
        logger.info(f"Using Vendor from PO: {matched_po.vendor.vendor_name}")
        return matched_po.vendor, False, 1.0

    if vendor_name:
        logger.info(f"Matching vendor: {vendor_name}")
        matched_vendor, vendor_confidence, match_reason = vendor_matcher.find_vendor(
            extracted_vendor_data=vendor_data, organization=organization
        )

        if matched_vendor:
            logger.info(
                f"Vendor matched: {matched_vendor.vendor_name} "
                f"(confidence: {vendor_confidence:.3f})"
            )
            return matched_vendor, False, vendor_confidence
        else:
            logger.warning(f"No vendor match found for '{vendor_name}': {match_reason}")
            return None, False, vendor_confidence

    logger.warning("No vendor name extracted from bill")
    return None, False, 0.0


def _create_bill_record(
    organization: Organization,
    matched_vendor: Any | None,
    parsed_data: dict,
    matched_po: PurchaseOrder | None,
) -> Bill:
    """Create Bill with all extracted data"""
    bill_date = parse_date(parsed_data.get("bill_date"))
    due_date = parse_date(parsed_data.get("due_date"))

    amounts = parsed_data.get("amounts", {}) or {}
    sub_total = clean_decimal(amounts.get("subtotal"))
    tax_amount = clean_decimal(amounts.get("tax"))
    total = clean_decimal(amounts.get("total"))
    tax_percentage = clean_decimal(amounts.get("tax_percentage"))

    raw_terms = parsed_data.get("payment_terms")
    payment_terms = normalize_payment_terms(raw_terms)

    ocr_bill_number = clean_string(truncate_string(parsed_data.get("bill_number"), 50))

    is_valid_math, diff = validate_amounts(sub_total, tax_amount, total)
    if not is_valid_math and total > 0:
        logger.warning(
            f"Bill amount validation failed: {sub_total} + {tax_amount} != {total} (Diff: {diff})"
        )

    bill = Bill.objects.create(
        organization=organization,
        vendor=matched_vendor,
        bill_number=ocr_bill_number,  # Will be auto-generated if empty
        bill_date=bill_date,
        due_date=due_date,
        payment_terms=payment_terms,  # Use normalized terms
        comments=clean_string(parsed_data.get("comments")),
        sub_total=sub_total,
        tax_percentage=tax_percentage,
        total_tax=tax_amount,
        total=total,
        status="draft",
        is_attachment=True,
        purchase_order=matched_po,
    )

    logger.info(f"Created Bill: {bill.bill_number} (ID: {bill.id})")
    return bill


def _create_po_record(
    organization: Organization,
    matched_vendor: Any | None,
    parsed_data: dict,
) -> tuple[PurchaseOrder, bool]:
    """
    Create PurchaseOrder from extracted data.
    If a PO with the same number already exists for this organization, returns the existing one.
    
    Returns:
        Tuple of (PurchaseOrder, is_new) where is_new is True if PO was created, False if existing.
    """
    po_date = parse_date(parsed_data.get("po_date")) or timezone.now().date()
    delivery_date = parse_date(parsed_data.get("delivery_date")) or timezone.now().date()

    amounts = parsed_data.get("amounts", {}) or {}
    total = clean_decimal(amounts.get("total")) or Decimal("0")
    sub_total = clean_decimal(amounts.get("subtotal")) or total
    tax_amount = clean_decimal(amounts.get("tax")) or Decimal("0")
    
    ocr_po_number = clean_string(truncate_string(parsed_data.get("po_number"), 50))
    
    # Check for duplicate PO
    if ocr_po_number:
        existing_po = PurchaseOrder.objects.filter(
            organization=organization,
            po_number__iexact=ocr_po_number,
        ).first()
        
        if existing_po:
            logger.warning(
                f"Duplicate PO detected: {ocr_po_number} already exists (ID: {existing_po.id}). "
                f"Returning existing PO instead of creating new one."
            )
            return existing_po, False  # Return existing, not new
    
    po = PurchaseOrder.objects.create(
        organization=organization,
        vendor=matched_vendor,
        po_number=ocr_po_number,  # Will auto-generate if empty
        po_date=po_date,
        delivery_date=delivery_date,
        sub_total=sub_total,
        total_tax=tax_amount,
        total=total,
        status="draft",
        is_attachment=True,
    )
    
    logger.info(f"Created PO: {po.po_number} (ID: {po.id})")
    return po, True  # Return new PO


def _create_line_items(
    parent_object: Bill | PurchaseOrder,
    item_model: type[BillItem] | type[PurchaseOrderItem],
    line_items: list,
    parent_field_name: str,
) -> list[BillItem | PurchaseOrderItem]:
    """
    Generic function to create line items for Bill or PurchaseOrder.
    
    Args:
        parent_object: The Bill or PurchaseOrder instance
        item_model: BillItem or PurchaseOrderItem class
        line_items: List of parsed line item dicts
        parent_field_name: Name of FK field on item model ('bill' or 'purchase_order')
    """
    created_items = []
    model_name = item_model.__name__
    logger.info(f"Attempting to create {len(line_items)} {model_name}s from parsed data")

    for idx, item_data in enumerate(line_items, 1):
        try:
            logger.debug(f"Processing {model_name} {idx}: {item_data}")

            quantity = clean_decimal(item_data.get("quantity"))
            unit_price = clean_decimal(item_data.get("unit_price"))
            amount = clean_decimal(item_data.get("amount"))

            if not amount and quantity and unit_price:
                amount = quantity * unit_price

            # Sanitize line number
            raw_line_num = item_data.get("line_number")
            line_number = idx
            if raw_line_num:
                with contextlib.suppress(ValueError, TypeError):
                    line_number = int(str(raw_line_num).strip())

            # Build base fields
            item_fields = {
                parent_field_name: parent_object,
                "description": (
                    clean_string(item_data.get("description", "No description"))
                    or "No description"
                )[:500],
                "quantity": quantity,
                "unit_price": unit_price,
                "amount": amount,
                "uom": (clean_string(item_data.get("uom", "")) or "")[:20],
                "product_code": (clean_string(item_data.get("product_code", "")) or "")[:50],
                "line_number": line_number,
            }

            # Add PO-specific field
            if item_model == PurchaseOrderItem:
                item_fields["line_status"] = "open"

            item = item_model.objects.create(**item_fields)
            created_items.append(item)

        except Exception as item_error:
            logger.error(f"Failed to create {model_name} {idx}: {item_error}", exc_info=True)
            continue

    logger.info(f"Created {len(created_items)} {model_name}s")
    return created_items


def _create_attachment(
    organization: Organization, content_object: models.Model, file_path: str | Path, file_name: str
) -> Attachment | None:
    """Create Attachment and link to generic object (Bill or PurchaseOrder)"""
    try:
        content_type = ContentType.objects.get_for_model(content_object)

        # Note: file is already saved in storage at file_path
        attachment = Attachment.objects.create(
            organization=organization,
            file=str(file_path),
            file_name=file_name,
            content_type=content_type,
            object_id=content_object.id,
        )

        logger.info(
            f"Created attachment {attachment.id} linked to "
            f"{content_type.model} {content_object.id}"
        )
        return attachment

    except Exception as attach_error:
        logger.error(f"Failed to create attachment: {attach_error}", exc_info=True)
        return None


@shared_task(bind=True)
def process_document_ocr_task(
    self,
    file_path: str | Path,
    file_name: str,
    organization_id: str | int,
    task_id: str,
    engine: str = "auto",
    document_type: str = "bill",
) -> dict[str, Any]:
    """
    Celery task to process document OCR asynchronously
    Supports Bill and Purchase Order
    """
    logger.info(f"Starting {document_type} OCR processing for file {file_path} (task: {task_id})")
    start_time = time.time()

    created_document = None

    try:
        try:
            organization = Organization.objects.get(id=organization_id)
        except Organization.DoesNotExist as e:
            logger.error(f"Organization not found: {e}")
            return {"status": "failed", "error": str(e)}

        # 1. Perform OCR
        cleaned_text, ocr_time, ocr_result = _perform_ocr(file_path, engine)

        # 2. Parse Data
        parsed_data, parse_time = _parse_document(cleaned_text, document_type)

        # 3. Create Extraction Record
        extraction = _create_document_extraction(
            organization_id,
            file_path,
            file_name,
            cleaned_text,
            parsed_data,
            {"ocr_time": ocr_time, "parse_time": parse_time},
            document_type=document_type,
        )

        
        matched_vendor = None
        vendor_created = False
        vendor_confidence = 0.0
        
        # 5. Match Vendor (Common for both)
        # Note: Bills can look up PO vendor. POs rely on vendor name.
        matched_po = None
        if document_type == "bill":
             matched_po = _match_purchase_order(organization_id, parsed_data.get("purchase_order"))
        
        matched_vendor, vendor_created, vendor_confidence = _match_vendor(
            organization, parsed_data.get("vendor", {}) or {}, matched_po
        )


        # 6. Create Record (Atomic)
        with transaction.atomic():
            if document_type == "bill":
                bill = _create_bill_record(organization, matched_vendor, parsed_data, matched_po)
                created_document = bill
                
                extraction.bill = bill
                extraction.save(update_fields=["bill"])

                _create_line_items(
                    bill, BillItem, parsed_data.get("line_items", []), "bill"
                )
                # Create Attachment (Generic)
                _create_attachment(organization, bill, file_path, file_name)
                
            elif document_type == "purchase_order":
                po, is_new_po = _create_po_record(organization, matched_vendor, parsed_data)
                created_document = po
                
                extraction.purchase_order = po
                extraction.save(update_fields=["purchase_order"])
                
                if is_new_po:
                    _create_line_items(
                        po, PurchaseOrderItem,
                        parsed_data.get("line_items", []), "purchase_order"
                    )
                    _create_attachment(organization, po, file_path, file_name)
                else:
                    logger.info(f"Skipping line item creation for existing PO: {po.po_number}")

        total_time = time.time() - start_time

        # 7. Log Success
        log_details = {
            "task_id": task_id,
            "file_path": str(file_path),
            "vendor_matched": matched_vendor.vendor_name if matched_vendor else None,
            "document_type": document_type,
            "ocr_time": ocr_time,
            "parse_time": parse_time,
        }

        OCRLog.objects.create(
            document_type=document_type,
            document_id=created_document.id if created_document else None,
            operation=f"process_{document_type}_ocr",
            status=ProcessingStatus.COMPLETED,
            processing_time=total_time,
            ocr_engine=ocr_result.get("engine", "unknown"),
            details=log_details,
        )
        
        if document_type == "bill":
            doc_number = created_document.bill_number
        else:
            doc_number = created_document.po_number

        logger.info(
            f"{document_type.title()} processing completed: {doc_number} in {total_time:.2f}s"
        )

        return {
            "status": "success",
            "document_id": str(created_document.id),
            "document_number": doc_number,
            "processing_time": round(total_time, 2),
        }

    except Exception as e:
        total_time = time.time() - start_time
        logger.error(f"Document OCR processing failed: {e!s}", exc_info=True)

        with contextlib.suppress(Exception):
            OCRLog.objects.create(
                document_type=document_type,
                document_id=created_document.id if created_document else None,
                operation=f"process_{document_type}_ocr",
                status=ProcessingStatus.FAILED,
                error_details=str(e),
                processing_time=total_time,
                details={"task_id": task_id, "file_path": str(file_path)},
            )

        return {"status": "failed", "error": str(e)}

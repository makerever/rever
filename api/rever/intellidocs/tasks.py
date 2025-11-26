import contextlib
import logging
import time
from decimal import Decimal
from pathlib import Path
from typing import Any

from celery import shared_task

from .models import OCRLog
from .parsers.bill_parser import BillParser
from .services.ocr_service import OCRService
from .services.vendor_matcher import VendorMatcher

logger = logging.getLogger(__name__)


def convert_decimals_to_string(data: Any) -> Any:
    """
    Recursively convert Decimal objects to strings for JSON serialization
    """
    if isinstance(data, dict):
        return {key: convert_decimals_to_string(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [convert_decimals_to_string(item) for item in data]
    elif isinstance(data, Decimal):
        return str(data)
    else:
        return data


def clean_string(value: Any) -> str | None:
    """Remove null bytes and problematic characters from string"""
    if value is None:
        return None
    if not isinstance(value, str):
        return value

    # Remove null bytes
    value = value.replace("\x00", "")

    # Remove other control characters except newlines and tabs
    value = "".join(char for char in value if ord(char) >= 32 or char in "\n\r\t")

    return value.strip() if value else None


def truncate_string(value: Any, max_length: int) -> str | None:
    """Safely truncate string to max_length"""
    if value is None:
        return None
    value_str = str(value)
    if len(value_str) > max_length:
        return value_str[:max_length]
    return value_str


def parse_date(date_str: Any) -> str | None:
    """Parse various date formats to YYYY-MM-DD"""
    if not date_str:
        return None

    from datetime import datetime

    # List of date formats to try
    date_formats = [
        "%Y-%m-%d",  # 2025-05-24
        "%B %d, %Y",  # May 24, 2025
        "%b %d, %Y",  # May 24, 2025
        "%m/%d/%Y",  # 05/24/2025
        "%d/%m/%Y",  # 24/05/2025
        "%Y/%m/%d",  # 2025/05/24
        "%m-%d-%Y",  # 05-24-2025
        "%d-%m-%Y",  # 24-05-2025
        "%d %B %Y",  # 24 May 2025
        "%d %b %Y",  # 24 May 2025
        "%b %d %Y",  # Mar 06 2012
        "%B %d %Y",  # March 06 2012
    ]

    for fmt in date_formats:
        try:
            dt = datetime.strptime(str(date_str).strip(), fmt)
            return dt.strftime("%Y-%m-%d")
        except (ValueError, AttributeError):
            continue

    return None


def normalize_payment_terms(term: Any) -> str | None:
    """
    Normalize extracted payment terms to valid DB choices
    """
    if not term:
        return None

    term = str(term).lower().strip()

    # Map common variations to DB values (max 8 chars)
    if "15" in term:
        return "net15"
    elif "30" in term:
        return "net30"
    elif "45" in term:
        return "net45"
    elif "60" in term:
        return "net60"  # If supported, otherwise maybe map to closest or leave null
    elif "due" in term or "receipt" in term or "immediate" in term:
        return "due"

    # Default fallback: if it fits in 8 chars, keep it, otherwise None
    if len(term) <= 8:
        return term

    return None


def clean_decimal(value: Any) -> Decimal:
    """
    Clean string to be converted to Decimal
    Removes currency symbols, commas, percentage signs
    """
    if not value:
        return Decimal("0")

    if isinstance(value, (int, float, Decimal)):
        return Decimal(str(value))

    # Remove currency symbols, commas, percentage signs, and spaces
    # Keep only digits, dots, and minus sign
    clean_val = (
        str(value)
        .replace(",", "")
        .replace("$", "")
        .replace("€", "")
        .replace("£", "")
        .replace("%", "")
        .replace(" ", "")
    )

    # Handle negative numbers in parentheses (e.g. "(100.00)")
    if "(" in clean_val and ")" in clean_val:
        clean_val = "-" + clean_val.replace("(", "").replace(")", "")

    try:
        return Decimal(clean_val)
    except Exception:
        return Decimal("0")


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


@shared_task(bind=True)
def process_bill_ocr_task(
    self,
    file_path: str | Path,
    file_name: str,
    organization_id: str | int,
    task_id: str,
    engine: str = "auto",
) -> dict[str, Any]:
    """
    Celery task to process bill OCR asynchronously
    Creates Bill and BillItem records from extracted data
    Performs semantic vendor matching
    Creates Attachment record after successful processing
    """
    logger.info(f"Starting bill OCR processing for file {file_path} (task: {task_id})")
    start_time = time.time()

    bill = None

    try:
        from django.contrib.contenttypes.models import ContentType
        from django.db import transaction

        from rever.db.models.attachment import Attachment
        from rever.db.models.auth import Organization
        from rever.db.models.payable import Bill, BillItem

        try:
            organization = Organization.objects.get(id=organization_id)
        except Organization.DoesNotExist as e:
            logger.error(f"Organization not found: {e}")
            return {"status": "failed", "error": str(e)}

        ocr_service = OCRService(use_preprocessing=True)
        bill_parser = BillParser()
        vendor_matcher = VendorMatcher()

        logger.info(f"Processing file: {file_path}")
        ocr_result = ocr_service.process_document(file_path, engine)
        ocr_time = time.time() - start_time

        raw_text = ocr_result.get("text", "")
        cleaned_text = raw_text.replace("\x00", "")

        if not cleaned_text or len(cleaned_text) < 10:
            raise ValueError("OCR produced insufficient text (< 10 characters)")

        logger.info("Parsing bill data with BillParser")
        parse_start_time = time.time()
        parsed_data = bill_parser.parse(cleaned_text)
        parse_time = time.time() - parse_start_time

        logger.info(f"Parsed bill data: {len(parsed_data.get('line_items', []))} line items")

        # Create BillExtraction record (Staging)

        from rever.db.models.payable import PurchaseOrder
        from rever.intellidocs.models import BillExtraction

        try:
            file_size = Path(file_path).stat().st_size
        except OSError:
            file_size = 0

        ext_bill_number = parsed_data.get("bill_number")
        ext_po_number = parsed_data.get("purchase_order")
        ext_vendor_name = parsed_data.get("vendor", {}).get("name")
        ext_total = parsed_data.get("amounts", {}).get("total")

        ext_bill_date = parse_date(parsed_data.get("bill_date"))
        ext_due_date = parse_date(parsed_data.get("due_date"))
        ext_total_amount = clean_decimal(ext_total) if ext_total else None

        extraction = BillExtraction.objects.create(
            organization_id=organization_id,
            file=str(file_path),
            file_name=file_name,
            file_size=file_size,
            file_type="application/pdf" if file_name.lower().endswith(".pdf") else "image/jpeg",
            status="completed",
            raw_text=cleaned_text,
            extracted_data=parsed_data,
            processing_time=ocr_time + parse_time,
            extraction_engine="ollama",
            bill_number=ext_bill_number,
            po_number=ext_po_number,
            vendor_name=ext_vendor_name,
            bill_date=ext_bill_date,
            due_date=ext_due_date,
            total_amount=ext_total_amount,
            currency=parsed_data.get("currency", "USD"),
        )

        # Try to find Purchase Order
        matched_po = None
        po_number = parsed_data.get("purchase_order")
        if po_number:
            try:
                matched_po = PurchaseOrder.objects.filter(
                    organization_id=organization_id, po_number__iexact=po_number
                ).first()
                if matched_po:
                    logger.info(f"Matched Purchase Order: {matched_po.po_number}")
                    # Note: We don't link PO to extraction anymore as per request
            except Exception as e:
                logger.warning(f"Error matching PO: {e}")

        # Extract vendor data and perform semantic matching
        vendor_data = parsed_data.get("vendor", {}) or {}
        vendor_name = vendor_data.get("name")

        matched_vendor = None
        vendor_created = False
        vendor_confidence = 0.0

        # If we have a matched PO but no matched vendor, use the PO's vendor
        if matched_po and matched_po.vendor:
            matched_vendor = matched_po.vendor
            logger.info(f"Using Vendor from PO: {matched_vendor.vendor_name}")
            vendor_confidence = 1.0
        elif vendor_name:
            logger.info(f"Matching vendor: {vendor_name}")

            matched_vendor, vendor_confidence, match_reason = vendor_matcher.find_vendor(
                extracted_vendor_data=vendor_data, organization=organization
            )

            if matched_vendor:
                logger.info(
                    f"Vendor matched: {matched_vendor.vendor_name} "
                    f"(confidence: {vendor_confidence:.3f})"
                )
            else:
                logger.warning(f"No vendor match found for '{vendor_name}': {match_reason}")
        else:
            logger.warning("No vendor name extracted from bill")

        # Create Bill with all extracted data
        with transaction.atomic():
            # Get bill date
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
                    f"Bill amount validation failed: {sub_total} + {tax_amount} != {total} "
                    f"(Diff: {diff})"
                )
                # We still create the bill, but maybe flag it?
                # For now just log it. In future, could add a 'flagged' status.

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

            extraction.bill = bill
            extraction.save(update_fields=["bill"])

            line_items = parsed_data.get("line_items", [])
            created_items = []

            logger.info(f"Attempting to create {len(line_items)} bill items from parsed data")
            logger.debug(f"Parsed line items: {line_items}")

            for idx, item_data in enumerate(line_items, 1):
                try:
                    logger.debug(f"Processing line item {idx}: {item_data}")

                    quantity = clean_decimal(item_data.get("quantity"))
                    unit_price = clean_decimal(item_data.get("unit_price"))
                    amount = clean_decimal(item_data.get("amount"))

                    if not amount and quantity and unit_price:
                        amount = quantity * unit_price

                    logger.debug(
                        f"Line item {idx} - Qty: {quantity}, Price: {unit_price}, Amount: {amount}"
                    )

                    # Sanitize line number
                    raw_line_num = item_data.get("line_number")
                    line_number = idx  # Default to index
                    if raw_line_num:
                        with contextlib.suppress(ValueError, TypeError):
                            line_number = int(str(raw_line_num).strip())

                    bill_item = BillItem.objects.create(
                        bill=bill,
                        description=(
                            clean_string(item_data.get("description", "No description"))
                            or "No description"
                        )[:500],
                        quantity=quantity,
                        unit_price=unit_price,
                        amount=amount,
                        uom=(clean_string(item_data.get("uom", "")) or "")[:20],
                        product_code=(clean_string(item_data.get("product_code", "")) or "")[:50],
                        line_number=line_number,
                    )
                    created_items.append(bill_item)
                    logger.info(
                        f"Successfully created bill item {idx}: {bill_item.description[:50]}"
                    )

                except Exception as item_error:
                    logger.error(f"Failed to create bill item {idx}: {item_error}", exc_info=True)
                    logger.error(f"Item data that failed: {item_data}")
                    continue

            logger.info(f"Created {len(created_items)} bill items")

            # Create Attachment and link to bill

            try:
                bill_content_type = ContentType.objects.get_for_model(Bill)

                # Note: file is already saved in storage at file_path
                attachment = Attachment.objects.create(
                    organization=organization,
                    file=str(file_path),
                    file_name=file_name,
                    content_type=bill_content_type,
                    object_id=bill.id,
                )

                logger.info(f"Created attachment {attachment.id} linked to bill {bill.id}")

            except Exception as attach_error:
                logger.error(f"Failed to create attachment: {attach_error}", exc_info=True)
                # Don't fail the entire task if attachment creation fails
                # Bill is already created successfully

        total_time = time.time() - start_time

        log_details = {
            "task_id": task_id,
            "file_path": str(file_path),
            "vendor_matched": matched_vendor.vendor_name if matched_vendor else None,
            "vendor_created": vendor_created,
            "vendor_confidence": vendor_confidence,
            "line_items_count": len(created_items),
            "ocr_time": ocr_time,
            "parse_time": parse_time,
        }

        OCRLog.objects.create(
            document_type="bill",
            document_id=bill.id if bill else None,
            operation="process_bill_ocr",
            status="completed",
            processing_time=total_time,
            ocr_engine=ocr_result.get("engine", "unknown"),
            details=log_details,
        )

        logger.info(
            f"Bill OCR processing completed: Bill {bill.bill_number} (ID: {bill.id}) in "
            f"{total_time:.2f}s"
        )

        try:
            # Don't delete if it's now the attachment file
            # The file at file_path is now referenced by the Attachment model
            pass
        except Exception as cleanup_error:
            logger.warning(f"Failed to cleanup temp file: {cleanup_error}")

        return {
            "status": "success",
            "bill_id": str(bill.id),
            "bill_number": bill.bill_number,
            "vendor": matched_vendor.vendor_name if matched_vendor else None,
            "vendor_created": vendor_created,
            "line_items_count": len(created_items),
            "processing_time": round(total_time, 2),
        }

    except Exception as e:
        total_time = time.time() - start_time
        logger.error(f"Bill OCR processing failed: {e!s}", exc_info=True)

        try:
            OCRLog.objects.create(
                document_type="bill",
                document_id=bill.id if bill else None,
                operation="process_bill_ocr",
                status="failed",
                error_details=str(e),
                processing_time=total_time,
                details={"task_id": task_id, "file_path": str(file_path)},
            )
        except Exception as log_error:
            logger.error(f"Failed to log error: {log_error}")

        return {"status": "failed", "error": str(e)}

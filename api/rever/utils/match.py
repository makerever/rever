import logging

from django.core.cache import cache
from django.db import IntegrityError
from sentence_transformers import util

from rever.bgtasks.match_task import async_generate_match_results
from rever.db.models import Bill, BillItem, MatchMatrix, MatchResult, PurchaseOrderItem

from .embedding import model

logger = logging.getLogger(__name__)


def get_similarity_score(text1, text2):
    emb1 = model.encode(text1, convert_to_tensor=True)
    emb2 = model.encode(text2, convert_to_tensor=True)
    return round(util.pytorch_cos_sim(emb1, emb2).item(), 4)


def regenerate_matrix(bill):
    po = bill.purchase_order
    if not po:
        return

    bill_items = BillItem.objects.filter(bill=bill)
    po_items = PurchaseOrderItem.objects.filter(purchase_order=po)

    # Clear previous entries
    MatchMatrix.objects.filter(bill=bill).delete()

    matrix_entries = []
    for bill_item in bill_items:
        for po_item in po_items:
            score = get_similarity_score(bill_item.description, po_item.description)
            matrix_entries.append(
                MatchMatrix(
                    bill=bill,
                    bill_item=bill_item,
                    purchase_order=po,
                    purchase_order_item=po_item,
                    description_score=score,
                )
            )

    # Now safe to bulk insert
    MatchMatrix.objects.bulk_create(matrix_entries)


def _regenerate_matrix_safely(bill):
    lock_key = f"lock:matrix:{bill.id}"
    if cache.add(lock_key, "1", timeout=30):  # lock for 30 seconds .. wait for regeneration
        try:
            regenerate_matrix(bill)
            async_generate_match_results.delay(str(bill.id))
        except IntegrityError as e:
            logger.warning(f"Matrix generation failed due to race condition: {e}")
        finally:
            cache.delete(lock_key)
    else:
        logger.info(f"🔒 Skipping matrix regen for bill {bill.id} - lock in place.")


def generate_match_results(bill):
    try:
        organization = bill.organization
        purchase_order = bill.purchase_order

        # Step 1: Delete old match results
        MatchResult.objects.filter(bill=bill).delete()

        # Step 2: Load and sort matrix
        matrix = (
            MatchMatrix.objects.filter(bill=bill, purchase_order=purchase_order)
            .select_related("bill_item", "purchase_order_item")
            .order_by("-description_score")
        )

        used_bill_items = set()
        used_po_items = set()
        results = []

        for row in matrix:
            bill_item = row.bill_item
            po_item = row.purchase_order_item

            if bill_item.id in used_bill_items or po_item.id in used_po_items:
                continue

            # Description Score logic
            desc_score = row.description_score
            if desc_score >= 0.7:
                desc_status = "matched"
            elif desc_score >= 0.4:
                desc_status = "partial"
            else:
                desc_status = "mismatched"

            # Unit Price Match
            unit_price_match = bill_item.unit_price == po_item.unit_price

            # Quantity match (bill quantity <= po quantity)
            quantity_match = bill_item.quantity <= po_item.quantity

            # Overall status logic
            if desc_status == "matched" and unit_price_match and quantity_match:
                overall_status = "matched"
            elif desc_status == "mismatched" or not unit_price_match:
                overall_status = "mismatched"
            else:
                overall_status = "partial"

            result = MatchResult(
                organization=organization,
                bill=bill,
                purchase_order=purchase_order,
                bill_item=bill_item,
                purchase_order_item=po_item,
                match_type="two_way",
                description_score=desc_score,
                description_status=desc_status,
                unit_price_status=unit_price_match,
                quantity_status=quantity_match,
                overall_status=overall_status,
            )

            results.append(result)
            used_bill_items.add(bill_item.id)
            used_po_items.add(po_item.id)

        MatchResult.objects.bulk_create(results)
        Bill.objects.filter(id=bill.id).update(matching_progress="completed")
    except Exception:
        pass

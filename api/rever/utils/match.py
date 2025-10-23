import logging
from functools import lru_cache

import numpy as np
from django.core.cache import cache
from django.db import IntegrityError, transaction
from django.db.models import Count, Q

from rever.bgtasks.match_task import async_generate_match_results
from rever.db.models import Bill, BillItem, MatchMatrix, MatchResult, PurchaseOrderItem
from rever.services.matching.rules import check_match

from .embedding import model

logger = logging.getLogger(__name__)


@lru_cache(maxsize=8192)
def _encode_cached(text: str) -> np.ndarray:
    # Normalize + cache embeddings; no progress bars
    return model.encode(
        (text or "").strip(),
        convert_to_numpy=True,
        normalize_embeddings=True,
        show_progress_bar=False,
    )


def get_similarity_score(text1, text2):
    v1 = _encode_cached(text1)
    v2 = _encode_cached(text2)
    # cosine similarity for normalized vectors == dot product
    return round(float(np.dot(v1, v2)), 4)


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
    if not bill.purchase_order_id:
        Bill.objects.filter(id=bill.id).update(matching_progress="completed")
        return
    try:
        with transaction.atomic():
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
                desc_score = float(row.description_score)
                st = check_match(desc_score=desc_score, bill_item=bill_item, po_item=po_item)

                result = MatchResult(
                    organization=organization,
                    bill=bill,
                    purchase_order=purchase_order,
                    bill_item=bill_item,
                    purchase_order_item=po_item,
                    match_type="two_way",
                    description_score=desc_score,
                    description_status=st.description_status,
                    unit_price_status=st.unit_price_status,
                    quantity_status=st.quantity_status,
                    overall_status=st.overall_status,
                )

                results.append(result)
                used_bill_items.add(bill_item.id)
                used_po_items.add(po_item.id)

            MatchResult.objects.bulk_create(results)
            # compute and apply bill-level match_status in a single aggregate + update
            agg = MatchResult.objects.filter(bill=bill).aggregate(
                total=Count("pk"),
                matched=Count("pk", filter=Q(overall_status="matched")),
                mismatched=Count("pk", filter=Q(overall_status="mismatched")),
            )
            total = agg.get("total", 0) or 0
            if total == 0:
                computed_status = "pending"
            else:
                matched = agg.get("matched", 0) or 0
                mismatched = agg.get("mismatched", 0) or 0
                if matched == total:
                    computed_status = "matched"
                elif mismatched == total:
                    computed_status = "mismatched"
                else:
                    computed_status = "partial"

            Bill.objects.filter(id=bill.id).update(
                matching_progress="completed", match_status=computed_status
            )

    except IntegrityError as e:
        logger.warning(
            "generate_match_results IntegrityError for bill %s: %s", getattr(bill, "id", None), e
        )
        raise
    except Exception:
        pass

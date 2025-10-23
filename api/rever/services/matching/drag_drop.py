from dataclasses import dataclass

from django.db import transaction
from django.db.models import Count
from django.db.models import Q as QQ

from rever.db.models import Bill, BillItem, MatchResult, PurchaseOrderItem
from rever.utils.match import get_similarity_score

from .rules import check_match


@dataclass
class StatusPack:
    description_score: float
    description_status: str
    unit_price_status: bool
    quantity_status: bool
    overall_status: str


def _calculate_match_statuses(bill_item: BillItem, po_item: PurchaseOrderItem) -> StatusPack:
    """
    Compute statuses ONLY from the two items' data. No MatchMatrix usage/updates.
    """
    # description similarity on the fly
    score = get_similarity_score(bill_item.description or "", po_item.description or "")

    desc_score = float(score)
    st = check_match(desc_score=desc_score, bill_item=bill_item, po_item=po_item)

    return StatusPack(
        description_score=round(desc_score, 4),
        description_status=st.description_status,
        unit_price_status=st.unit_price_status,
        quantity_status=st.quantity_status,
        overall_status=st.overall_status,
    )


def _lock_existing_match_results(
    bill: Bill, bill_item: BillItem | None, po_item: PurchaseOrderItem | None
):
    r_bill = r_po = None
    if bill_item:
        r_bill = (
            MatchResult.objects.select_for_update().filter(bill=bill, bill_item=bill_item).first()
        )
    if po_item:
        r_po = (
            MatchResult.objects.select_for_update()
            .filter(bill=bill, purchase_order_item=po_item)
            .first()
        )
    return r_bill, r_po


def _update_bill_match_summary(bill: Bill) -> None:
    agg = MatchResult.objects.filter(bill=bill).aggregate(
        total=Count("pk"),
        matched=Count("pk", filter=QQ(overall_status="matched")),
        mismatched=Count("pk", filter=QQ(overall_status="mismatched")),
    )
    total = agg.get("total") or 0
    if total == 0:
        status = "pending"
    else:
        matched = agg.get("matched") or 0
        mismatched = agg.get("mismatched") or 0
        status = (
            "matched" if matched == total else ("mismatched" if mismatched == total else "partial")
        )
    Bill.objects.filter(id=bill.id).update(match_status=status, matching_progress="completed")


def _update_match_result_with_pair(
    row: MatchResult, bill_item: BillItem, po_item: PurchaseOrderItem
) -> MatchResult:
    """Set bill/po on a row and apply fresh statuses."""
    st = _calculate_match_statuses(bill_item, po_item)
    row.bill_item = bill_item
    row.purchase_order_item = po_item
    row.description_score = st.description_score
    row.description_status = st.description_status
    row.unit_price_status = st.unit_price_status
    row.quantity_status = st.quantity_status
    row.overall_status = st.overall_status
    row.save()
    return row


@transaction.atomic
def pair_bill_item_with_po_item(
    *, bill_id: str, bill_item_id: str, po_item_id: str, user=None
) -> MatchResult:
    bill_item = BillItem.objects.select_related("bill").get(id=bill_item_id)
    po_item = PurchaseOrderItem.objects.select_related("purchase_order").get(id=po_item_id)
    bill = bill_item.bill

    # Validate same PO scope
    if not bill.purchase_order_id or bill.purchase_order_id != po_item.purchase_order_id:
        raise ValueError("PO item must belong to the Bill's Purchase Order.")

    row_bill, row_po = _lock_existing_match_results(bill, bill_item, po_item)

    # Idempotent no-op
    if row_bill and row_bill.purchase_order_item_id == po_item.id:
        return row_bill

    # SWAP (both exist, different rows)
    if row_bill and row_po and row_bill.id != row_po.id:
        old_po = row_bill.purchase_order_item  # PO-X
        # free unique constraint (org, po_item, bill)
        row_po.purchase_order_item = None
        row_po.save(update_fields=["purchase_order_item"])
        # bill row gets dragged PO (PO-Y)
        _update_match_result_with_pair(row_bill, row_bill.bill_item, po_item)
        # po row gets old PO-X (if any)
        if old_po:
            _update_match_result_with_pair(row_po, row_po.bill_item, old_po)
        _update_bill_match_summary(bill)
        return row_bill

    # Only bill row exists → replace its PO
    if row_bill and not row_po:
        _update_match_result_with_pair(row_bill, row_bill.bill_item, po_item)
        _update_bill_match_summary(bill)
        return row_bill

    # Only PO row exists → move to this bill item
    if row_po and not row_bill:
        _update_match_result_with_pair(row_po, bill_item, row_po.purchase_order_item)
        _update_bill_match_summary(bill)
        return row_po

    # Neither exists → create
    st = _calculate_match_statuses(bill_item, po_item)
    mr = MatchResult.objects.create(
        organization=bill.organization,
        bill=bill,
        purchase_order=bill.purchase_order,
        bill_item=bill_item,
        purchase_order_item=po_item,
        match_type="two_way",
        description_score=st.description_score,
        description_status=st.description_status,
        unit_price_status=st.unit_price_status,
        quantity_status=st.quantity_status,
        overall_status=st.overall_status,
    )
    _update_bill_match_summary(bill)
    return mr

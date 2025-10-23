from dataclasses import dataclass

from django.conf import settings

from rever.db.models import BillItem, PurchaseOrderItem


@dataclass(frozen=True)
class LineStatus:
    description_status: str
    unit_price_status: bool
    quantity_status: bool
    overall_status: str


def check_match(
    *,
    desc_score: float,
    bill_item: BillItem,
    po_item: PurchaseOrderItem,
    match_threshold: float = settings.MATCH_THRESHOLD,
) -> LineStatus:
    """
    Given an already-computed desc_score, derive the 4 status fields.
    Mirrors your existing logic exactly.
    """
    desc_status = "matched" if desc_score >= match_threshold else "mismatched"

    unit_price_status = bill_item.unit_price == po_item.unit_price

    quantity_status = bill_item.quantity <= (
        po_item.quantity - po_item.pending_approval_quantity - po_item.received_quantity
    )

    overall_status = (
        "matched"
        if (desc_status == "matched" and unit_price_status and quantity_status)
        else "mismatched"
    )

    return LineStatus(
        description_status=desc_status,
        unit_price_status=unit_price_status,
        quantity_status=quantity_status,
        overall_status=overall_status,
    )

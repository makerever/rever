import logging
from decimal import Decimal

from django.db import transaction
from django.db.models import F, Value
from django.db.models.functions import Greatest
from django.db.models.signals import post_delete, post_save, pre_save
from django.dispatch import receiver

from rever.db.models import Bill, MatchResult, PurchaseOrderItem

logger = logging.getLogger(__name__)


@receiver(pre_save, sender=Bill)
def apply_poitem_quantities_on_status_change(sender, instance, **kwargs):
    if not instance.pk or not instance.purchase_order_id:
        return
    try:
        previous = Bill.objects.get(pk=instance.pk)
    except Bill.DoesNotExist:
        return

    prev_status = previous.status
    curr_status = instance.status

    if prev_status == curr_status:
        return
    # Only act for the same bill's current matches
    matches = MatchResult.objects.select_related("purchase_order_item", "bill_item").filter(
        bill=instance
    )

    def _qty(match) -> Decimal:
        return match.bill_item.quantity or Decimal("0")

    touched_po_ids = set()

    @transaction.atomic
    def _reserve(match):
        if match.reserved_qty_applied or not match.purchase_order_item_id:
            return
        qty = _qty(match)
        po_id = match.purchase_order_item_id
        PurchaseOrderItem.objects.select_for_update().filter(pk=po_id).update(
            pending_approval_quantity=F("pending_approval_quantity") + qty
        )
        match.reserved_qty_applied = True
        match.save(update_fields=["reserved_qty_applied"])
        touched_po_ids.add(po_id)

    @transaction.atomic
    def _unreserve(match):
        if not match.reserved_qty_applied or not match.purchase_order_item_id:
            return
        qty = _qty(match)
        po_id = match.purchase_order_item_id
        PurchaseOrderItem.objects.select_for_update().filter(pk=po_id).update(
            pending_approval_quantity=Greatest(
                F("pending_approval_quantity") - Value(qty), Value(0)
            )
        )
        match.reserved_qty_applied = False
        match.save(update_fields=["reserved_qty_applied"])
        touched_po_ids.add(po_id)

    @transaction.atomic
    def _receive(match):
        if match.received_qty_applied or not match.purchase_order_item_id:
            return
        qty = _qty(match)
        po_id = match.purchase_order_item_id
        PurchaseOrderItem.objects.select_for_update().filter(pk=po_id).update(
            received_quantity=F("received_quantity") + qty
        )
        match.received_qty_applied = True
        match.save(update_fields=["received_qty_applied"])
        touched_po_ids.add(po_id)

    @transaction.atomic
    def _unreceive(match):
        if not match.received_qty_applied or not match.purchase_order_item_id:
            return
        qty = _qty(match)
        po_id = match.purchase_order_item_id
        PurchaseOrderItem.objects.select_for_update().filter(pk=po_id).update(
            received_quantity=Greatest(F("received_quantity") - Value(qty), Value(0))
        )
        match.received_qty_applied = False
        match.save(update_fields=["received_qty_applied"])
        touched_po_ids.add(po_id)

    def _batch_recompute_line_status(po_ids: set[int]):
        # recompute once per touched item to avoid N extra queries in inner helpers
        for po_id in po_ids:
            poi = PurchaseOrderItem.objects.get(pk=po_id)
            poi.recompute_line_status()
            poi.save(update_fields=["line_status"])

    with transaction.atomic():
        if prev_status == "in_review" and curr_status == "under_approval":
            for m in matches:
                if m.purchase_order_item_id and m.bill_item_id:
                    _reserve(m)

        elif prev_status == "under_approval" and curr_status == "approved":
            for m in matches:
                if m.purchase_order_item_id and m.bill_item_id:
                    if m.reserved_qty_applied:
                        _unreserve(m)
                    _receive(m)

        elif prev_status == "in_review" and curr_status == "approved":
            for m in matches:
                if m.purchase_order_item_id and m.bill_item_id:
                    _receive(m)

        elif prev_status == "under_approval" and curr_status in ["in_review", "rejected"]:
            for m in matches:
                if m.purchase_order_item_id and m.bill_item_id:
                    _unreserve(m)

        _batch_recompute_line_status(touched_po_ids)


@receiver(post_save, sender=Bill)
def handle_bill_save(sender, instance, created, **kwargs):
    instance.update_duplicate_flags()
    # If bill_number or vendor changed, also update for the old combination
    if (
        hasattr(instance, "_old_vendor")
        and hasattr(instance, "_old_bill_number")
        and (
            instance._old_vendor != instance.vendor
            or instance._old_bill_number != instance.bill_number
        )
    ):
        dummy = Bill(
            vendor=instance._old_vendor,
            bill_number=instance._old_bill_number,
            organization=instance.organization,
        )
        dummy.update_duplicate_flags()


@receiver(post_delete, sender=Bill)
def handle_bill_delete(sender, instance, **kwargs):
    Bill.objects.filter(
        vendor=instance.vendor,
        bill_number=instance.bill_number,
        organization=instance.organization,
    ).update(
        is_duplicate=(
            Bill.objects.filter(
                vendor=instance.vendor,
                bill_number=instance.bill_number,
                organization=instance.organization,
            ).count()
            > 1
        )
    )

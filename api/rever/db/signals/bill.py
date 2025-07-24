from django.db.models.signals import post_delete, post_save, pre_save
from django.dispatch import receiver

from rever.db.models import Bill, MatchResult


@receiver(pre_save, sender=Bill)
def apply_received_quantity_on_status_change(sender, instance, **kwargs):
    if not instance.pk:
        return

    if instance.organization.matching_type != "two_way":
        return

    try:
        previous = Bill.objects.get(pk=instance.pk)
    except Bill.DoesNotExist:
        return

    if (
        previous.status == "in_review"
        and instance.status in ["under_approval", "approved"]
        and instance.purchase_order
    ):
        match_results = MatchResult.objects.filter(bill=instance, is_quantity_posted=False)
        for match in match_results:
            po_item = match.purchase_order_item
            bill_item = match.bill_item

            if po_item and bill_item:
                po_item.received_quantity = (po_item.received_quantity or 0) + bill_item.quantity
                po_item.save(update_fields=["received_quantity"])
                match.is_quantity_posted = True
                match.save(update_fields=["is_quantity_posted"])

    elif (
        previous.status in ["under_approval", "approved"]
        and instance.status in ["in_review", "rejected"]
        and instance.purchase_order
    ):
        match_results = MatchResult.objects.filter(bill=instance, is_quantity_posted=True)
        for match in match_results:
            po_item = match.purchase_order_item
            bill_item = match.bill_item

            if po_item and bill_item:
                po_item.received_quantity = max(
                    0, (po_item.received_quantity or 0) - bill_item.quantity
                )
                po_item.save(update_fields=["received_quantity"])
                match.is_quantity_posted = False
                match.save(update_fields=["is_quantity_posted"])


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

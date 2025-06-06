from django.db.models.signals import post_save
from django.dispatch import receiver

from rever.bgtasks import async_match_all_items, async_match_single_item
from rever.db.models import Bill, BillItem


@receiver(post_save, sender=Bill)
def trigger_matching_when_po_added(sender, instance, **kwargs):
    if (
        instance.status == "in_review"
        and instance.purchase_order
        and instance.organization.matching_type == "two_way"
    ):
        async_match_all_items.delay(str(instance.id))


@receiver(post_save, sender=BillItem)
def trigger_matching_on_billitem_update(sender, instance, **kwargs):
    bill = instance.bill
    if (
        bill.status == "in_review"
        and bill.purchase_order
        and bill.organization.matching_type == "two_way"
    ):
        async_match_single_item.delay(str(instance.id))

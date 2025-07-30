from django.db import transaction
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from rever.bgtasks import async_regenerate_matrix_v2
from rever.db.models import Bill, BillItem


@receiver(post_save, sender=Bill)
def trigger_matrix_on_bill_update(sender, instance, created, **kwargs):
    if instance.status == "in_review" and instance.purchase_order:
        transaction.on_commit(lambda: async_regenerate_matrix_v2.delay(str(instance.id)))


@receiver(post_save, sender=BillItem)
def trigger_matrix_on_bill_item_save(sender, instance, **kwargs):
    bill = instance.bill
    if bill.status == "in_review" and bill.purchase_order:
        transaction.on_commit(lambda: async_regenerate_matrix_v2.delay(str(bill.id)))


@receiver(post_delete, sender=BillItem)
def trigger_matrix_on_bill_item_delete(sender, instance, **kwargs):
    bill = instance.bill
    if bill.status == "in_review" and bill.purchase_order:
        transaction.on_commit(lambda: async_regenerate_matrix_v2.delay(str(bill.id)))

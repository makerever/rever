from django.db.models.signals import pre_save
from django.dispatch import receiver
from rever.db.models import Bill, MatchResult

@receiver(pre_save, sender=Bill)
def apply_received_quantity_on_status_change(sender, instance, **kwargs):
    if not instance.pk:
        return  
    
    if not instance.purchase_order:
        return 
    
    from rever.db.models import PurchaseOrderItem

    previous = Bill.objects.get(pk=instance.pk)

    if (
        previous.status == "in_review"
        and instance.status in ["under_approval", "approved"]
    ):
        match_results = MatchResult.objects.filter(
            bill=instance, is_quantity_posted=False
        )
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
        and instance.status == "in_review"
    ):
        match_results = MatchResult.objects.filter(
            bill=instance, is_quantity_posted=True
        )
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
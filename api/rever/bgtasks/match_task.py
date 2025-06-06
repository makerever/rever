from celery import shared_task


@shared_task
def async_match_all_items(bill_id):
    from rever.db.models import Bill
    from rever.utils.match import match_items

    try:
        bill = (
            Bill.objects.select_related("purchase_order")
            .prefetch_related("items", "purchase_order__items")
            .get(id=bill_id)
        )
        match_items(bill)
    except Bill.DoesNotExist:
        pass


@shared_task
def async_match_single_item(bill_item_id):
    from rever.db.models import BillItem
    from rever.utils.match import match_single_item

    try:
        item = BillItem.objects.select_related("bill__purchase_order").get(id=bill_item_id)
        match_single_item(item)
    except BillItem.DoesNotExist:
        pass

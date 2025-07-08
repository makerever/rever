from celery import shared_task


@shared_task
def async_regenerate_matrix_v2(bill_id):
    from django.db import transaction

    from rever.db.models import Bill
    from rever.utils.match import _regenerate_matrix_safely

    try:
        # Use update() to avoid triggering signals or save()
        Bill.objects.filter(id=bill_id).update(matching_progress="in_progress")

        bill = Bill.objects.select_related("purchase_order").get(id=bill_id)
        transaction.on_commit(lambda: _regenerate_matrix_safely(bill))
    except Bill.DoesNotExist:
        pass


@shared_task  # Optional: use specific queue
def async_generate_match_results(bill_id):
    from django.db import transaction

    from rever.db.models import Bill
    from rever.utils.match import generate_match_results

    try:
        bill = Bill.objects.select_related("organization", "purchase_order").get(id=bill_id)
        transaction.on_commit(lambda: generate_match_results(bill))
    except Bill.DoesNotExist:
        pass  # Optionally log error

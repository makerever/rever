from calendar import monthrange

from celery import shared_task
from dateutil.relativedelta import relativedelta
from django.core.cache import cache
from django.db.models import Count, Sum
from django.utils.timezone import now


@shared_task
def generate_bill_summary(user_id, organization_id, filter_type, include_inactive, cache_key):
    from rever.db.models import Bill

    today = now().date()
    first_day_of_this_month = today.replace(day=1)
    end_day = monthrange(today.year, today.month)[1]
    last_day_of_this_month = today.replace(day=end_day)

    if filter_type == "this_month":
        start_date = first_day_of_this_month
        end_date = last_day_of_this_month

    elif filter_type in {"last_3_months", "last_6_months", "last_12_months"}:
        months = int(filter_type.split("_")[1])
        start_date = first_day_of_this_month - relativedelta(months=months - 1)
        end_date = last_day_of_this_month
    else:
        cache.set(cache_key, {"error": "Invalid date filter."}, timeout=600)
        return {"error": "Invalid date filter."}

    bills = Bill.objects.filter(
        organization_id=organization_id,
        bill_date__gte=start_date,
        bill_date__lte=end_date,
    ).exclude(status__in=["draft", "rejected"])

    if not include_inactive:
        bills = bills.filter(is_active=True)

    summary = bills.values("status").annotate(total=Sum("total"), count=Count("id"))

    by_status = {
        item["status"]: {"count": item["count"], "total": item["total"]} for item in summary
    }

    result = {
        "total_amount": bills.aggregate(Sum("total"))["total__sum"] or 0,
        "total_count": bills.count(),
        "by_status": by_status,
    }

    cache.set(cache_key, result, timeout=3600)
    return result

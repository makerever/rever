from calendar import month_name

from celery import shared_task
from dateutil.relativedelta import relativedelta
from django.core.cache import cache
from django.db.models import Count, Sum
from django.utils.timezone import now


@shared_task
def generate_monthly_bill_summary(
    user_id, organization_id, filter_type, include_inactive, cache_key
):
    from rever.db.models import Bill

    today = now().date()
    first_day_of_this_month = today.replace(day=1)
    num_months = {
        "last_3_months": 3,
        "last_6_months": 6,
        "last_12_months": 12,
    }.get(filter_type, 3)

    result = []

    for i in range(num_months):
        target_month = first_day_of_this_month - relativedelta(months=i)
        year = target_month.year
        month = target_month.month

        bills = Bill.objects.filter(
            organization_id=organization_id,
            bill_date__year=year,
            bill_date__month=month,
        ).exclude(status__in=["draft", "rejected"])

        if not include_inactive:
            bills = bills.filter(is_active=True)

        summary = bills.values("status").annotate(total=Sum("total"), count=Count("id"))

        by_status = {
            item["status"]: {"count": item["count"], "total": item["total"]} for item in summary
        }

        result.append(
            {
                "month": month_name[month],
                "year": year,
                "total_amount": bills.aggregate(Sum("total"))["total__sum"] or 0,
                "total_count": bills.count(),
                "by_status": by_status,
            }
        )
    cache.set(cache_key, result, timeout=3600)
    return result

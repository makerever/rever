from django.core.cache import cache


def clear_report_cache(user_id, report_type, periods=None, include_flags=None):
    periods = periods or [
        "this_month",
        "last_3_months",
        "last_6_months",
        "last_12_months",
    ]
    include_flags = include_flags or ["true", "false"]

    for period in periods:
        for flag in include_flags:
            key = f"{report_type}:{user_id}:{period}:{flag}"
            cache.delete(key)

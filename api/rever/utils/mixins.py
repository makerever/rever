from typing import Any

import pytz
from rest_framework import serializers

from rever.utils.date_format import get_python_date_format


class OrganizationDateFormatMixin(serializers.ModelSerializer):
    def to_representation(self, instance: Any) -> dict[str, Any]:
        representation = super().to_representation(instance)

        request = self.context.get("request")
        user = getattr(request, "user", None)
        org = (
            getattr(user, "organization", None)
            if user
            else (instance if hasattr(instance, "date_format") else None)
        )

        if not org or not getattr(org, "date_format", None):
            return representation

        date_format = get_python_date_format(org.date_format)
        user_timezone = getattr(user, "timezone", None)

        for field_name in self.fields:
            field_instance = self.fields[field_name]

            if isinstance(field_instance, serializers.DateField):
                raw_date = getattr(instance, field_name, None)
                if raw_date:
                    representation[field_name] = raw_date.strftime(date_format)

            elif isinstance(field_instance, serializers.DateTimeField):
                raw_datetime = getattr(instance, field_name, None)
                if raw_datetime and user_timezone:
                    user_tz = pytz.timezone(user_timezone)
                    datetime_format = f"{date_format} %H:%M:%S"
                    converted_datetime = raw_datetime.astimezone(user_tz)
                    representation[field_name] = converted_datetime.strftime(datetime_format)

        return representation

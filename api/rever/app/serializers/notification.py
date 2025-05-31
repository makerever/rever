from rest_framework import serializers

from rever.db.models import UserNotificationSetting


class UserNotificationSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserNotificationSetting
        fields = ["notify_on_approval_request", "notify_on_approval_result"]

from rest_framework import serializers

from rever.db.models import UserNotificationPreference


class UserNotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserNotificationPreference
        fields = "__all__"
        read_only_fields = [
            "created_at",
            "updated_at",
        ]

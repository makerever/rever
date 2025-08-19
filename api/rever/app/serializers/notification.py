from django.utils import timezone
from rest_framework import serializers

from rever.db.models import Notification, UserNotificationPreference


class UserNotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserNotificationPreference
        fields = "__all__"
        read_only_fields = [
            "created_at",
            "updated_at",
        ]


class NotificationSerializer(serializers.ModelSerializer):
    time_since_created = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            "id",
            "subject",
            "message",
            "is_read",
            "is_important",
            "priority",
            "notification_type",
            "time_since_created",
            "created_at",
            "read_at",
            "organization",
            "action_url",
            "object_name",
            "object_id",
        ]
        read_only_fields = ["id", "created_at", "read_at", "time_since_created", "organization"]

    def get_time_since_created(self, obj):
        now = timezone.now()
        diff = now - obj.created_at

        if diff.days > 0:
            return f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
        elif diff.seconds > 3600:
            hours = diff.seconds // 3600
            return f"{hours} hour{'s' if hours > 1 else ''} ago"
        elif diff.seconds > 60:
            minutes = diff.seconds // 60
            return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
        else:
            return "Just now"


class NotificationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            "subject",
            "message",
            "is_important",
            "priority",
            "notification_type",
            "action_url",
            "object_name",
            "object_id",
        ]

    def validate_subject(self, value):
        if not value or len(value.strip()) < 3:
            raise serializers.ValidationError("Subject must be at least 3 characters long.")
        return value.strip()

    def validate_message(self, value):
        if not value or len(value.strip()) < 5:
            raise serializers.ValidationError("Message must be at least 5 characters long.")
        return value.strip()

    def create(self, validated_data):
        request = self.context.get("request")
        validated_data["organization"] = request.user.organization
        validated_data["owner"] = request.user
        return super().create(validated_data)


class NotificationUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["is_read", "is_important"]

    def update(self, instance, validated_data):
        if "is_read" in validated_data and validated_data["is_read"] and not instance.is_read:
            validated_data["read_at"] = timezone.now()
        return super().update(instance, validated_data)


class NotificationBulkUpdateSerializer(serializers.Serializer):
    """For bulk operations like mark all as read"""

    notification_ids = serializers.ListField(child=serializers.UUIDField(), required=False)
    is_read = serializers.BooleanField(required=False)
    is_important = serializers.BooleanField(required=False)

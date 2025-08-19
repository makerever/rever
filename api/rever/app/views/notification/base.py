from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from rever.app.serializers import (
    NotificationCreateSerializer,
    NotificationSerializer,
    NotificationUpdateSerializer,
    UserNotificationPreferenceSerializer,
)
from rever.app.views.base import BaseAPIView
from rever.db.models import Notification, UserNotificationPreference


class UserNotificationPreferenceAPIView(BaseAPIView):
    def get(self, request):
        setting, _ = UserNotificationPreference.objects.get_or_create(user=request.user)
        serializer = UserNotificationPreferenceSerializer(setting)
        return Response(serializer.data)

    def patch(self, request):
        setting, _ = UserNotificationPreference.objects.get_or_create(user=request.user)
        serializer = UserNotificationPreferenceSerializer(setting, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)


class NotificationViewSet(ModelViewSet):
    """
    Complete CRUD operations for notifications with advanced filtering and bulk operations
    """

    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["is_read", "is_important", "priority", "notification_type"]
    ordering_fields = ["created_at", "priority", "is_important"]
    ordering = ["-created_at"]

    def get_queryset(self):
        """Return notifications for current user's organization only"""
        return Notification.objects.for_user(self.request.user).active()

    def get_serializer_class(self):
        """Use different serializers for different operations"""
        if self.action == "create":
            return NotificationCreateSerializer
        elif self.action in ["update", "partial_update"]:
            return NotificationUpdateSerializer
        return NotificationSerializer

    @action(detail=False, methods=["post"])
    def mark_all_read(self, request):
        """Mark all notifications as read for the current user"""
        updated = self.get_queryset().unread().mark_all_read()
        return Response(
            {"message": f"{updated} notifications marked as read", "updated_count": updated}
        )

    @action(detail=True, methods=["post"])
    def mark_read(self, request, pk=None):
        """Mark a specific notification as read"""
        notification = self.get_object()
        notification.mark_as_read()
        return Response(
            {
                "message": "Notification marked as read",
                "is_read": notification.is_read,
                "read_at": notification.read_at,
            }
        )

    @action(detail=False, methods=["get"])
    def unread_count(self, request):
        """Get count of unread notifications"""
        count = self.get_queryset().unread().count()
        return Response({"unread_count": count})

    @action(detail=False, methods=["get"])
    def summary(self, request):
        """Get notification summary stats"""
        queryset = self.get_queryset()
        return Response(
            {
                "total": queryset.count(),
                "unread": queryset.unread().count(),
                "important": queryset.important().count(),
                "urgent": queryset.by_priority("urgent").count(),
                "by_type": {
                    "info": queryset.by_type("info").count(),
                    "success": queryset.by_type("success").count(),
                    "warning": queryset.by_type("warning").count(),
                    "error": queryset.by_type("error").count(),
                    "approval": queryset.by_type("approval").count(),
                    "system": queryset.by_type("system").count(),
                },
            }
        )

    @action(detail=False, methods=["get"])
    def recent(self, request):
        """Get recent notifications (last 24 hours)"""
        from datetime import timedelta

        yesterday = timezone.now() - timedelta(days=1)
        recent_notifications = self.get_queryset().filter(created_at__gte=yesterday)

        serializer = self.get_serializer(recent_notifications, many=True)
        return Response({"count": recent_notifications.count(), "notifications": serializer.data})

    @action(detail=False, methods=["post"])
    def bulk_update(self, request):
        """Bulk update notifications (mark multiple as read/important)"""
        notification_ids = request.data.get("notification_ids", [])
        is_read = request.data.get("is_read")
        is_important = request.data.get("is_important")

        if not notification_ids:
            return Response(
                {"error": "notification_ids is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        queryset = self.get_queryset().filter(id__in=notification_ids)

        update_fields = {}
        if is_read is not None:
            update_fields["is_read"] = is_read
            if is_read:
                update_fields["read_at"] = timezone.now()

        if is_important is not None:
            update_fields["is_important"] = is_important

        if update_fields:
            updated = queryset.update(**update_fields)
            return Response(
                {"message": f"{updated} notifications updated", "updated_count": updated}
            )

        return Response(
            {"error": "No valid update fields provided"}, status=status.HTTP_400_BAD_REQUEST
        )

    def destroy(self, request, *args, **kwargs):
        """Soft delete notification instead of hard delete"""
        notification = self.get_object()
        notification.soft_delete()
        return Response(
            {"message": "Notification deleted successfully"}, status=status.HTTP_204_NO_CONTENT
        )

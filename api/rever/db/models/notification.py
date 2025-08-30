from django.conf import settings
from django.db import models
from django.utils import timezone

from .base import BaseModel


class UserNotificationPreference(BaseModel):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="user_notification_preference",
    )
    notify_on_approval_request = models.BooleanField(
        default=True
    )  # For approver who receives the request
    notify_on_approval_result = models.BooleanField(
        default=True
    )  # For sender who receives the result

    class Meta:
        db_table = "user_notification_preferences"
        verbose_name = "UserNotificationPreference"
        verbose_name_plural = "UserNotificationPreferences"
        ordering = ("-created_at",)


class NotificationQuerySet(models.QuerySet):
    def active(self):
        return self.filter(is_deleted=False)

    def unread(self):
        return self.filter(is_read=False, is_deleted=False)

    def for_user(self, user):
        return self.filter(organization=user.organization, owner=user, is_deleted=False)

    def by_priority(self, priority):
        return self.filter(priority=priority)

    def important(self):
        return self.filter(is_important=True)

    def by_type(self, notification_type):
        return self.filter(notification_type=notification_type)

    def mark_all_read(self):
        """Bulk mark as read - very efficient for large datasets"""
        return self.filter(is_read=False).update(is_read=True, read_at=timezone.now())

    def for_object(self, object_name: str, object_id):
        return self.filter(object_name=object_name.lower(), object_id=object_id, is_deleted=False)

    def for_bill(self, bill_id):
        return self.for_object("bill", bill_id)

    def for_purchase_order(self, po_id):
        return self.for_object("purchaseorder", po_id)


class Notification(BaseModel):
    PRIORITY_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
        ("urgent", "Urgent"),
    ]
    TYPE_CHOICES = [
        ("info", "Information"),
        ("success", "Success"),
        ("warning", "Warning"),
        ("error", "Error"),
        ("approval", "Approval Required"),
        ("system", "System Notification"),
    ]
    organization = models.ForeignKey(
        "Organization", on_delete=models.CASCADE, related_name="notifications"
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications"
    )
    subject = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    is_important = models.BooleanField(default=False)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default="medium")
    notification_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default="info")
    read_at = models.DateTimeField(null=True, blank=True)
    action_url = models.CharField(max_length=500, null=True, blank=True)

    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    object_name = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        help_text="Lowercase model name, e.g., 'bill', 'purchaseorder'.",
    )
    object_id = models.UUIDField(
        null=True,
        blank=True,
        db_index=True,
        help_text="UUID of the referenced object (e.g., Bill.id or PurchaseOrder.id).",
    )

    objects = NotificationQuerySet.as_manager()

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["organization", "owner", "is_read"]),
            models.Index(fields=["organization", "owner", "is_important"]),
            models.Index(fields=["created_at"]),
            models.Index(fields=["organization", "owner", "is_deleted", "created_at"]),
            models.Index(fields=["priority", "created_at"]),
            models.Index(fields=["organization", "owner", "object_name", "object_id"]),
        ]
        db_table = "notifications"
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"

    def mark_as_read(self):
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=["is_read", "read_at"])

    def soft_delete(self):
        """Soft delete the notification"""
        if not self.is_deleted:
            self.is_deleted = True
            self.deleted_at = timezone.now()
            self.save(update_fields=["is_deleted", "deleted_at"])

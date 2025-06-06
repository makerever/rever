from django.conf import settings
from django.db import models

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

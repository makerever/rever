from django.conf import settings
from django.db import models


class UserNotificationSetting(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notification_settings",
    )
    notify_on_approval_request = models.BooleanField(
        default=True
    )  # For approver who receives the request
    notify_on_approval_result = models.BooleanField(
        default=True
    )  # For sender who receives the result

    class Meta:
        db_table = "user_notification_settings"
        verbose_name = "Notification Setting"
        verbose_name_plural = "Notification Settings"

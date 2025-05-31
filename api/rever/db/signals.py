from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver

from rever.db.models import UserNotificationSetting


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_user_notification_setting(sender, instance, created, **kwargs):
    if created:
        UserNotificationSetting.objects.get_or_create(user=instance)

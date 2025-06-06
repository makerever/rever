from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from rever.db.models import Attachment, Bill, PurchaseOrder


@receiver([post_save, post_delete], sender=Attachment)
def update_is_attachment_flag(sender, instance, **kwargs):
    model_class = instance.content_type.model_class()

    if model_class not in [Bill, PurchaseOrder]:
        return  # only handle known models

    try:
        related_obj = model_class.objects.get(id=instance.object_id)
    except model_class.DoesNotExist:
        return

    attachment_count = Attachment.objects.filter(
        content_type=instance.content_type, object_id=instance.object_id
    ).count()

    related_obj.is_attachment = attachment_count > 0
    related_obj.save(update_fields=["is_attachment"])

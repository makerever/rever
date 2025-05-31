import datetime
import uuid
from pathlib import Path

from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models

from rever.db.models.auth import Organization
from rever.utils.storage_backends import S3MediaStorage


def custom_attachment_upload_path(instance, filename):
    # Get timestamp
    now = datetime.datetime.now()
    year = now.strftime("%Y")
    month = now.strftime("%m")

    # Get organization ID from the linked object (e.g., Bill, PurchaseOrder)
    try:
        organization_id = str(instance.content_object.organization.id)
    except AttributeError:
        organization_id = "unknown-org"

    model_name = instance.content_type.model
    return Path("organizations", organization_id, model_name, year, month, filename)


class Attachment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="attachments"
    )
    file = models.FileField(upload_to=custom_attachment_upload_path, storage=S3MediaStorage())
    file_name = models.CharField(max_length=255)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.UUIDField()
    content_object = GenericForeignKey("content_type", "object_id")

    class Meta:
        unique_together = ("content_type", "object_id")
        indexes = [
            models.Index(fields=["content_type", "object_id"]),
        ]
        verbose_name = "Attachment"
        verbose_name_plural = "Attachments"
        db_table = "attachments"

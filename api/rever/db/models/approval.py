from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models

from .base import BaseModel

ACTION_TYPE_CHOICES = [
    ("under_approval", "Under Approval"),
    ("approved", "Approved"),
    ("rejected", "Rejected"),
]


class ApprovalConfig(BaseModel):
    organization = models.ForeignKey("Organization", on_delete=models.CASCADE)
    model_name = models.CharField(max_length=100)
    approval_enabled = models.BooleanField(default=False)

    class Meta:
        unique_together = ("organization", "model_name")
        db_table = "approval_configs"
        verbose_name = "ApprovalConfig"
        verbose_name_plural = "ApprovalConfigs"


class ApprovalFlow(BaseModel):
    organization = models.ForeignKey("Organization", on_delete=models.CASCADE)
    model_name = models.CharField(max_length=100)
    approver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)

    class Meta:
        unique_together = ("organization", "model_name")
        db_table = "approval_flows"
        verbose_name = "ApprovalFlow"
        verbose_name_plural = "ApprovalFlows"


class ApprovalLog(BaseModel):
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.UUIDField()
    content_object = GenericForeignKey("content_type", "object_id")

    organization = models.ForeignKey("Organization", on_delete=models.CASCADE)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )

    approval_sent_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="approval_requests_sent",
    )
    approval_sent_at = models.DateTimeField(null=True, blank=True)

    action_type = models.CharField(max_length=20, choices=ACTION_TYPE_CHOICES)
    comment = models.TextField(blank=True)

    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        # unique_together = ('content_type', 'object_id')
        db_table = "approval_logs"
        verbose_name = "ApprovalLog"
        verbose_name_plural = "ApprovalLogs"

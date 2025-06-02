from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models

ACTION_TYPE_CHOICES = [
    ("under_approval", "Under Approval"),
    ("approved", "Approved"),
    ("rejected", "Rejected"),
]


class ApprovalSetting(models.Model):
    organization = models.ForeignKey("Organization", on_delete=models.CASCADE)
    model_name = models.CharField(max_length=100)
    approval_enabled = models.BooleanField(default=False)

    class Meta:
        unique_together = ("organization", "model_name")
        db_table = "approvalsettings"
        verbose_name = "Approval Setting"
        verbose_name_plural = "Approval Settings"


class ApprovalAssignment(models.Model):
    organization = models.ForeignKey("Organization", on_delete=models.CASCADE)
    model_name = models.CharField(max_length=100)
    approver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)

    class Meta:
        unique_together = ("organization", "model_name")
        db_table = "approvalassignments"
        verbose_name = "Approval Assignment"
        verbose_name_plural = "Approval Assignments"


class ApprovalAction(models.Model):
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
        related_name="approval_sent_actions",
    )
    approval_sent_at = models.DateTimeField(null=True, blank=True)

    action_type = models.CharField(max_length=20, choices=ACTION_TYPE_CHOICES)
    comment = models.TextField(blank=True)

    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # unique_together = ('content_type', 'object_id')
        db_table = "approvalactions"
        verbose_name = "Approval Action"
        verbose_name_plural = "Approval Actions"

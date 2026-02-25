from django.db import models

PO_STATUS_CHOICES = [
    ("draft", "Draft"),
    ("in_review", "In-Review"),
    ("under_approval", "Under Approval"),
    ("approved", "Approved"),
    ("rejected", "Rejected"),
    ("closed", "Closed"),
]


class VendorCreditStatus(models.TextChoices):
    DRAFT = "draft", "Draft"
    AUTHORIZED = "authorized", "Authorized"
    PARTIALLY_APPLIED = "partially_applied", "Partially Applied"
    APPLIED = "applied", "Applied / Paid"
    VOIDED = "voided", "Voided"
    DELETED = "deleted", "Deleted"
    IN_REVIEW = "in_review", "In Review"
    UNDER_APPROVAL = "under_approval", "Under Approval"
    APPROVED = "approved", "Approved"
    REJECTED = "rejected", "Rejected"


class LineDetailType(models.TextChoices):
    ACCOUNT_BASED = "account_based", "Account Based"
    ITEM_BASED = "item_based", "Item Based"
    SERVICE = "service", "Service"
    OTHER = "other", "Other"

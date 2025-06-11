import datetime as dt
import secrets
import uuid

from django.contrib.auth import get_user_model
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from django.utils.timezone import get_default_timezone_name
from django.utils.translation import gettext_lazy as _

from .base import BaseModel


class Organization(BaseModel):
    DATE_FORMAT_CHOICES = (
        ("YYYY-MM-DD", _("YYYY-MM-DD")),
        ("DD-MM-YYYY", _("DD-MM-YYYY")),
        ("MM-DD-YYYY", _("MM-DD-YYYY")),
    )
    CURRENCY_CHOICES = [
        ("USD", "US Dollar ($)"),
        ("EUR", "Euro (€)"),
        ("INR", "Indian Rupee (₹)"),
        ("GBP", "British Pound (£)"),
        ("JPY", "Japanese Yen (¥)"),
        ("AUD", "Australian Dollar (A$)"),
        ("CAD", "Canadian Dollar (CA$)"),
        ("CHF", "Swiss Franc (CHF)"),
        ("CNY", "Chinese Yuan (¥)"),
        ("SGD", "Singapore Dollar (S$)"),
        ("NZD", "New Zealand Dollar (NZ$)"),
        ("SEK", "Swedish Krona (kr)"),
    ]

    BUSINESS_TYPE_CHOICES = [
        ("sole_proprietor", "Sole Proprietor"),
        ("partnership", "Partnership"),
        ("llc", "LLC"),
        ("s_corp", "S-Corp"),
        ("c_corp", "C-Corp"),
        ("nonprofit", "Nonprofit"),
        ("government_agency", "Government Agency"),
        ("other", "Other"),
    ]

    INDUSTRY_CHOICES = [
        ("accounting", "Accounting & Bookkeeping"),
        ("legal", "Legal Services"),
        ("retail", "Retail"),
        ("ecommerce", "E-commerce"),
        ("real_estate", "Real Estate"),
        ("restaurants", "Restaurants & Food Services"),
        ("construction", "Construction & Contracting"),
        ("healthcare", "Healthcare & Medical"),
        ("manufacturing", "Manufacturing"),
        ("software", "Software/SaaS"),
        ("nonprofit", "Nonprofit"),
        ("other", "Other"),
    ]

    MATCHING_TYPE_CHOICES = [
        ("none", "None"),
        ("two_way", "2-Way Match"),
        ("three_way", "3-Way Match"),
    ]

    name = models.CharField(max_length=255, unique=True)
    date_format = models.CharField(
        max_length=10,
        choices=DATE_FORMAT_CHOICES,
        default="MM-DD-YYYY",
        help_text=_("Date format to use throughout the application"),
    )
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default="USD")

    business_type = models.CharField(
        max_length=50, choices=BUSINESS_TYPE_CHOICES, null=True, blank=True
    )
    industry = models.CharField(max_length=50, choices=INDUSTRY_CHOICES, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    phone_number = models.CharField(max_length=20, null=True, blank=True)

    address = models.OneToOneField(
        "Address",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="organization_address",
        help_text=_("Primary address of the organization"),
    )

    matching_type = models.CharField(
        max_length=20,
        choices=MATCHING_TYPE_CHOICES,
        default="none",
        help_text=_("Matching logic enabled for this organization (e.g., 2-way, 3-way)"),
    )

    class Meta:
        verbose_name = "Organization"
        verbose_name_plural = "Organizations"
        db_table = "organizations"


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="users", null=True
    )
    email_verified = models.BooleanField(default=False)

    class Role(models.TextChoices):
        SUPER_ADMIN = "admin", "Admin"
        MEMBER = "member", "Member"
        FINANCE_MANAGER = "finance_manager", "Finance Manager"

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.SUPER_ADMIN,
    )

    timezone = models.CharField(
        max_length=100,
        default=get_default_timezone_name,
        help_text="Timezone string like 'Asia/Kolkata', 'America/New_York', etc.",
    )

    invited_by = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="invited_users",
    )
    invited_at = models.DateTimeField(null=True, blank=True)

    REQUIRED_FIELDS = ["email", "first_name", "last_name"]

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"
        db_table = "users"


class VerificationToken(models.Model):
    PURPOSES = [
        ("signup", "Signup"),
        ("reset", "Password reset"),
        ("login", "Login"),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField()
    code = models.CharField(max_length=6)
    purpose = models.CharField(max_length=6, choices=PURPOSES)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)

    class Meta:
        db_table = "verificationtokens"
        verbose_name = "Verification Token"
        verbose_name_plural = "Verification Tokens"
        constraints = [
            models.UniqueConstraint(
                fields=["email", "purpose"],
                condition=models.Q(used=False),
                name="uniq_active_token",
            )
        ]

    @classmethod
    def issue(cls, email, purpose, ttl_minutes: int = 10):
        user = get_user_model()
        if purpose == "signup" and user.objects.filter(email=email, email_verified=True).exists():
            return None

        code = f"{secrets.randbelow(1_000_000):06d}"
        expiry = timezone.now() + dt.timedelta(minutes=ttl_minutes)
        token = cls.objects.filter(email=email, purpose=purpose).order_by("-expires_at").first()
        if token:
            token.code = code
            token.expires_at = expiry
            token.used = False
            token.save(update_fields=["code", "expires_at", "used"])
        else:
            token = cls.objects.create(
                email=email,
                purpose=purpose,
                code=code,
                expires_at=expiry,
            )
        return token

    def is_valid(self, raw_code: str) -> bool:
        return not self.used and self.code == raw_code and self.expires_at > timezone.now()

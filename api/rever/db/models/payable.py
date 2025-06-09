from django.db import models

from rever.utils.bill_constants import PAYMENT_TERM_CHOICES, STATUS_CHOICES

from .auth import Organization
from .base import BaseModel


class Address(BaseModel):
    line1 = models.CharField(max_length=255, blank=True)
    line2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    zip_code = models.CharField(max_length=20, blank=True)
    country = models.CharField(max_length=100, blank=True)

    class Meta:
        verbose_name = "Address"
        verbose_name_plural = "Addresses"
        db_table = "addresses"


class BankAccount(BaseModel):
    account_holder_name = models.CharField(max_length=120, blank=True)
    bank_name = models.CharField(max_length=120, blank=True)
    account_number = models.CharField(max_length=60, blank=True)

    class Meta:
        verbose_name = "Bank Account"
        verbose_name_plural = "Bank Accounts"
        db_table = "bank_accounts"


class Vendor(BaseModel):
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="organization_vendor",
    )

    vendor_name = models.CharField(max_length=120)
    company_name = models.CharField(max_length=120, blank=True)
    email = models.EmailField(blank=True)
    mobile = models.CharField(max_length=30, blank=True)
    tax_id = models.CharField(max_length=50, blank=True)
    account_number = models.CharField(max_length=60, blank=True)

    payment_terms = models.CharField(
        max_length=8, choices=PAYMENT_TERM_CHOICES, blank=True, null=True
    )

    website = models.URLField(blank=True)

    billing_address = models.OneToOneField(
        Address,
        on_delete=models.CASCADE,
        null=True,
        related_name="billing_address_vendor",
    )
    bank_account = models.OneToOneField(
        BankAccount,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="vendor_bank_account",
    )

    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ("organization", "vendor_name")
        verbose_name = "Vendor"
        verbose_name_plural = "Vendors"
        db_table = "vendors"
        ordering = ["vendor_name"]


class Bill(BaseModel):
    bill_number = models.CharField(max_length=50, blank=True)
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="organization_bill",
    )
    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.PROTECT,
        null=True,
        related_name="vendor_bill",
    )
    bill_date = models.DateField(db_index=True)
    due_date = models.DateField(db_index=True)
    payment_terms = models.CharField(
        max_length=8,
        choices=PAYMENT_TERM_CHOICES,
        blank=True,
        null=True,
    )
    comments = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    sub_total = models.DecimalField(max_digits=12, decimal_places=2)
    tax_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    total_tax = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ("organization", "bill_number")
        indexes = [
            models.Index(fields=["organization", "bill_number"]),
        ]
        verbose_name = "Bill"
        verbose_name_plural = "Bills"
        db_table = "bills"
        ordering = ["-bill_date"]

    def save(self, *args, **kwargs):
        # Auto-generate bill_number if blank
        if not self.bill_number:
            last = (
                Bill.objects.filter(organization=self.organization)
                .exclude(bill_number="")
                .order_by("-created_at")
                .first()
            )
            if last and last.bill_number.startswith("Bill-"):
                try:
                    n = int(last.bill_number.split("-", 1)[1])
                except ValueError:
                    n = 0
            else:
                n = 0
            self.bill_number = f"Bill-{n + 1:02d}"
        super().save(*args, **kwargs)


class BillItem(BaseModel):
    bill = models.ForeignKey(Bill, on_delete=models.CASCADE, related_name="items", db_index=True)
    description = models.TextField()
    quantity = models.DecimalField(max_digits=12, decimal_places=2)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    uom = models.CharField(max_length=20, blank=True)
    product_code = models.CharField(max_length=50, blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        verbose_name = "BillItem"
        verbose_name_plural = "BillItems"
        db_table = "bill_items"
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        # Auto-calculate amount if not provided
        if not self.amount:
            self.amount = self.quantity * self.unit_price
        super().save(*args, **kwargs)

from django.db import models, transaction
from simple_history.models import HistoricalRecords

from rever.utils.bill_constants import MATCH_PROGRESS_CHOICES, PAYMENT_TERM_CHOICES, STATUS_CHOICES
from rever.utils.payable_constants import PO_STATUS_CHOICES

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
    history = HistoricalRecords(inherit=True, table_name="vendor_history")
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ("organization", "vendor_name")
        verbose_name = "Vendor"
        verbose_name_plural = "Vendors"
        db_table = "vendors"
        ordering = ["vendor_name"]


class BillCounter(models.Model):
    organization = models.OneToOneField(
        Organization, on_delete=models.CASCADE, related_name="bill_counter"
    )
    last_number = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "bill_counters"

    @classmethod
    def get_next_number(cls, organization):
        import random
        import time

        max_retries = 3
        for attempt in range(max_retries):
            try:
                with transaction.atomic():
                    try:
                        counter = cls.objects.select_for_update().get(organization=organization)
                        counter.last_number += 1
                        counter.save(update_fields=["last_number"])
                        return counter.last_number

                    except cls.DoesNotExist:
                        counter = cls.objects.create(organization=organization, last_number=1)
                        return counter.last_number

            except Exception:
                if attempt == max_retries - 1:
                    raise
                time.sleep(random.uniform(0.01, 0.05))

        raise Exception("Failed to generate Bill number after retries")

    @classmethod
    def generate_bill_number(cls, organization):
        next_num = cls.get_next_number(organization)
        return f"BILL-{next_num:04d}"


class Bill(BaseModel):
    bill_number = models.CharField(
        max_length=50,
        blank=True,
        null=True,
    )
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
    purchase_order = models.ForeignKey(
        "PurchaseOrder",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="linked_bills",
    )
    bill_date = models.DateField(db_index=True)
    due_date = models.DateField(db_index=True)
    payment_terms = models.CharField(
        max_length=8,
        choices=PAYMENT_TERM_CHOICES,
        blank=True,
        null=True,
    )
    matching_progress = models.CharField(
        max_length=60,
        choices=MATCH_PROGRESS_CHOICES,
        default="not_started",
        help_text="Status of line-item matching against purchase order",
    )
    comments = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    sub_total = models.DecimalField(max_digits=12, decimal_places=2)
    tax_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    total_tax = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    is_active = models.BooleanField(default=True)
    is_attachment = models.BooleanField(default=False)
    history = HistoricalRecords(inherit=True, table_name="bill_history")

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
        if not self.bill_number or not self.bill_number.strip():
            self.bill_number = BillCounter.generate_bill_number(self.organization)
        super().save(*args, **kwargs)


class BillItem(BaseModel):
    bill = models.ForeignKey(Bill, on_delete=models.CASCADE, related_name="items", db_index=True)
    description = models.TextField()
    quantity = models.DecimalField(max_digits=12, decimal_places=2)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    uom = models.CharField(max_length=20, blank=True)
    product_code = models.CharField(max_length=50, blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)

    line_number = models.PositiveIntegerField(null=True, blank=True)
    history = HistoricalRecords(inherit=True, table_name="bill_item_history")

    class Meta:
        verbose_name = "BillItem"
        verbose_name_plural = "BillItems"
        db_table = "bill_items"
        ordering = ["line_number", "id"]

        indexes = [
            models.Index(fields=["bill", "line_number"]),
        ]

    def save(self, *args, **kwargs):
        # Auto-calculate amount if not provided
        if not self.amount:
            self.amount = self.quantity * self.unit_price

        # Auto-assign line_number if not provided
        if self.line_number is None and self.bill_id:
            self.line_number = self._get_next_line_number()

        super().save(*args, **kwargs)

    def _get_next_line_number(self):
        """Get the next available line number for this bill"""
        last_item = BillItem.objects.filter(bill=self.bill, line_number__isnull=False).aggregate(
            max_line=models.Max("line_number")
        )

        return (last_item["max_line"] or 0) + 1


class PurchaseOrderCounter(models.Model):
    organization = models.OneToOneField(
        Organization, on_delete=models.CASCADE, related_name="po_counter"
    )
    last_number = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "purchase_order_counters"

    @classmethod
    def get_next_number(cls, organization):
        import random
        import time

        max_retries = 3
        for attempt in range(max_retries):
            try:
                with transaction.atomic():
                    try:
                        counter = cls.objects.select_for_update().get(organization=organization)
                        counter.last_number += 1
                        counter.save(update_fields=["last_number"])
                        return counter.last_number

                    except cls.DoesNotExist:
                        counter = cls.objects.create(organization=organization, last_number=1)
                        return counter.last_number

            except Exception:
                if attempt == max_retries - 1:
                    raise
                time.sleep(random.uniform(0.01, 0.05))

        raise Exception("Failed to generate PO number after retries")

    @classmethod
    def generate_po_number(cls, organization):
        next_num = cls.get_next_number(organization)
        return f"PO-{next_num:04d}"


class PurchaseOrder(BaseModel):
    po_number = models.CharField(
        max_length=50,
        blank=True,
        null=True,
    )
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="organization_po",
    )
    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.PROTECT,
        null=True,
        related_name="vendor_po",
    )
    po_date = models.DateField(db_index=True)
    delivery_date = models.DateField(db_index=True)
    payment_terms = models.CharField(
        max_length=8,
        choices=PAYMENT_TERM_CHOICES,
        blank=True,
        null=True,
    )
    comments = models.TextField(blank=True)
    sub_total = models.DecimalField(max_digits=12, decimal_places=2)
    tax_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    total_tax = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    is_active = models.BooleanField(default=True)
    is_attachment = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=PO_STATUS_CHOICES, default="draft")
    history = HistoricalRecords(inherit=True, table_name="purchase_order_history")

    class Meta:
        unique_together = ("organization", "po_number")
        indexes = [
            models.Index(fields=["organization", "po_number"]),
        ]
        verbose_name = "Purchase Order"
        verbose_name_plural = "Purchase Orders"
        db_table = "purchase_orders"
        ordering = ["-po_date"]

    def save(self, *args, **kwargs):
        if not self.po_number or not self.po_number.strip():
            self.po_number = PurchaseOrderCounter.generate_po_number(self.organization)
        super().save(*args, **kwargs)


class PurchaseOrderItem(BaseModel):
    purchase_order = models.ForeignKey(
        PurchaseOrder, on_delete=models.CASCADE, related_name="items", db_index=True
    )
    description = models.TextField()
    quantity = models.DecimalField(max_digits=12, decimal_places=2)
    received_quantity = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text="Total quantity received against this line item",
    )
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    uom = models.CharField(max_length=20, blank=True)
    product_code = models.CharField(max_length=50, blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)

    line_number = models.PositiveIntegerField(null=True, blank=True)
    history = HistoricalRecords(inherit=True, table_name="purchase_order_item_history")

    class Meta:
        verbose_name = "Purchase Order Item"
        verbose_name_plural = "Purchase Order Items"
        db_table = "purchase_order_items"
        ordering = ["line_number", "id"]

        indexes = [
            models.Index(fields=["purchase_order", "line_number"]),
        ]

    def save(self, *args, **kwargs):
        if self.amount is None:
            self.amount = self.quantity * self.unit_price

        # Auto-assign line_number if not provided
        if self.line_number is None and self.purchase_order_id:
            self.line_number = self._get_next_line_number()

        super().save(*args, **kwargs)

    def _get_next_line_number(self):
        """Get the next available line number for this purchase order"""
        last_item = PurchaseOrderItem.objects.filter(
            purchase_order=self.purchase_order, line_number__isnull=False
        ).aggregate(max_line=models.Max("line_number"))

        return (last_item["max_line"] or 0) + 1

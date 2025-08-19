import contextlib
from decimal import Decimal

from django.db import models, transaction
from simple_history.models import HistoricalRecords

from rever.utils.bill_constants import MATCH_PROGRESS_CHOICES, PAYMENT_TERM_CHOICES, STATUS_CHOICES
from rever.utils.payable_constants import PO_STATUS_CHOICES

from .auth import Organization
from .base import BaseModel


class Address(BaseModel):
    line1 = models.CharField(max_length=255, blank=True, null=True)
    line2 = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    zip_code = models.CharField(max_length=20, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)

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

    vendor_name = models.CharField(max_length=120, blank=True, null=True)
    company_name = models.CharField(max_length=120, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    mobile = models.CharField(max_length=30, blank=True, null=True)
    tax_id = models.CharField(max_length=50, blank=True, null=True)
    account_number = models.CharField(max_length=60, blank=True, null=True)

    payment_terms = models.CharField(
        max_length=8, choices=PAYMENT_TERM_CHOICES, blank=True, null=True
    )

    website = models.URLField(blank=True, null=True)

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
    bill_date = models.DateField(db_index=True, blank=True, null=True)
    due_date = models.DateField(db_index=True, blank=True, null=True)
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
    comments = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    sub_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    total_tax = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)
    is_attachment = models.BooleanField(default=False)
    history = HistoricalRecords(inherit=True, table_name="bill_history")

    is_duplicate = models.BooleanField(default=False)

    def update_duplicate_flags(self):
        bills = Bill.objects.filter(
            vendor=self.vendor, bill_number=self.bill_number, organization=self.organization
        )
        is_duplicate = bills.count() > 1
        bills.update(is_duplicate=is_duplicate)

    class Meta:
        indexes = [
            models.Index(fields=["vendor", "bill_number", "organization"]),
        ]
        verbose_name = "Bill"
        verbose_name_plural = "Bills"
        db_table = "bills"
        ordering = ["-bill_date"]

    def save(self, *args, **kwargs):
        # Track old values for duplicate logic
        old = None
        if self.pk:
            with contextlib.suppress(Bill.DoesNotExist):
                old = Bill.objects.get(pk=self.pk)
        if old:
            self._old_vendor = old.vendor
            self._old_bill_number = old.bill_number

        if not self.bill_number or not self.bill_number.strip():
            self.bill_number = BillCounter.generate_bill_number(self.organization)

        # Ensure atomicity
        with transaction.atomic():
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
    LINE_STATUS_CHOICES = [
        ("open", "Open"),
        ("partially_received", "Partially Received"),
        ("closed", "Closed"),
    ]
    purchase_order = models.ForeignKey(
        PurchaseOrder, on_delete=models.CASCADE, related_name="items", db_index=True
    )
    description = models.TextField()
    quantity = models.DecimalField(
        max_digits=12, decimal_places=2, help_text="Total quantity ordered in this line item"
    )
    pending_approval_quantity = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text="Quantity pending approval before fulfillment",
    )
    received_quantity = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text="Quantity physically received against this line item",
    )
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    uom = models.CharField(max_length=20, blank=True)
    product_code = models.CharField(max_length=50, blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)

    line_status = models.CharField(
        max_length=20,
        choices=LINE_STATUS_CHOICES,
        default="open",
        help_text="Current lifecycle status of this purchase order line item",
    )

    line_number = models.PositiveIntegerField(null=True, blank=True)
    history = HistoricalRecords(inherit=True, table_name="purchase_order_item_history")

    @property
    def remaining_quantity(self):
        q = self.quantity or Decimal("0")
        p = self.pending_approval_quantity or Decimal("0")
        r = self.received_quantity or Decimal("0")
        rem = q - p - r
        return rem if rem > 0 else Decimal("0")

    class Meta:
        verbose_name = "Purchase Order Item"
        verbose_name_plural = "Purchase Order Items"
        db_table = "purchase_order_items"
        ordering = ["line_number", "id"]

        constraints = [
            models.UniqueConstraint(
                fields=["purchase_order", "line_number"], name="uniq_line_per_po"
            ),
        ]
        indexes = [
            models.Index(fields=["purchase_order", "line_number"]),
            models.Index(fields=["purchase_order", "line_status"]),  # filter
        ]

    def _compute_line_status(self) -> str:
        q = self.quantity or Decimal("0")
        r = self.received_quantity or Decimal("0")

        if r >= q and q > 0:
            return "closed"
        if 0 < r < q:
            return "partially_received"
        return "open"

    def recompute_line_status(self):
        q = self.quantity or Decimal("0")
        r = self.received_quantity or Decimal("0")
        if q > 0 and r >= q:
            self.line_status = "closed"
        elif r > 0:
            self.line_status = "partially_received"
        else:
            self.line_status = "open"

    def save(self, *args, **kwargs):
        self.amount = (self.quantity or Decimal("0")) * (self.unit_price or Decimal("0"))
        # Auto-assign line_number if not provided
        if self.line_number is None and self.purchase_order_id:
            self.line_number = self._get_next_line_number()
        # Auto-update status every time we save
        self.line_status = self._compute_line_status()

        super().save(*args, **kwargs)

    def _get_next_line_number(self):
        with transaction.atomic():
            qs = PurchaseOrderItem.objects.select_for_update().filter(
                purchase_order=self.purchase_order, line_number__isnull=False
            )
            max_line = qs.aggregate(max_line=models.Max("line_number"))["max_line"] or 0
            return max_line + 1

    def add_pending(self, qty: Decimal):
        self.pending_approval_quantity = max(
            Decimal("0"), (self.pending_approval_quantity or 0) + qty
        )

    def add_received(self, qty: Decimal):
        self.received_quantity = max(Decimal("0"), (self.received_quantity or 0) + qty)

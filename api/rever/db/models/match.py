from django.db import models

from .auth import Organization
from .base import BaseModel
from .payable import Bill, BillItem, PurchaseOrder, PurchaseOrderItem


class MatchResult(BaseModel):
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="match_results"
    )
    bill = models.ForeignKey(Bill, on_delete=models.CASCADE, related_name="match_results")
    purchase_order = models.ForeignKey(
        PurchaseOrder, on_delete=models.CASCADE, related_name="match_results"
    )
    bill_item = models.OneToOneField(
        BillItem, on_delete=models.CASCADE, related_name="match_result"
    )
    purchase_order_item = models.ForeignKey(
        PurchaseOrderItem, on_delete=models.SET_NULL, null=True
    )

    match_type = models.CharField(max_length=30, default="two_way")
    description_score = models.FloatField()
    description_status = models.CharField(
        max_length=20,
        choices=[
            ("matched", "Matched"),
            ("partial", "Partial"),
            ("mismatched", "Mismatched"),
        ],
    )
    quantity_status = models.BooleanField()
    unit_price_status = models.BooleanField()
    overall_status = models.CharField(
        max_length=20,
        choices=[
            ("matched", "Matched"),
            ("partial", "Partial"),
            ("mismatched", "Mismatched"),
        ],
    )
    is_quantity_posted = models.BooleanField(default=False)
    class Meta:
        db_table = "match_results"
        verbose_name = "Match Result"
        verbose_name_plural = "Match Results"
        indexes = [
            models.Index(fields=["bill"]),
            models.Index(fields=["purchase_order"]),
        ]

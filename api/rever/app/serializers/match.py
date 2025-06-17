from rest_framework import serializers

from rever.db.models import MatchResult

from .payable import BillItemSerializer, PurchaseOrderItemSerializer


class MatchResultSerializer(serializers.ModelSerializer):
    bill_item = BillItemSerializer()
    purchase_order_item = PurchaseOrderItemSerializer()

    class Meta:
        model = MatchResult
        fields = [
            "id",
            "bill_item",
            "purchase_order_item",
            "match_type",
            "description_score",
            "description_status",
            "quantity_status",
            "unit_price_status",
            "overall_status",
        ]

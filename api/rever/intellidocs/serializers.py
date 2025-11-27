"""
Bill OCR Serializers
Handles serialization for bill document upload and OCR results
"""

from rest_framework import serializers

from rever.db.models.payable import Bill, BillItem
from rever.intellidocs.models import BillExtraction, ProcessingStatus


class BillOCRUploadSerializer(serializers.Serializer):
    """Serializer for bill document upload"""

    file = serializers.FileField()


class BillOCRStatusSerializer(serializers.Serializer):
    """Serializer for OCR status response"""

    task_id = serializers.UUIDField()
    status = serializers.ChoiceField(choices=ProcessingStatus.choices)
    bill_id = serializers.UUIDField(required=False)
    bill_number = serializers.CharField(required=False)
    vendor_name = serializers.CharField(required=False)
    total = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    error = serializers.CharField(required=False)
    message = serializers.CharField()


class BillItemSerializer(serializers.ModelSerializer):
    """Serializer for bill line items"""

    class Meta:
        model = BillItem
        fields = [
            "id",
            "description",
            "quantity",
            "unit_price",
            "amount",
            "uom",
            "product_code",
            "line_number",
        ]


class BillOCRResultSerializer(serializers.ModelSerializer):
    """Serializer for processed bill data"""

    items = BillItemSerializer(many=True, read_only=True)
    vendor_name = serializers.CharField(source="vendor.vendor_name", read_only=True)

    class Meta:
        model = Bill
        fields = [
            "id",
            "bill_number",
            "bill_date",
            "due_date",
            "vendor_name",
            "sub_total",
            "tax_percentage",
            "total_tax",
            "total",
            "payment_terms",
            "comments",
            "status",
            "items",
        ]


class BillExtractionListSerializer(serializers.ModelSerializer):
    """List serializer for BillExtraction - minimal data"""

    bill_number_extracted = serializers.CharField(source="bill_number", read_only=True)
    bill_id = serializers.UUIDField(source="bill.id", read_only=True)
    bill_number_final = serializers.CharField(source="bill.bill_number", read_only=True)

    class Meta:
        model = BillExtraction
        fields = [
            "id",
            "created_at",
            "file_name",
            "status",
            "bill_number_extracted",
            "vendor_name",
            "total_amount",
            "bill_id",
            "bill_number_final",
            "file_url",
        ]


class BillExtractionDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for BillExtraction showing raw OCR and parsed JSON"""

    class Meta:
        model = BillExtraction
        fields = [
            "id",
            "created_at",
            "file_name",
            "file_url",
            "file_size",
            "status",
            "processing_time",
            "extraction_engine",
            "raw_text",
            "extracted_data",
            "bill_number",
            "po_number",
            "vendor_name",
            "bill_date",
            "due_date",
            "total_amount",
            "currency",
            "bill",
        ]

"""
Document OCR Serializers
Handles serialization for document upload and OCR results (Bills and Purchase Orders)
"""

from rest_framework import serializers

from rever.db.models.payable import (
    Bill,
    BillItem,
    PurchaseOrder,
    PurchaseOrderItem,
    VendorCredit,
    VendorCreditItem,
)
from rever.intellidocs.models import DocumentExtraction


class DocumentUploadSerializer(serializers.Serializer):
    """Serializer for document upload"""

    file = serializers.FileField()
    document_type = serializers.ChoiceField(
        choices=["bill", "purchase_order", "vendor_credit"],
        default="bill",
        help_text="Type of document: 'bill' or 'purchase_order' or 'vendor_credit'",
    )


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


class BillResultSerializer(serializers.ModelSerializer):
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


class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    """Serializer for purchase order line items"""

    class Meta:
        model = PurchaseOrderItem
        fields = [
            "id",
            "description",
            "quantity",
            "unit_price",
            "amount",
            "uom",
            "product_code",
            "line_number",
            "line_status",
        ]


class PurchaseOrderResultSerializer(serializers.ModelSerializer):
    """Serializer for processed purchase order data"""

    items = PurchaseOrderItemSerializer(many=True, read_only=True)
    vendor_name = serializers.CharField(source="vendor.vendor_name", read_only=True)

    class Meta:
        model = PurchaseOrder
        fields = [
            "id",
            "po_number",
            "po_date",
            "delivery_date",
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


class VendorCreditItemSerializer(serializers.ModelSerializer):
    line_number = serializers.IntegerField(source="sequence", read_only=True)

    class Meta:
        model = VendorCreditItem
        fields = [
            "id",
            "description",
            "quantity",
            "unit_price",
            "total_amount",
            "uom",
            "product_code",
            "sequence",
            "line_number",
        ]


class VendorCreditResultSerializer(serializers.ModelSerializer):
    items = VendorCreditItemSerializer(many=True, read_only=True)
    vendor_name = serializers.CharField(source="vendor.vendor_name", read_only=True)

    class Meta:
        model = VendorCredit
        fields = [
            "id",
            "credit_note_number",
            "txn_date",
            "vendor_name",
            "sub_total",
            "tax_percentage",
            "total_tax",
            "total",
            "reason",
            "notes",
            "status",
            "items",
        ]


class DocumentExtractionListSerializer(serializers.ModelSerializer):
    """List serializer for DocumentExtraction - consistent for all document types"""

    # Generic extracted data (from OCR)
    document_number_extracted = serializers.SerializerMethodField()

    # Linked record info
    document_id = serializers.SerializerMethodField()
    document_number_final = serializers.SerializerMethodField()

    class Meta:
        model = DocumentExtraction
        fields = [
            "id",
            "created_at",
            "file_name",
            "status",
            "document_type",
            "document_number_extracted",
            "vendor_name",
            "total_amount",
            "document_id",
            "document_number_final",
            "file_url",
        ]

    def get_document_number_extracted(self, obj):
        """Return extracted document number based on type"""
        if obj.document_type == "bill":
            return obj.bill_number
        elif obj.document_type == "purchase_order":
            return obj.po_number
        elif obj.document_type == "vendor_credit":
            return obj.credit_note_number
        return None

    def get_document_id(self, obj):
        """Return linked document ID based on type"""
        if obj.document_type == "bill" and obj.bill:
            return str(obj.bill.id)
        elif obj.document_type == "purchase_order" and obj.purchase_order:
            return str(obj.purchase_order.id)
        elif obj.document_type == "vendor_credit" and obj.vendor_credit:
            return str(obj.vendor_credit.id)
        return None

    def get_document_number_final(self, obj):
        """Return final document number from linked record"""
        if obj.document_type == "bill" and obj.bill:
            return obj.bill.bill_number
        elif obj.document_type == "purchase_order" and obj.purchase_order:
            return obj.purchase_order.po_number
        elif obj.document_type == "vendor_credit" and obj.vendor_credit:
            return str(obj.vendor_credit.id)
        return None


class DocumentExtractionDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for DocumentExtraction showing raw OCR and parsed JSON"""

    bill_number_final = serializers.CharField(source="bill.bill_number", read_only=True)
    po_number_final = serializers.CharField(source="purchase_order.po_number", read_only=True)
    credit_note_number_final = serializers.CharField(
        source="vendor_credit.credit_note_number", read_only=True
    )

    class Meta:
        model = DocumentExtraction
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
            "purchase_order",
            "document_type",
            "bill_number_final",
            "po_number_final",
            "credit_note_number",
            "vendor_credit",
            "credit_note_number_final",
        ]

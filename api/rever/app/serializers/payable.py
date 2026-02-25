from decimal import Decimal

from django.contrib.contenttypes.models import ContentType
from django.db import transaction
from rest_framework import serializers

from rever.db.models import (
    Address,
    BankAccount,
    Bill,
    BillItem,
    PurchaseOrder,
    PurchaseOrderItem,
    Vendor,
    VendorCredit,
    VendorCreditItem,
)
from rever.db.models.approval import ApprovalLog


def _get_reject_reason(obj):
    if obj.status != "rejected":
        return None
    return (
        ApprovalLog.objects.filter(
            content_type=ContentType.objects.get_for_model(obj),
            object_id=obj.id,
            action_type="rejected",
        )
        .order_by("-created_at")
        .values_list("comment", flat=True)
        .first()
    )


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]


class BankAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankAccount
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]


class VendorSerializer(serializers.ModelSerializer):
    billing_address = AddressSerializer(required=False, allow_null=True)
    bank_account = BankAccountSerializer(required=False, allow_null=True)

    class Meta:
        model = Vendor
        fields = "__all__"
        read_only_fields = [
            "created_at",
            "updated_at",
            "organization",
        ]

    def create(self, validated_data):
        addr_data = validated_data.pop("billing_address", None)
        bank_data = validated_data.pop("bank_account", None)

        if addr_data:
            validated_data["billing_address"] = Address.objects.create(**addr_data)

        if bank_data:
            validated_data["bank_account"] = BankAccount.objects.create(**bank_data)

        return Vendor.objects.create(**validated_data)

    def update(self, instance, validated_data):
        addr_data = validated_data.pop("billing_address", None)
        bank_data = validated_data.pop("bank_account", None)

        if addr_data:
            if instance.billing_address:
                for k, v in addr_data.items():
                    setattr(instance.billing_address, k, v)
                instance.billing_address.save()
            else:
                instance.billing_address = Address.objects.create(**addr_data)

        if bank_data:
            if instance.bank_account:
                for k, v in bank_data.items():
                    setattr(instance.bank_account, k, v)
                instance.bank_account.save()
            else:
                instance.bank_account = BankAccount.objects.create(**bank_data)

        return super().update(instance, validated_data)


class VendorNestedSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="vendor_name")

    class Meta:
        model = Vendor
        fields = ["id", "name"]


class BillItemSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(required=False)

    class Meta:
        model = BillItem
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at", "amount", "bill"]


class BillSerializer(serializers.ModelSerializer):
    billing_address = AddressSerializer(source="vendor.billing_address", read_only=True)
    shipping_address = AddressSerializer(source="organization.address", read_only=True)
    items = BillItemSerializer(many=True)
    reject_reason = serializers.SerializerMethodField()

    vendor = VendorNestedSerializer(read_only=True)

    vendor_id = serializers.PrimaryKeyRelatedField(
        source="vendor",
        queryset=Vendor.objects.all(),
        write_only=True,
        error_messages={
            "does_not_exist": "Vendor not found.",
            "incorrect_type": "Vendor ID must be a valid UUID.",
        },
    )
    purchase_order = serializers.SerializerMethodField(read_only=True)
    purchase_order_id = serializers.PrimaryKeyRelatedField(
        source="purchase_order",
        queryset=PurchaseOrder.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
        error_messages={
            "does_not_exist": "Purchase Order not found.",
            "incorrect_type": "Purchase Order ID must be a valid UUID.",
        },
    )

    class Meta:
        model = Bill
        fields = "__all__"
        read_only_fields = [
            "created_at",
            "updated_at",
            "organization",
        ]

    def validate_vendor(self, vendor):
        """
        Ensure the chosen vendor belongs to the same organization.
        """
        user_org = self.context["request"].user.organization
        if vendor.organization != user_org:
            raise serializers.ValidationError("Vendor does not belong to your organization.")
        return vendor

    def validate_purchase_order(self, purchase_order):
        """
        Ensure the purchase order belongs to the same organization.
        """
        if (
            purchase_order
            and purchase_order.organization != self.context["request"].user.organization
        ):
            raise serializers.ValidationError(
                "Purchase Order does not belong to your organization."
            )
        return purchase_order

    def get_purchase_order(self, obj):
        if obj.purchase_order:
            return {
                "id": str(obj.purchase_order.id),
                "po_number": obj.purchase_order.po_number,
            }
        return None

    def get_reject_reason(self, obj):
        return _get_reject_reason(obj)

    def create(self, validated):
        items_data = validated.pop("items", [])
        # create the Bill (auto-number logic in model.save())
        bill = Bill.objects.create(**validated)
        # now create each BillItem linked to that bill
        for item in items_data:
            BillItem.objects.create(bill=bill, **item)
        return bill

    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", None)
        instance = super().update(instance, validated_data)

        if items_data is not None:
            # Get existing items mapped by ID
            existing_items = {str(item.id): item for item in instance.items.all()}
            provided_item_ids = set()

            for item_data in items_data:
                item_id = item_data.get("id")

                if item_id:
                    item_id_str = str(item_id)
                    provided_item_ids.add(item_id_str)

                    if item_id_str in existing_items:
                        existing_item = existing_items[item_id_str]
                        for field, value in item_data.items():
                            if field != "id":
                                setattr(existing_item, field, value)
                        existing_item.save()
                    else:
                        create_data = {k: v for k, v in item_data.items() if k != "id"}
                        BillItem.objects.create(bill=instance, **create_data)
                else:
                    BillItem.objects.create(bill=instance, **item_data)
            items_to_delete = set(existing_items.keys()) - provided_item_ids
            if items_to_delete:
                BillItem.objects.filter(
                    id__in=[existing_items[item_id].id for item_id in items_to_delete]
                ).delete()

        return instance


class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(required=False)

    class Meta:
        model = PurchaseOrderItem
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at", "amount", "purchase_order"]


class PurchaseOrderSerializer(serializers.ModelSerializer):
    billing_address = AddressSerializer(source="vendor.billing_address", read_only=True)
    shipping_address = AddressSerializer(source="organization.address", read_only=True)

    items = PurchaseOrderItemSerializer(many=True)
    reject_reason = serializers.SerializerMethodField()
    vendor = VendorNestedSerializer(read_only=True)

    vendor_id = serializers.PrimaryKeyRelatedField(
        source="vendor",
        queryset=Vendor.objects.all(),
        write_only=True,
        error_messages={
            "does_not_exist": "Vendor not found.",
            "incorrect_type": "Vendor ID must be a valid UUID.",
        },
    )

    class Meta:
        model = PurchaseOrder
        fields = "__all__"
        read_only_fields = [
            "created_at",
            "updated_at",
            "organization",
        ]

    def validate_vendor(self, vendor):
        user_org = self.context["request"].user.organization
        if vendor.organization != user_org:
            raise serializers.ValidationError("Vendor does not belong to your organization.")
        return vendor

    def get_reject_reason(self, obj):
        return _get_reject_reason(obj)

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        purchase_order = PurchaseOrder.objects.create(**validated_data)
        for item in items_data:
            PurchaseOrderItem.objects.create(purchase_order=purchase_order, **item)
        return purchase_order

    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", None)
        instance = super().update(instance, validated_data)
        if items_data is not None:
            instance.items.all().delete()
            for item in items_data:
                PurchaseOrderItem.objects.create(purchase_order=instance, **item)
        return instance


class PurchaseOrderMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseOrder
        fields = ["id", "po_number"]


class VendorListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vendor
        fields = [
            "id",
            "vendor_name",
            "company_name",
            "email",
            "mobile",
            "payment_terms",
            "website",
            "is_active",
            "organization",
            "created_at",
        ]


class BillListSerializer(serializers.ModelSerializer):
    vendor = VendorNestedSerializer(read_only=True)
    purchase_order = PurchaseOrderMinimalSerializer(read_only=True)
    reject_reason = serializers.SerializerMethodField()

    class Meta:
        model = Bill
        fields = [
            "id",
            "vendor",
            "purchase_order",
            "bill_number",
            "bill_date",
            "due_date",
            "status",
            "sub_total",
            "tax_percentage",
            "total_tax",
            "total",
            "receipt_status",
            "is_active",
            "is_attachment",
            "is_duplicate",
            "match_status",
            "organization",
            "created_at",
            "reject_reason",
        ]

    def get_reject_reason(self, obj):
        return _get_reject_reason(obj)


class PurchaseOrderListSerializer(serializers.ModelSerializer):
    vendor = VendorNestedSerializer(read_only=True)
    reject_reason = serializers.SerializerMethodField()

    class Meta:
        model = PurchaseOrder
        fields = [
            "id",
            "vendor",
            "po_number",
            "po_date",
            "delivery_date",
            "status",
            "sub_total",
            "tax_percentage",
            "total_tax",
            "total",
            "is_active",
            "organization",
            "is_attachment",
            "created_at",
            "reject_reason",
        ]

    def get_reject_reason(self, obj):
        return _get_reject_reason(obj)


class VendorCreditItemSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(required=False)
    line_number = serializers.IntegerField(source="sequence", read_only=True)

    class Meta:
        model = VendorCreditItem
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at", "vendor_credit"]


class VendorCreditSerializer(serializers.ModelSerializer):
    vendor = VendorNestedSerializer(read_only=True)
    reject_reason = serializers.SerializerMethodField()
    vendor_id = serializers.PrimaryKeyRelatedField(
        source="vendor",
        queryset=Vendor.objects.all(),
        write_only=True,
        error_messages={
            "does_not_exist": "Vendor not found.",
            "incorrect_type": "Vendor ID must be a valid UUID.",
        },
    )

    items = VendorCreditItemSerializer(many=True, required=False)

    class Meta:
        model = VendorCredit
        fields = [
            "id",
            "organization",
            "vendor",
            "vendor_address",
            "customer_name",
            "customer_address",
            "reason",
            "vendor_id",
            "items",
            "credit_note_number",
            "sub_total",
            "tax_percentage",
            "total_tax",
            "total",
            "notes",
            "txn_date",
            "status",
            "reject_reason",
            "is_attachment",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "created_at",
            "updated_at",
            "organization",
        ]

    def validate_vendor(self, vendor):
        user_org = self.context["request"].user.organization
        if vendor.organization_id != user_org.id:
            raise serializers.ValidationError("Vendor does not belong to your organization.")
        return vendor

    def validate(self, attrs):
        vendor = attrs.get("vendor") or getattr(self.instance, "vendor", None)
        if vendor:
            user_org = self.context["request"].user.organization
            if vendor.organization_id != user_org.id:
                raise serializers.ValidationError(
                    {"vendor_id": "Vendor does not belong to your organization."}
                )
        return attrs

    def get_reject_reason(self, obj):
        return _get_reject_reason(obj)

    def _calculate_totals(self, items_data):
        """
        Calculate sub_total and total from items data.

        Args:
            items_data: List of item dictionaries with 'total_amount' field

        Returns:
            dict: Dictionary with 'sub_total' and 'total' keys
        """
        subtotal = sum((item.get("total_amount", Decimal("0.00"))) for item in items_data)

        return {
            "sub_total": subtotal,
            "total": subtotal,
        }

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop("items", [])

        # Calculate totals BEFORE creating the vendor credit to avoid duplicate history records
        totals = self._calculate_totals(items_data)
        validated_data.update(totals)

        # Single save - only one history record
        vendor_credit = VendorCredit.objects.create(**validated_data)

        for item in items_data:
            VendorCreditItem.objects.create(vendor_credit=vendor_credit, **item)

        return vendor_credit

    @transaction.atomic
    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", None)

        if items_data is not None:
            # Calculate totals BEFORE updating to avoid duplicate history records
            totals = self._calculate_totals(items_data)
            validated_data.update(totals)

            # Delete old items
            instance.items.all().delete()

            # Single save with updated totals - only one history record
            instance = super().update(instance, validated_data)

            # Create new items
            for item in items_data:
                VendorCreditItem.objects.create(vendor_credit=instance, **item)
        else:
            # No items update, just update other fields
            instance = super().update(instance, validated_data)

        return instance


class VendorCreditListSerializer(serializers.ModelSerializer):
    vendor = VendorNestedSerializer(read_only=True)
    reject_reason = serializers.SerializerMethodField()

    class Meta:
        model = VendorCredit
        fields = [
            "id",
            "vendor",
            "credit_note_number",
            "sub_total",
            "tax_percentage",
            "total_tax",
            "total",
            "status",
            "txn_date",
            "organization",
            "is_attachment",
            "created_at",
            "reject_reason",
        ]

    def get_reject_reason(self, obj):
        return _get_reject_reason(obj)

from rest_framework import serializers

from rever.db.models import (
    Address,
    BankAccount,
    Bill,
    BillItem,
    PurchaseOrder,
    PurchaseOrderItem,
    Vendor,
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
    class Meta:
        model = PurchaseOrderItem
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at", "amount", "purchase_order"]


class PurchaseOrderSerializer(serializers.ModelSerializer):
    billing_address = AddressSerializer(source="vendor.billing_address", read_only=True)
    shipping_address = AddressSerializer(source="organization.address", read_only=True)

    items = PurchaseOrderItemSerializer(many=True)
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

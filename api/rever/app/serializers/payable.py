from rest_framework import serializers

from rever.db.models import Address, Bill, BillItem, Vendor


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = "__all__"


class VendorSerializer(serializers.ModelSerializer):
    billing_address = AddressSerializer(required=False, allow_null=True)

    class Meta:
        model = Vendor
        exclude = ["organization", "created_at", "updated_at"]

    def create(self, validated):
        addr_data = validated.pop("billing_address", None)
        if addr_data:
            validated["billing_address"] = Address.objects.create(**addr_data)
        return Vendor.objects.create(**validated)

    def update(self, instance, validated):
        addr_data = validated.pop("billing_address", None)
        if addr_data:
            if instance.billing_address:
                for k, v in addr_data.items():
                    setattr(instance.billing_address, k, v)
                instance.billing_address.save()
            else:
                instance.billing_address = Address.objects.create(**addr_data)
        return super().update(instance, validated)


class VendorNestedSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="vendor_name")

    class Meta:
        model = Vendor
        fields = ["id", "name"]


class BillItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = BillItem
        fields = [
            "id",
            "description",
            "quantity",
            "unit_price",
            "uom",
            "product_code",
            "amount",
        ]
        read_only_fields = ["id", "amount"]


class BillSerializer(serializers.ModelSerializer):
    billing_address = AddressSerializer(source="vendor.billing_address", read_only=True)
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

    class Meta:
        model = Bill
        exclude = ["organization", "created_at", "updated_at"]

    def validate_vendor(self, vendor):
        """
        Ensure the chosen vendor belongs to the same organization.
        """
        user_org = self.context["request"].user.organization
        if vendor.organization != user_org:
            raise serializers.ValidationError("Vendor does not belong to your organization.")
        return vendor

    def create(self, validated):
        items_data = validated.pop("items", [])
        # create the Bill (auto-number logic in model.save())
        bill = Bill.objects.create(**validated)
        # now create each BillItem linked to that bill
        for item in items_data:
            BillItem.objects.create(bill=bill, **item)
        return bill

    def update(self, instance, validated):
        # handle top-level field updates
        items_data = validated.pop("items", None)
        instance = super().update(instance, validated)
        if items_data is not None:
            # simple strategy: delete old items, recreate
            instance.items.all().delete()
            for item in items_data:
                BillItem.objects.create(bill=instance, **item)
        return instance

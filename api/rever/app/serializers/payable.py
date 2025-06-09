from rest_framework import serializers

from rever.db.models import Address, Bill, BillItem, Vendor,BankAccount


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

from decimal import Decimal
from uuid import UUID

from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from rever.db.models import Bill, BillItem, ReceiptConfirmationTask, User


# Strongly-typed line item payload for confirmation
class ConfirmBillItemSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    confirmed_quantity = serializers.DecimalField(max_digits=12, decimal_places=2)


class ReceiptRequestSerializer(serializers.Serializer):
    """
    Assign a Lite User to confirm a bill.
    Side effects:
      - Revoke existing active task if assignee changes
      - Create/ensure exactly one active ReceiptConfirmationTask
      - Set bill.receipt_status = 'requested'
    """

    assignee_id = serializers.UUIDField()

    def validate(self, attrs):
        request = self.context["request"]
        bill: Bill = self.context["bill"]
        org = request.user.organization

        try:
            assignee = User.objects.get(id=attrs["assignee_id"], organization=org)
        except User.DoesNotExist as exc:
            raise serializers.ValidationError("Assignee not found in your organization.") from exc

        if assignee.role != User.Role.LITE_USER:
            raise serializers.ValidationError("Assignee must have role Lite User.")

        if bill.receipt_status == "confirmed":
            raise serializers.ValidationError("Receipt already confirmed — cannot request again.")

        attrs["assignee"] = assignee
        return attrs

    @transaction.atomic
    def save(self):
        request = self.context["request"]
        bill: Bill = self.context["bill"]
        assignee: User = self.validated_data["assignee"]

        # Lock bill row to prevent races
        Bill.objects.select_for_update().filter(id=bill.id).exists()

        # Revoke existing active task if different assignee
        active = (
            ReceiptConfirmationTask.objects.select_for_update()
            .filter(bill=bill, status="active")
            .first()
        )
        reassigned = False
        if active and active.assignee_id != assignee.id:
            active.status = "revoked"
            active.revoked_at = timezone.now()
            active.revoked_by = request.user
            active.save(update_fields=["status", "revoked_at", "revoked_by"])
            reassigned = True
        elif not active:
            reassigned = True

        # Ensure exactly one active task (for this assignee)
        task = ReceiptConfirmationTask.objects.filter(
            bill=bill, status="active", assignee=assignee
        ).first() or ReceiptConfirmationTask.objects.create(
            bill=bill,
            organization=bill.organization,
            assignee=assignee,
            status="active",
        )

        # Update bill lifecycle
        if bill.receipt_status != "requested":
            bill.receipt_status = "requested"
            bill.save(update_fields=["receipt_status"])

        return {"task": task, "bill": bill, "assignee": assignee, "reassigned": reassigned}


class ReceiptConfirmSerializer(serializers.Serializer):
    """
    Lite User confirms a bill; may submit per-line confirmed quantities and a comment.
    Side effects:
      - Update BillItem.confirmed_quantity (if provided)
      - Set bill.receipt_status = 'confirmed', bill.receipt_comment = comment (if any)
      - Mark active task as completed
    """

    items = ConfirmBillItemSerializer(many=True, required=False)
    comment = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        request = self.context["request"]
        bill: Bill = self.context["bill"]

        # Must be the active assignee for this bill
        is_active_assignee = ReceiptConfirmationTask.objects.filter(
            bill=bill, status="active", assignee=request.user
        ).exists()
        if not is_active_assignee:
            raise serializers.ValidationError("You are not the active assignee for this bill.")

        # Validate items if provided
        parsed: dict[UUID, Decimal] = {}
        items_payload = attrs.get("items") or []
        if items_payload:
            item_ids = [row["id"] for row in items_payload]
            db_items = BillItem.objects.filter(bill=bill, id__in=item_ids)
            db_map: dict[UUID, BillItem] = {it.id: it for it in db_items}

            if len(db_map) != len(item_ids):
                missing = set(item_ids) - set(db_map.keys())
                raise serializers.ValidationError(
                    f"Some BillItems not found for this bill: {', '.join(map(str, missing))}"
                )

            for row in items_payload:
                it = db_map[row["id"]]
                cq: Decimal = row["confirmed_quantity"]
                if cq < 0 or cq > it.quantity:
                    raise serializers.ValidationError(
                        f"Confirmed quantity for item {it.id} must be between 0 and {it.quantity}."
                    )
                parsed[it.id] = cq

        attrs["parsed_items"] = parsed
        return attrs

    @transaction.atomic
    def save(self):
        request = self.context["request"]
        bill: Bill = self.context["bill"]
        parsed: dict[UUID, Decimal] = self.validated_data.get("parsed_items", {})
        comment = self.validated_data.get("comment", "")

        # Lock bill and any items we update
        Bill.objects.select_for_update().filter(id=bill.id).exists()

        if parsed:
            items = BillItem.objects.select_for_update().filter(
                id__in=list(parsed.keys()), bill=bill
            )
            for it in items:
                it.confirmed_quantity = parsed[it.id]
                it.save(update_fields=["confirmed_quantity"])

        # Update bill lifecycle
        updates = []
        if bill.receipt_status != "confirmed":
            bill.receipt_status = "confirmed"
            updates.append("receipt_status")
        if comment:
            bill.receipt_comment = comment
            updates.append("receipt_comment")
        if updates:
            bill.save(update_fields=updates)

        # Complete the active task
        task = (
            ReceiptConfirmationTask.objects.select_for_update()
            .filter(bill=bill, status="active", assignee=request.user)
            .first()
        )
        if task:
            task.status = "completed"
            task.completed_at = timezone.now()
            task.save(update_fields=["status", "completed_at"])

        return {"bill": bill, "task": task}


class ReminderSerializer(serializers.Serializer):
    """
    Finance/Admin sends a reminder to the current active assignee.
    Side effects:
      - Update last_reminded_at and remind_count on the active task
    """

    assignee_id = serializers.UUIDField(required=False)

    def validate(self, attrs):
        request = self.context["request"]
        bill: Bill = self.context["bill"]
        org = request.user.organization

        task = (
            ReceiptConfirmationTask.objects.select_related("assignee")
            .filter(bill=bill, status="active")
            .first()
        )
        if not task:
            raise serializers.ValidationError("No active assignee to remind.")

        try:
            assignee = User.objects.get(id=attrs["assignee_id"], organization=org)
        except User.DoesNotExist as exc:
            raise serializers.ValidationError("Assignee not found in your organization.") from exc

        if assignee.role != User.Role.LITE_USER:
            raise serializers.ValidationError("Assignee must have role Lite User.")

        if bill.receipt_status == "confirmed":
            raise serializers.ValidationError("Receipt already confirmed — cannot request again.")

        # If client provided an assignee_id, require it to match the active assignee
        requested_id = attrs.get("assignee_id")
        if requested_id and str(requested_id) != str(task.assignee_id):
            raise serializers.ValidationError("Only the active assignee can be reminded.")

        attrs["task"] = task
        attrs["assignee"] = task.assignee
        return attrs

    @transaction.atomic
    def save(self):
        task: ReceiptConfirmationTask = self.validated_data["task"]

        # Lock + update counters
        ReceiptConfirmationTask.objects.select_for_update().filter(id=task.id).exists()
        task.last_reminded_at = timezone.now()
        task.remind_count = (task.remind_count or 0) + 1

        # Optionally set updated_by if request is present
        request = self.context.get("request")
        if request and hasattr(task, "updated_by"):
            task.updated_by = request.user
            task.save(update_fields=["last_reminded_at", "remind_count", "updated_by"])
        else:
            task.save(update_fields=["last_reminded_at", "remind_count"])

        return {"task": task, "assignee": task.assignee, "bill": task.bill}


class UserReceiptTaskSerializer(serializers.ModelSerializer):
    # Task fields
    task_id = serializers.UUIDField(source="id", read_only=True)
    task_status = serializers.CharField(source="status", read_only=True)
    assigned_at = serializers.DateTimeField(read_only=True)
    completed_at = serializers.DateTimeField(read_only=True)

    # Bill summary
    bill_id = serializers.UUIDField(source="bill.id", read_only=True)
    bill_number = serializers.CharField(source="bill.bill_number", read_only=True)
    vendor_name = serializers.SerializerMethodField()
    bill_date = serializers.DateField(source="bill.bill_date", read_only=True)
    due_date = serializers.DateField(source="bill.due_date", read_only=True)
    receipt_status = serializers.CharField(source="bill.receipt_status", read_only=True)
    receipt_comment = serializers.CharField(source="bill.receipt_comment", read_only=True)

    requested_by_id = serializers.UUIDField(
        source="created_by.id", read_only=True, allow_null=True
    )
    requested_by_name = serializers.SerializerMethodField()

    class Meta:
        model = ReceiptConfirmationTask
        fields = [
            # task
            "task_id",
            "task_status",
            "assigned_at",
            "completed_at",
            "requested_by_id",
            "requested_by_name",
            # bill
            "bill_id",
            "bill_number",
            "vendor_name",
            "bill_date",
            "due_date",
            "receipt_status",
            "receipt_comment",
        ]

    def get_vendor_name(self, obj):
        v = getattr(obj.bill, "vendor", None)
        return getattr(v, "vendor_name", None) if v else None

    def get_requested_by_name(self, obj):
        u = getattr(obj, "created_by", None)
        return (u.first_name or u.username or u.email) if u else None


class ReceiptTaskSerializer(serializers.ModelSerializer):
    task_id = serializers.UUIDField(source="id", read_only=True)

    assignee_id = serializers.UUIDField(source="assignee.id", read_only=True)
    assignee_name = serializers.SerializerMethodField()
    assignee_email = serializers.EmailField(source="assignee.email", read_only=True)

    revoked_by_id = serializers.UUIDField(source="revoked_by.id", read_only=True, allow_null=True)
    revoked_by_name = serializers.SerializerMethodField()

    requested_by_id = serializers.UUIDField(
        source="created_by.id", read_only=True, allow_null=True
    )
    requested_by_name = serializers.SerializerMethodField()

    class Meta:
        model = ReceiptConfirmationTask
        fields = [
            "task_id",
            "status",
            "assigned_at",
            "revoked_at",
            "revoked_by_id",
            "revoked_by_name",
            "completed_at",
            "last_reminded_at",
            "remind_count",
            "assignee_id",
            "assignee_name",
            "assignee_email",
            "requested_by_id",
            "requested_by_name",
        ]
        read_only_fields = fields

    def get_assignee_name(self, obj):
        u = obj.assignee
        return (u.first_name or u.username or u.email) if u else None

    def get_revoked_by_name(self, obj):
        u = obj.revoked_by
        return (u.first_name or u.username or u.email) if u else None

    def get_requested_by_name(self, obj):
        u = obj.created_by
        return (u.first_name or u.username or u.email) if u else None

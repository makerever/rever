from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from rever.app.permissions import IsLiteUser, IsOrganizationMember, with_permission_classes
from rever.app.serializers import (
    ReceiptConfirmSerializer,
    ReceiptRequestSerializer,
    ReceiptTaskSerializer,
    ReminderSerializer,
    UserReceiptTaskSerializer,
)
from rever.app.views.base import BaseAPIView
from rever.app.views.base_viewsets import BaseModelViewSet
from rever.bgtasks import (
    receipt_assignment_email,
    receipt_confirmation_email,
    receipt_reminder_email,
)
from rever.db.models import Bill, ReceiptConfirmationTask, User

FORBIDDEN_APPROVAL_STATES = {"under_approval", "approved"}


class ReceiptViewSet(BaseModelViewSet):
    queryset = Bill.objects.all()

    def _get_bill(self, request, pk: str) -> Bill:
        return get_object_or_404(
            Bill.objects.select_related("organization", "vendor"),
            pk=pk,
            organization=request.user.organization,
        )

    def _ensure_in_review(self, bill: Bill):
        if bill.status != "in_review":
            raise ValidationError("Allowed only when bill status is 'in_review'.")

    def _ensure_not_in_approval(self, bill: Bill):
        if bill.status in FORBIDDEN_APPROVAL_STATES:
            raise ValidationError(
                "Action not allowed: bill is under approval or already approved."
            )

    def _bill_number(self, bill: Bill) -> str:
        return bill.bill_number or str(bill.id)

    def _vendor_name(self, bill: Bill) -> str:
        return getattr(bill.vendor, "vendor_name", "N/A")

    def _display_name(self, user: User) -> str:
        return user.first_name or user.username or user.email

    def _finance_recipients(self, org_id):
        # Notify finance managers & super admins of the same org
        roles = [User.Role.FINANCE_MANAGER, User.Role.SUPER_ADMIN]
        return (
            User.objects.filter(organization_id=org_id, role__in=roles)
            .exclude(email__isnull=True)
            .exclude(email__exact="")
            .only("id", "first_name", "username", "email")
        )

    def _ensure_feature_enabled(self, org):
        if not getattr(org, "receipt_confirmation_enabled", False):
            raise ValidationError(
                "Receipt confirmation workflow is disabled for this organization."
            )

    @action(
        detail=True,
        methods=["post"],
        url_path="receipt/request",
        permission_classes=[IsOrganizationMember],
    )
    def request_receipt(self, request, pk=None):
        bill = self._get_bill(request, pk)
        self._ensure_feature_enabled(bill.organization)
        self._ensure_in_review(bill)

        if bill.receipt_status == "confirmed":
            raise ValidationError("Receipt already confirmed — cannot request again.")

        ser = ReceiptRequestSerializer(
            data=request.data, context={"request": request, "bill": bill}
        )
        ser.is_valid(raise_exception=True)
        out = ser.save()  # {task, bill, assignee, reassigned}

        assignee: User = out["assignee"]
        # Queue assignment email (no message)
        receipt_assignment_email.delay(
            assignee.email,
            self._display_name(assignee),
            str(bill.id),
            self._bill_number(bill),
            self._vendor_name(bill),
        )

        return Response(
            {
                "detail": "Receipt confirmation requested.",
                "task_id": str(out["task"].id),
                "reassigned": out["reassigned"],
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="receipt/remind",
        permission_classes=[IsOrganizationMember],
    )
    def remind(self, request, pk=None):
        bill = self._get_bill(request, pk)
        self._ensure_feature_enabled(bill.organization)
        self._ensure_not_in_approval(bill)

        ser = ReminderSerializer(data=request.data, context={"bill": bill, "request": request})
        ser.is_valid(raise_exception=True)
        out = ser.save()  # {task, assignee, bill}

        assignee: User = out["assignee"]
        receipt_reminder_email.delay(
            assignee.email,
            self._display_name(assignee),
            str(bill.id),
            self._bill_number(bill),
            self._vendor_name(bill),
        )

        return Response(
            {"detail": "Reminder queued.", "task_id": str(out["task"].id)},
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="receipt/confirm",
        permission_classes=[IsOrganizationMember, IsLiteUser],
    )
    def confirm(self, request, pk=None):
        bill = self._get_bill(request, pk)
        self._ensure_feature_enabled(bill.organization)
        # Block confirmations for approval/approved states
        self._ensure_not_in_approval(bill)

        # Optional but recommended: only allow confirm if previously requested
        if bill.receipt_status != "requested":
            raise ValidationError("Bill must be in 'requested' state to confirm.")

        ser = ReceiptConfirmSerializer(
            data=request.data, context={"request": request, "bill": bill}
        )
        ser.is_valid(raise_exception=True)
        ser.save()  # {bill, task}

        confirmer = request.user
        requesting_task = (
            ReceiptConfirmationTask.objects.select_related("created_by")
            .filter(bill=bill)
            .order_by("-assigned_at")
            .first()
        )
        # Send email only to the user who requested the receipt confirmation
        if requesting_task and requesting_task.created_by:
            receipt_confirmation_email.delay(
                requesting_task.created_by.email,
                self._display_name(requesting_task.created_by),
                str(bill.id),
                self._bill_number(bill),
                self._vendor_name(bill),
                self._display_name(confirmer),
                bill.receipt_comment or "",
            )

        return Response(
            {"detail": "Bill confirmed.", "bill_id": str(bill.id)}, status=status.HTTP_200_OK
        )

    @action(
        detail=True,
        methods=["get"],
        url_path="receipt/tasks",
        permission_classes=[IsOrganizationMember],
    )
    def list_tasks(self, request, pk=None):
        bill = self._get_bill(request, pk)
        tasks = (
            ReceiptConfirmationTask.objects.select_related("assignee", "revoked_by", "created_by")
            .filter(bill=bill)
            .order_by("-assigned_at", "-id")
        )
        data = ReceiptTaskSerializer(tasks, many=True).data
        return Response(data, status=status.HTTP_200_OK)


class ReceiptRequestedListAPIView(BaseAPIView):
    @with_permission_classes([IsOrganizationMember, IsLiteUser])
    def get(self, request):
        org = request.user.organization
        tasks = (
            ReceiptConfirmationTask.objects.select_related("bill", "bill__vendor", "created_by")
            .filter(
                organization=org,
                assignee=request.user,
                status="active",
                bill__receipt_status="requested",
            )
            .exclude(bill__status__in=FORBIDDEN_APPROVAL_STATES)
            .order_by("-assigned_at", "-id")
        )
        data = UserReceiptTaskSerializer(tasks, many=True).data
        return Response(data, status=200)


class ReceiptApprovedListAPIView(BaseAPIView):
    @with_permission_classes([IsOrganizationMember, IsLiteUser])
    def get(self, request):
        org = request.user.organization
        tasks = (
            ReceiptConfirmationTask.objects.select_related("bill", "bill__vendor", "created_by")
            .filter(
                organization=org,
                assignee=request.user,
                status="completed",
                bill__receipt_status="confirmed",
            )
            .order_by("-completed_at", "-assigned_at", "-id")
        )
        data = UserReceiptTaskSerializer(tasks, many=True).data
        return Response(data, status=200)


class ReceiptRevokedListAPIView(BaseAPIView):
    @with_permission_classes([IsOrganizationMember, IsLiteUser])
    def get(self, request):
        org = request.user.organization
        tasks = (
            ReceiptConfirmationTask.objects.select_related(
                "bill", "bill__vendor", "created_by", "revoked_by"
            )
            .filter(
                organization=org,
                assignee=request.user,
                status="revoked",
            )
            .order_by("-revoked_at", "-assigned_at", "-id")
        )
        data = UserReceiptTaskSerializer(tasks, many=True).data
        return Response(data, status=200)


class ReceiptHistoryListAPIView(BaseAPIView):
    @with_permission_classes([IsOrganizationMember, IsLiteUser])
    def get(self, request):
        org = request.user.organization
        tasks = (
            ReceiptConfirmationTask.objects.select_related(
                "bill", "bill__vendor", "created_by", "revoked_by"
            )
            .filter(
                organization=org,
                assignee=request.user,
                status__in=["revoked", "completed"],
            )
            .order_by("-revoked_at", "-completed_at", "-assigned_at", "-id")
        )
        data = UserReceiptTaskSerializer(tasks, many=True).data
        return Response(data, status=200)

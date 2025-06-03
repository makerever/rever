from django.contrib.contenttypes.models import ContentType
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from rever.app.permissions import (
    IsFinanceManager,
    IsSuperAdmin,
    with_permission_classes,
)
from rever.app.serializers import (
    ApprovalActionLogSerializer,
    ApprovalActionSerializer,
    ApprovalAssignmentSerializer,
    ApprovalSettingSerializer,
)
from rever.app.views.base import BaseAPIView
from rever.bgtasks import send_approval_email, send_approval_status_email
from rever.db.models import ApprovalAction, ApprovalAssignment, ApprovalSetting, User
from rever.utils.approval_constants import APPROVAL_MODEL_MAP
from rever.utils.workflows import has_objects_under_approval


class ApprovalSettingAPIView(BaseAPIView):
    def get(self, request):
        organization = self.get_organization()
        approvals = ApprovalSetting.objects.filter(
            organization=organization, approval_enabled=True
        ).values("model_name", "approval_enabled")

        return Response(list(approvals))

    @with_permission_classes([IsSuperAdmin])
    def post(self, request):
        data = request.data.copy()
        data["organization"] = self.get_organization().id

        serializer = ApprovalSettingSerializer(data=data)
        if serializer.is_valid():
            ApprovalSetting.objects.update_or_create(
                organization_id=data["organization"],
                model_name=data["model_name"].lower(),
                defaults={"approval_enabled": data["approval_enabled"]},
            )
            return Response({"detail": "Approval setting saved."})
        return Response(serializer.errors, status=400)

    @with_permission_classes([IsSuperAdmin])
    def delete(self, request):
        model_name = request.query_params.get("model_name")
        if not model_name:
            return Response({"detail": "model_name is required as query param"}, status=400)

        model_key = model_name.lower()
        organization = self.get_organization()

        if has_objects_under_approval(model_key, organization):
            return Response(
                {
                    "detail": f"Cannot remove approval — some {model_key} records are still under approval."  # noqa: E501
                },
                status=400,
            )

        ApprovalAssignment.objects.filter(organization=organization, model_name=model_key).delete()

        deleted, _ = ApprovalSetting.objects.filter(
            organization=organization, model_name=model_key
        ).delete()

        if deleted:
            return Response({"detail": "Approval workflow removed successfully"})
        return Response({"detail": "No approval workflow found"}, status=404)


class AssignApproverAPIView(BaseAPIView):
    @with_permission_classes([IsSuperAdmin])
    def post(self, request):
        org = request.user.organization
        data = request.data.copy()
        data["organization"] = org.id

        try:
            approver = User.objects.get(id=data["approver"], organization=org)
        except User.DoesNotExist:
            return Response(
                {"detail": "Approver not found in your organization."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if approver.role != User.Role.FINANCE_MANAGER:
            return Response(
                {"detail": "Only Finance Managers can be assigned as approvers."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ApprovalAssignmentSerializer(data=data)
        if serializer.is_valid():
            approval_setting = ApprovalSetting.objects.filter(
                organization=org,
                model_name=data["model_name"].lower(),
                approval_enabled=True,
            ).first()

            if not approval_setting:
                return Response(
                    {"detail": "Approval is not enabled for this model."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            ApprovalAssignment.objects.update_or_create(
                organization=org,
                model_name=data["model_name"].lower(),
                defaults={"approver_id": data["approver"]},
            )

            return Response({"detail": "Approver assigned successfully"})

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request):
        model_name = request.query_params.get("model_name")
        if not model_name:
            return Response(
                {"detail": "model_name is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        assignment = ApprovalAssignment.objects.filter(
            organization=request.user.organization, model_name=model_name.lower()
        ).first()

        if not assignment:
            return Response({"detail": "No approver assigned."}, status=status.HTTP_404_NOT_FOUND)

        user = assignment.approver
        return Response(
            {
                "model_name": assignment.model_name,
                "approver_id": user.id,
                "approver_name": user.get_full_name(),
                "approver_email": user.email,
                "role": user.role,
            }
        )


class SendForApprovalAPIView(BaseAPIView):
    def post(self, request, model_name, object_id):
        org = request.user.organization
        user = request.user

        model_config = APPROVAL_MODEL_MAP.get(model_name.lower())
        if not model_config:
            return Response({"detail": "Invalid model name."}, status=400)

        model = model_config["model"]
        obj = get_object_or_404(model, id=object_id, organization=org)

        # Check if approval is enabled
        if not ApprovalSetting.objects.filter(
            organization=org, model_name=model_name.lower(), approval_enabled=True
        ).exists():
            return Response(
                {"detail": f"Approval is not enabled for {model_name.title()}."},
                status=400,
            )

        # Check if an approver is assigned
        assignment = ApprovalAssignment.objects.filter(
            organization=org, model_name=model_name.lower()
        ).first()

        if not assignment:
            return Response(
                {"detail": f"No approver assigned for {model_name.title()}."},
                status=400,
            )

        # Update status
        if hasattr(obj, "status"):
            obj.status = "under_approval"
            obj.save()

        # Create ApprovalAction entry
        ApprovalAction.objects.create(
            content_type=ContentType.objects.get_for_model(obj),
            object_id=obj.id,
            content_object=obj,
            organization=org,
            action_type="under_approval",
            approval_sent_by=user,
            approval_sent_at=timezone.now(),
            comment="Sent for approval",
        )

        # Notify approver
        if assignment.approver.notification_settings.notify_on_approval_request:
            send_approval_email.delay(
                recipient_email=assignment.approver.email,
                recipient_name=assignment.approver.get_full_name(),
                object_id=str(obj.id),
                model_name=model_name,
                requested_by=user.get_full_name(),
            )

        return Response({"detail": f"{model_name.title()} sent for approval."}, status=200)


class ApproveOrRejectAPIView(BaseAPIView):
    @with_permission_classes([IsFinanceManager])
    def post(self, request, model_name, object_id):
        user = request.user
        org = user.organization

        model_config = APPROVAL_MODEL_MAP.get(model_name.lower())
        if not model_config:
            return Response({"detail": "Invalid model name."}, status=400)

        model = model_config["model"]
        obj = get_object_or_404(model, id=object_id, organization=org)

        assignment = ApprovalAssignment.objects.filter(
            organization=org, model_name=model_name.lower()
        ).first()

        if not assignment:
            return Response(
                {"detail": f"No approver assigned for {model_name.title()}."},
                status=400,
            )

        if assignment.approver != user:
            return Response({"detail": "Only the assigned approver can take action."}, status=403)

        serializer = ApprovalActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        action = serializer.validated_data["action"]
        comment = serializer.validated_data.get("comment", "")

        # Update status on the object
        if hasattr(obj, "status"):
            obj.status = "approved" if action == "approve" else "rejected"
            obj.save()

        # Save Approval Action
        content_type = ContentType.objects.get_for_model(obj)
        ApprovalAction.objects.create(
            content_type=content_type,
            object_id=obj.id,
            content_object=obj,
            organization=org,
            approved_by=user,
            action_type="approved" if action == "approve" else "rejected",
            comment=comment,
            approved_at=timezone.now(),
        )

        # Notify original sender if needed
        sent_action = (
            ApprovalAction.objects.filter(
                content_type=content_type,
                object_id=obj.id,
                action_type="under_approval",
            )
            .order_by("-created_at")
            .first()
        )

        if (
            sent_action
            and sent_action.approval_sent_by
            and sent_action.approval_sent_by.notification_settings.notify_on_approval_result
        ):
            send_approval_status_email.delay(
                model_name=model_name,
                action_type=action,
                comment=comment,
                to_email=sent_action.approval_sent_by.email,
                to_name=sent_action.approval_sent_by.get_full_name(),
            )

        return Response({"detail": f"{model_name.title()} {action}d successfully."}, status=200)


class AssignedApprovalListAPIView(BaseAPIView):
    def get(self, request, model_name):
        user = request.user
        org = user.organization

        model_config = APPROVAL_MODEL_MAP.get(model_name.lower())
        if not model_config:
            return Response({"detail": "Invalid model name."}, status=400)

        model = model_config["model"]
        serializer_class = model_config["serializer"]

        assignment = ApprovalAssignment.objects.filter(
            organization=org, model_name=model_name.lower(), approver=user
        ).first()

        if not assignment:
            return Response(
                {
                    "detail": f"No approver assignment found for {model_name.title()} "
                    f"or you are not authorized to take action."
                },
                status=403,
            )

        # Only return items under approval for this model and organization
        queryset = model.objects.filter(organization=org, status="under_approval")
        serializer = serializer_class(queryset, many=True)
        return Response(serializer.data, status=200)


class ApprovalActionListAPIView(BaseAPIView):
    def get(self, request, model_name, object_id):
        user = request.user
        org = user.organization

        # Validate model
        model_config = APPROVAL_MODEL_MAP.get(model_name.lower())
        if not model_config:
            return Response({"detail": "Invalid model name."}, status=status.HTTP_400_BAD_REQUEST)

        model = model_config["model"]

        try:
            content_type = ContentType.objects.get_for_model(model)
        except ContentType.DoesNotExist:
            return Response(
                {"detail": "Content type not found."}, status=status.HTTP_400_BAD_REQUEST
            )

        # Ensure object exists and belongs to the same organization
        try:
            _ = model.objects.get(id=object_id, organization=org)
        except model.DoesNotExist:
            return Response(
                {"detail": f"{model_name.title()} not found or not in your organization."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Get approval history
        actions = ApprovalAction.objects.filter(
            content_type=content_type, object_id=object_id, organization=org
        ).order_by("-created_at")

        serializer = ApprovalActionLogSerializer(actions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

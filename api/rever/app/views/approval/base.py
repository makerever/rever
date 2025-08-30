from django.contrib.contenttypes.models import ContentType
from django.db import transaction
from django.db.models import OuterRef, Subquery
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
    ApprovalActionSerializer,
    ApprovalConfigSerializer,
    ApprovalFlowSerializer,
    ApprovalLogSerializer,
)
from rever.app.views.base import BaseAPIView
from rever.bgtasks import send_approval_email, send_approval_status_email
from rever.db.models import ApprovalConfig, ApprovalFlow, ApprovalLog, User
from rever.utils.approval_constants import APPROVAL_MODEL_MAP, get_next_approval_level
from rever.utils.approval_notification import (
    create_approval_notification,
    create_approval_result_notification,
)
from rever.utils.workflows import has_objects_under_approval


class ApprovalConfigAPIView(BaseAPIView):
    def get(self, request):
        organization = self.get_organization()
        approvals = ApprovalConfig.objects.filter(
            organization=organization, approval_enabled=True
        ).values("model_name", "approval_enabled")

        return Response(list(approvals))

    @with_permission_classes([IsSuperAdmin])
    def post(self, request):
        data = request.data.copy()
        data["organization"] = self.get_organization().id

        serializer = ApprovalConfigSerializer(data=data)
        if serializer.is_valid():
            ApprovalConfig.objects.update_or_create(
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
            print("Hello", model_key, organization)
            return Response(
                {
                    "detail": f"Cannot remove approval — some {model_key} records are still under approval."  # noqa: E501
                },
                status=400,
            )

        ApprovalFlow.objects.filter(organization=organization, model_name=model_key).delete()

        deleted, _ = ApprovalConfig.objects.filter(
            organization=organization, model_name=model_key
        ).delete()

        if deleted:
            return Response({"detail": "Approval workflow removed successfully"})
        return Response({"detail": "No approval workflow found"}, status=404)


class ApprovalFlowAPIView(BaseAPIView):
    """
    POST:
      - Bulk: accepts 'model_name' and 'assignments' (list of {'approver', 'level'})
      - Single (legacy): accepts 'model_name', 'approver', 'level'
    GET:
      - Query for model assignment list, as before.
    """

    @with_permission_classes([IsSuperAdmin])
    def post(self, request):
        org = request.user.organization
        data = request.data.copy()
        model_name = data.get("model_name")
        assignments = data.get("assignments")
        single_assignment = data if not assignments else None

        if assignments:
            # ---- BULK/BATCH MODE ----
            approver_ids_in_batch = [a["approver"] for a in assignments]
            levels = [a["level"] for a in assignments]
            if len(levels) != len(set(levels)):
                return Response(
                    {"detail": "Duplicate levels in assignments not allowed."}, status=400
                )
            if any(level not in range(1, 6) for level in levels):
                return Response({"detail": "Levels must be between 1 and 5."}, status=400)

            # -- Optional: Enforce strictly consecutive levels in batch --
            if sorted(levels) != list(range(min(levels), max(levels) + 1)):
                return Response(
                    {"detail": "Levels in assignments must be consecutive with no gaps."},
                    status=400,
                )

            if len(approver_ids_in_batch) != len(set(approver_ids_in_batch)):
                return Response(
                    {
                        "detail": (
                            "A user cannot be assigned to multiple levels in the same request."
                        )
                    },
                    status=400,
                )

            existing_assignments = ApprovalFlow.objects.filter(
                organization=org, model_name=model_name.lower()
            )

            for assign in assignments:
                approver_id = assign["approver"]
                level = assign["level"]
                dupe = (
                    existing_assignments.filter(approver_id=approver_id)
                    .exclude(level=level)
                    .exists()
                )
                if dupe:
                    return Response(
                        {
                            "detail": (
                                f"User {approver_id} is already assigned as approver for another level."  # noqa: E501
                            )
                        },
                        status=400,
                    )

            with transaction.atomic():
                for assign in assignments:
                    approver_id = assign["approver"]
                    level = assign["level"]

                    try:
                        approver = User.objects.get(id=approver_id, organization=org)
                    except User.DoesNotExist:
                        return Response(
                            {"detail": f"Approver {approver_id} not found in organization."},
                            status=status.HTTP_404_NOT_FOUND,
                        )
                    if approver.role != User.Role.FINANCE_MANAGER:
                        return Response(
                            {
                                "detail": f"User {approver.get_full_name()} is not a Finance Manager."  # noqa: E501
                            },
                            status=status.HTTP_400_BAD_REQUEST,
                        )
                    ApprovalFlow.objects.update_or_create(
                        organization=org,
                        model_name=model_name.lower(),
                        level=level,
                        defaults={"approver": approver},
                    )
            return Response({"detail": "Approvers assigned/updated successfully."})

        elif single_assignment:
            # ---- SINGLE MODE (backward compatible) ----
            data["organization"] = org.id
            level = data.get("level")
            if not level or int(level) not in range(1, 6):
                return Response({"detail": "Level must be between 1 and 5."}, status=400)
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
            serializer = ApprovalFlowSerializer(data=data)
            if serializer.is_valid():
                ApprovalFlow.objects.update_or_create(
                    organization=org,
                    model_name=data["model_name"].lower(),
                    level=level,
                    defaults={"approver": approver},
                )
                return Response({"detail": "Approver assigned successfully"})
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({"detail": "Provide either single or assignments list."}, status=400)

    def get(self, request):
        model_name = request.query_params.get("model_name")
        if not model_name:
            return Response(
                {"detail": "model_name is required"}, status=status.HTTP_400_BAD_REQUEST
            )
        assignments = ApprovalFlow.objects.filter(
            organization=request.user.organization, model_name=model_name.lower()
        ).order_by("level")

        if not assignments.exists():
            return Response({"detail": "No approvers assigned."}, status=status.HTTP_404_NOT_FOUND)

        approvers_list = []
        for assignment in assignments:
            user = assignment.approver
            approvers_list.append(
                {
                    "model_name": assignment.model_name,
                    "level": assignment.level,
                    "approver_id": user.id,
                    "approver_name": user.get_full_name(),
                    "approver_email": user.email,
                    "role": user.role,
                }
            )
        return Response(approvers_list)


class ApprovalLogAPIView(BaseAPIView):
    def post(self, request, model_name, object_id):
        org = request.user.organization
        user = request.user

        model_config = APPROVAL_MODEL_MAP.get(model_name.lower())
        if not model_config:
            return Response({"detail": "Invalid model name."}, status=400)

        model = model_config["model"]
        obj = get_object_or_404(model, id=object_id, organization=org)

        # Check if approval is enabled
        if not ApprovalConfig.objects.filter(
            organization=org, model_name=model_name.lower(), approval_enabled=True
        ).exists():
            return Response(
                {"detail": f"Approval is not enabled for {model_name.title()}."},
                status=400,
            )

        # Always start with L1
        first_level_flow = ApprovalFlow.objects.filter(
            organization=org, model_name=model_name.lower(), level=1
        ).first()

        if not first_level_flow:
            return Response(
                {"detail": "No L1 approver assigned for this model."},
                status=400,
            )
        # Update status
        if hasattr(obj, "status"):
            obj.status = "under_approval"
            obj.save()

        # Create ApprovalLog for L1
        ApprovalLog.objects.create(
            content_type=ContentType.objects.get_for_model(obj),
            object_id=obj.id,
            content_object=obj,
            organization=org,
            action_type="under_approval",
            approval_sent_by=user,
            approval_sent_at=timezone.now(),
            comment="Sent for approval (L1)",
            level=1,
        )

        # Notify L1 approver (optional)
        if (
            hasattr(first_level_flow.approver, "user_notification_preference")
            and first_level_flow.approver.user_notification_preference.notify_on_approval_request
        ):
            send_approval_email.delay(
                recipient_email=first_level_flow.approver.email,
                recipient_name=first_level_flow.approver.get_full_name(),
                object_id=str(obj.id),
                model_name=model_name,
                requested_by=user.get_full_name(),
            )
        create_approval_notification(
            approver=first_level_flow.approver,
            organization=org,
            obj=obj,
            model_name=model_name,
            requester=user,
        )

        return Response({"detail": f"{model_name.title()} sent for approval to L1."}, status=200)


class ApprovalActionAPIView(BaseAPIView):
    @with_permission_classes([IsFinanceManager])
    def post(self, request, model_name, object_id):
        user = request.user
        org = user.organization

        model_config = APPROVAL_MODEL_MAP.get(model_name.lower())
        if not model_config:
            return Response({"detail": "Invalid model name."}, status=400)

        model = model_config["model"]
        obj = get_object_or_404(model, id=object_id, organization=org)

        if getattr(obj, "status", None) == "approved":
            return Response(
                {"detail": "This record has already been approved. No further action is allowed."},
                status=400,
            )

        if getattr(obj, "status", None) == "rejected":
            return Response(
                {"detail": "This record has already been rejected. No further action is allowed."},
                status=400,
            )

        # Find the current approver's level for this model/org
        current_flow = ApprovalFlow.objects.filter(
            organization=org, model_name=model_name.lower(), approver=user
        ).first()
        if not current_flow:
            return Response({"detail": "You are not assigned as an approver."}, status=403)

        current_level = current_flow.level
        content_type = ContentType.objects.get_for_model(obj)
        current_approval_log = (
            ApprovalLog.objects.filter(
                content_type=content_type,
                object_id=obj.id,
                organization=org,
                action_type="under_approval",
            )
            .order_by("-created_at")
            .first()
        )

        if not current_approval_log:
            return Response({"detail": "This item is not currently under approval."}, status=400)

        current_approval_level = current_approval_log.level

        if current_level != current_approval_level:
            return Response(
                {
                    "detail": (
                        f"You are not authorized to approve at level L{current_approval_level}."
                    )
                },
                status=403,
            )

        serializer = ApprovalActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        action = serializer.validated_data["action"]
        comment = serializer.validated_data.get("comment", "")

        # Save ApprovalLog for this action
        ApprovalLog.objects.create(
            content_type=content_type,
            object_id=obj.id,
            content_object=obj,
            organization=org,
            approved_by=user,
            action_type="approved" if action == "approve" else "rejected",
            comment=comment,
            approved_at=timezone.now(),
            level=current_level,  # Add this line
        )

        if action == "approve":
            # Check if next level exists
            next_flow = get_next_approval_level(org, model_name, current_level)
            if next_flow:
                # Create ApprovalLog for next level
                ApprovalLog.objects.create(
                    content_type=content_type,
                    object_id=obj.id,
                    content_object=obj,
                    organization=org,
                    action_type="under_approval",
                    approval_sent_by=user,
                    approval_sent_at=timezone.now(),
                    comment=f"Sent for approval (L{next_flow.level})",
                    level=next_flow.level,
                )
                # Update object status to under_approval
                if hasattr(obj, "status"):
                    obj.status = "under_approval"
                    obj.save()
                # CREATE IN-APP NOTIFICATION FOR NEXT APPROVER
                create_approval_notification(
                    approver=next_flow.approver,
                    organization=org,
                    obj=obj,
                    model_name=model_name,
                    requester=user,  # Current approver who sent to next level
                )
                # Notify next approver (optional)
                if (
                    hasattr(next_flow.approver, "user_notification_preference")
                    and next_flow.approver.user_notification_preference.notify_on_approval_request
                ):
                    send_approval_email.delay(
                        recipient_email=next_flow.approver.email,
                        recipient_name=next_flow.approver.get_full_name(),
                        object_id=str(obj.id),
                        model_name=model_name,
                        requested_by=user.get_full_name(),
                    )
                return Response(
                    {
                        "detail": (
                            f"{model_name.title()} approved at L{current_level}, "
                            f"sent to L{next_flow.level}."
                        )
                    },
                    status=200,
                )

            else:
                if hasattr(obj, "status"):
                    obj.status = "approved"
                    obj.save()

                sent_action = (
                    ApprovalLog.objects.filter(
                        content_type=content_type,
                        object_id=obj.id,
                        action_type="under_approval",
                    )
                    .order_by("created_at")
                    .first()
                )
                # CREATE IN-APP NOTIFICATION FOR APPROVAL RESULT
                if sent_action and sent_action.approval_sent_by:
                    create_approval_result_notification(
                        recipient=sent_action.approval_sent_by,
                        organization=org,
                        obj=obj,
                        model_name=model_name,
                        action_type="approved",
                        approver=user,
                        comment=comment,
                    )

                if (
                    sent_action
                    and sent_action.approval_sent_by
                    and hasattr(sent_action.approval_sent_by, "user_notification_preference")
                    and sent_action.approval_sent_by.user_notification_preference.notify_on_approval_result  # noqa: E501
                ):
                    send_approval_status_email.delay(
                        model_name=model_name,
                        action_type="approve",
                        comment=comment,
                        to_email=sent_action.approval_sent_by.email,
                        to_name=sent_action.approval_sent_by.get_full_name(),
                    )

                return Response({"detail": f"{model_name.title()} fully approved."}, status=200)

        elif action == "reject":
            if hasattr(obj, "status"):
                obj.status = "rejected"
                obj.save()

            # Notify originator
            sent_action = (
                ApprovalLog.objects.filter(
                    content_type=content_type,
                    object_id=obj.id,
                    action_type="under_approval",
                )
                .order_by("created_at")
                .first()
            )

            # 🆕 CREATE IN-APP NOTIFICATION FOR REJECTION
            if sent_action and sent_action.approval_sent_by:
                create_approval_result_notification(
                    recipient=sent_action.approval_sent_by,
                    organization=org,
                    obj=obj,
                    model_name=model_name,
                    action_type="rejected",
                    approver=user,
                    comment=comment,
                )

            if (
                sent_action
                and sent_action.approval_sent_by
                and hasattr(sent_action.approval_sent_by, "user_notification_preference")
                and sent_action.approval_sent_by.user_notification_preference.notify_on_approval_result  # noqa: E501
            ):
                send_approval_status_email.delay(
                    model_name=model_name,
                    action_type="reject",
                    comment=comment,
                    to_email=sent_action.approval_sent_by.email,
                    to_name=sent_action.approval_sent_by.get_full_name(),
                )

            return Response(
                {"detail": f"{model_name.title()} rejected at L{current_level}."}, status=200
            )


class ApprovalFlowListAPIView(BaseAPIView):
    def get(self, request, model_name):
        user = request.user
        org = user.organization

        model_config = APPROVAL_MODEL_MAP.get(model_name.lower())
        if not model_config:
            return Response({"detail": "Invalid model name."}, status=400)

        model = model_config["model"]
        serializer_class = model_config["serializer"]

        assignment = ApprovalFlow.objects.filter(
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

        approver_level = assignment.level
        content_type = ContentType.objects.get_for_model(model)

        latest_log_level = (
            ApprovalLog.objects.filter(
                content_type=content_type,
                object_id=OuterRef("pk"),
                organization=org,
                action_type="under_approval",
            )
            .order_by("-created_at")
            .values("level")[:1]
        )

        queryset = model.objects.annotate(
            current_approval_level=Subquery(latest_log_level)
        ).filter(organization=org, status="under_approval", current_approval_level=approver_level)

        serializer = serializer_class(queryset, many=True)
        return Response(serializer.data, status=200)


class ApprovalLogListAPIView(BaseAPIView):
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
        actions = ApprovalLog.objects.filter(
            content_type=content_type, object_id=object_id, organization=org
        ).order_by("-created_at")

        serializer = ApprovalLogSerializer(actions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

from typing import ClassVar

from rest_framework import serializers

from rever.db.models import ApprovalAction, ApprovalAssignment, ApprovalSetting


class ApprovalSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApprovalSetting
        fields = ["organization", "model_name", "approval_enabled"]


class ApprovalAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApprovalAssignment
        fields = ["model_name", "approver"]


class ApprovalActionSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=[("approve", "Approve"), ("reject", "Reject")])
    comment = serializers.CharField(allow_blank=True, required=False)


class ApprovalActionLogSerializer(serializers.ModelSerializer):
    approved_by: ClassVar[serializers.StringRelatedField] = serializers.StringRelatedField()

    class Meta:
        model = ApprovalAction
        fields = [
            "action_type",
            "comment",
            "approval_sent_by",
            "approval_sent_at",
            "approved_by",
            "approved_at",
            "created_at",
        ]

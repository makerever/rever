from typing import ClassVar

from rest_framework import serializers

from rever.db.models import ApprovalConfig, ApprovalFlow, ApprovalLog


class ApprovalConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApprovalConfig
        fields = "__all__"
        read_only_fields = [
            "created_at",
            "updated_at",
            "organization",
        ]


class ApprovalFlowSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApprovalFlow
        fields = "__all__"
        read_only_fields = [
            "created_at",
            "updated_at",
            "organization",
        ]


class ApprovalActionSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=[("approve", "Approve"), ("reject", "Reject")])
    comment = serializers.CharField(allow_blank=True, required=False)


class ApprovalLogSerializer(serializers.ModelSerializer):
    approved_by: ClassVar[serializers.StringRelatedField] = serializers.StringRelatedField()

    class Meta:
        model = ApprovalLog
        fields = "__all__"
        read_only_fields = [
            "created_at",
            "updated_at",
            "approved_at",
            "organization",
        ]

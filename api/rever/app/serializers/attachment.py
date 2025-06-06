from rest_framework import serializers

from rever.db.models import Attachment


class AttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attachment
        fields = "__all__"
        read_only_fields = [
            "created_at",
            "updated_at",
            "file_name",
            "organization",
        ]

    def create(self, validated_data):
        validated_data["file_name"] = validated_data["file"].name
        return super().create(validated_data)

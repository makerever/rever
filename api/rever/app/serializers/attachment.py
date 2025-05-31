from rest_framework import serializers

from rever.db.models import Attachment


class AttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attachment
        fields = ["id", "file", "uploaded_by", "uploaded_at", "organization"]
        read_only_fields = ["file_name", "organization"]

    def create(self, validated_data):
        validated_data["file_name"] = validated_data["file"].name
        validated_data["uploaded_by"] = self.context["request"].user
        return super().create(validated_data)

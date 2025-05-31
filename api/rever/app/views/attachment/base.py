from django.contrib.contenttypes.models import ContentType
from rest_framework import generics, status
from rest_framework.response import Response

from rever.app.serializers import AttachmentSerializer
from rever.app.views.auth.base import BaseAPIView
from rever.db.models import Attachment


class AttachmentUploadAPIView(BaseAPIView, generics.CreateAPIView):
    serializer_class = AttachmentSerializer

    def post(self, request, *args, **kwargs):
        model = request.query_params.get("model")
        object_id = request.query_params.get("id")

        if not model or not object_id:
            return Response({"detail": "model and id are required"}, status=400)

        try:
            model_class = ContentType.objects.get(model=model.lower()).model_class()
            content_type = ContentType.objects.get_for_model(model_class)
            content_object = model_class.objects.get(id=object_id)
        except ContentType.DoesNotExist:
            return Response({"detail": "Invalid model"}, status=400)

        if not self.check_object_organization(content_object):
            return Response(
                {"detail": "Access denied - object outside your organization"}, status=403
            )

        # Delete existing if any
        Attachment.objects.filter(content_type=content_type, object_id=object_id).delete()

        serializer = self.get_serializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        attachment = serializer.save(
            content_type=content_type,
            object_id=object_id,
            uploaded_by=request.user,
            organization=getattr(content_object, "organization", None),
        )

        return Response(AttachmentSerializer(attachment).data, status=status.HTTP_201_CREATED)


class AttachmentListAPIView(BaseAPIView, generics.ListAPIView):
    serializer_class = AttachmentSerializer

    def get_queryset(self):
        model = self.request.query_params.get("model")
        object_id = self.request.query_params.get("id")

        if not model or not object_id:
            return Attachment.objects.none()

        try:
            model_class = ContentType.objects.get(model=model.lower()).model_class()
            content_type = ContentType.objects.get_for_model(model_class)
            content_object = model_class.objects.get(id=object_id)
        except ContentType.DoesNotExist:
            return Attachment.objects.none()
        except model_class.DoesNotExist:
            return Attachment.objects.none()

        if not self.check_object_organization(content_object):
            return Attachment.objects.none()

        return Attachment.objects.filter(
            content_type=content_type,
            object_id=object_id,
        )


class AttachmentDeleteAPIView(BaseAPIView, generics.DestroyAPIView):
    queryset = Attachment.objects.all()
    lookup_field = "id"

    def delete(self, request, *args, **kwargs):
        try:
            attachment = self.get_object()
        except Attachment.DoesNotExist:
            return Response({"detail": "Attachment not found."}, status=status.HTTP_404_NOT_FOUND)

        if not self.check_object_organization(attachment):
            return Response(
                {"detail": "You do not have permission to delete this attachment."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if attachment.file and attachment.file.storage.exists(attachment.file.name):
            attachment.file.delete(save=False)

        attachment.delete()
        return Response(
            {"detail": "Attachment deleted successfully."}, status=status.HTTP_204_NO_CONTENT
        )

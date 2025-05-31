from django.urls import path

from rever.app.views import (
    AttachmentDeleteAPIView,
    AttachmentListAPIView,
    AttachmentUploadAPIView,
)

urlpatterns = [
    path(
        "attachment/upload/",
        AttachmentUploadAPIView.as_view(),
        name="attachment-upload",
    ),
    path("attachment/list/", AttachmentListAPIView.as_view(), name="attachment-list"),
    path(
        "attachment/<uuid:id>/delete/",
        AttachmentDeleteAPIView.as_view(),
        name="attachment-delete",
    ),
]

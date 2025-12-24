"""
Intellidocs App URL Configuration
All OCR and Document Intelligence endpoints
"""

from django.urls import path

from rever.intellidocs.views import (
    DocumentExtractionViewSet,
    DocumentOCRResultAPIView,
    DocumentOCRStatusAPIView,
    DocumentOCRUploadAPIView,
)

urlpatterns = [
    # Document Upload and Processing (Generic: Bill, PO)
    path(
        "intellidocs/upload/",
        DocumentOCRUploadAPIView.as_view(),
        name="document-ocr-upload",
    ),
    path(
        "intellidocs/status/<uuid:task_id>/",
        DocumentOCRStatusAPIView.as_view(),
        name="document-ocr-status",
    ),
    path(
        "intellidocs/result/<uuid:task_id>/",
        DocumentOCRResultAPIView.as_view(),
        name="document-ocr-result",
    ),
    # OCR Extraction
    path(
        "intellidocs/extractions/",
        DocumentExtractionViewSet.as_view({"get": "list"}),
        name="document-extraction-list",
    ),
    path(
        "intellidocs/extractions/<uuid:pk>/",
        DocumentExtractionViewSet.as_view({"get": "retrieve"}),
        name="document-extraction-detail",
    ),
]

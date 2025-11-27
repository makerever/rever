"""
Intellidocs App URL Configuration
All OCR and Document Intelligence endpoints
"""

from django.urls import path

from rever.intellidocs.views.bill_ocr import (
    BillOCRResultAPIView,
    BillOCRStatusAPIView,
    BillOCRUploadAPIView,
)
from rever.intellidocs.views.extraction import BillExtractionViewSet

urlpatterns = [
    # Bill OCR Upload and Processing
    path(
        "intellidocs/bills/upload/",
        BillOCRUploadAPIView.as_view(),
        name="bill-ocr-upload",
    ),
    path(
        "intellidocs/bills/status/<uuid:task_id>/",
        BillOCRStatusAPIView.as_view(),
        name="bill-ocr-status",
    ),
    path(
        "intellidocs/bills/result/<uuid:task_id>/",
        BillOCRResultAPIView.as_view(),
        name="bill-ocr-result",
    ),
    # OCR Extraction Viewing/Debugging
    path(
        "intellidocs/bills/extractions/",
        BillExtractionViewSet.as_view({"get": "list"}),
        name="bill-extraction-list",
    ),
    path(
        "intellidocs/bills/extractions/<uuid:pk>/",
        BillExtractionViewSet.as_view({"get": "retrieve"}),
        name="bill-extraction-detail",
    ),
]

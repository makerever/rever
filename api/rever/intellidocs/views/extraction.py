"""
OCR Extraction API Views
For viewing and debugging OCR extraction results
"""

import logging

from rest_framework.response import Response

from rever.app.views.base_viewsets import BaseModelViewSet
from rever.intellidocs.models import DocumentExtraction
from rever.intellidocs.serializers import (
    DocumentExtractionDetailSerializer,
    DocumentExtractionListSerializer,
)

logger = logging.getLogger(__name__)


class DocumentExtractionViewSet(BaseModelViewSet):
    """
    ViewSet for viewing document extractions.
    Supports listing and detailed retrieval with analysis.
    """

    queryset = DocumentExtraction.objects.all()
    http_method_names = ["get"]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return DocumentExtractionDetailSerializer
        return DocumentExtractionListSerializer

    def get_queryset(self):
        """
        Filter by organization and optimize query
        """
        queryset = super().get_queryset()
        if self.action == "list":
            return queryset.select_related("bill", "purchase_order", "vendor_credit").order_by(
                "-created_at"
            )
        return queryset

    def retrieve(self, request, *args, **kwargs):
        """
        Return extraction details with comparison analysis
        """
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        data = serializer.data

        extracted_data = instance.extracted_data or {}

        # Compare extracted fields vs direct fields
        comparison = {
            "bill_number": {
                "extracted_from_json": extracted_data.get("bill_number"),
                "stored_direct_field": instance.bill_number,
                "match": extracted_data.get("bill_number") == instance.bill_number,
            },
            "vendor_name": {
                "extracted_from_json": extracted_data.get("vendor", {}).get("name")
                if extracted_data.get("vendor")
                else None,
                "stored_direct_field": instance.vendor_name,
                "match": (
                    extracted_data.get("vendor", {}).get("name")
                    if extracted_data.get("vendor")
                    else None
                )
                == instance.vendor_name,
            },
            "total_amount": {
                "extracted_from_json": extracted_data.get("amounts", {}).get("total")
                if extracted_data.get("amounts")
                else None,
                "stored_direct_field": str(instance.total_amount)
                if instance.total_amount
                else None,
            },
        }

        data["comparison_analysis"] = comparison
        data["has_conflicts"] = not all(
            c.get("match", True) for c in comparison.values() if "match" in c
        )

        data["ocr_stats"] = {
            "text_length": len(instance.raw_text) if instance.raw_text else 0,
            "line_count": instance.raw_text.count("\n") if instance.raw_text else 0,
            "line_items_count": len(extracted_data.get("line_items", [])) if extracted_data else 0,
        }

        return Response(data)

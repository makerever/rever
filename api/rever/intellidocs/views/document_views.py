"""
Document OCR API Views
Handles document upload, OCR processing, and status tracking for Bills and Purchase Orders
"""

import logging
import uuid

from django.core.files.storage import default_storage
from django.utils import timezone
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from rever.app.views.base import BaseAPIView
from rever.db.models.payable import Bill, PurchaseOrder, VendorCredit
from rever.intellidocs.constants import DocumentType, ProcessingStatus
from rever.intellidocs.models import OCRLog
from rever.intellidocs.serializers import (
    BillResultSerializer,
    DocumentUploadSerializer,
    PurchaseOrderResultSerializer,
    VendorCreditResultSerializer,
)
from rever.intellidocs.tasks import process_document_ocr_task

logger = logging.getLogger(__name__)

# Serializer dispatch map for document types
RESULT_SERIALIZER_MAP = {
    DocumentType.BILL: (Bill, BillResultSerializer),
    DocumentType.PURCHASE_ORDER: (PurchaseOrder, PurchaseOrderResultSerializer),
    DocumentType.VENDOR_CREDIT: (VendorCredit, VendorCreditResultSerializer),
}


class DocumentOCRUploadAPIView(BaseAPIView):
    """
    API View for uploading documents (Bills, POs) for OCR processing.
    Form Data: file (required), document_type (optional, default: 'bill')
    """

    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        """Handle document upload and trigger OCR processing"""
        serializer = DocumentUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        uploaded_file = serializer.validated_data["file"]
        document_type = serializer.validated_data.get("document_type", "bill")
        organization = self.get_organization()

        try:
            now = timezone.now()
            year = now.strftime("%Y")
            month = now.strftime("%m")
            file_ext = uploaded_file.name.split(".")[-1]
            unique_filename = (
                f"{uploaded_file.name.split('.')[0]}_{uuid.uuid4().hex[:12]}.{file_ext}"
            )
            # persistent path: organizations/{org_id}/{doc_type}/{year}/{month}/{filename}
            file_path = (
                f"organizations/{organization.id}/{document_type}/"
                f"{year}/{month}/{unique_filename}"
            )

            saved_path = default_storage.save(file_path, uploaded_file)

            logger.info(
                f"{document_type.title()} uploaded: {uploaded_file.name} "
                f"(path: {saved_path}, org: {organization.id})"
            )

            task_id = str(uuid.uuid4())

            # TODO: Dispatch correct task based on document_type
            # For now, if PO, we might need a placeholder or new task
            # Using current task for Bills, generic task later
            
            task = process_document_ocr_task.delay(
                file_path=saved_path,
                file_name=uploaded_file.name,
                organization_id=str(organization.id),
                task_id=task_id,
                engine="auto",
                document_type=document_type,
            )

            return Response(
                {
                    "task_id": task_id,
                    "celery_task_id": task.id,
                    "status": ProcessingStatus.PROCESSING,
                    "message": f"{document_type.title()} upload successful, processing started",
                    "file_name": uploaded_file.name,
                    "document_type": document_type,
                },
                status=status.HTTP_202_ACCEPTED,
            )

        except Exception as e:
            logger.error(f"Document upload failed: {e!s}", exc_info=True)
            return Response(
                {"error": "Failed to upload document", "detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class DocumentOCRStatusAPIView(BaseAPIView):
    """
    Check OCR processing status for any document
    """

    def get(self, request, task_id=None, *args, **kwargs):
        """Get OCR processing status"""
        # Ensure user is authenticated (organization check)
        self.get_organization()

        try:
            task_id_str = str(task_id)
            latest_log = (
                OCRLog.objects.filter(details__task_id=task_id_str).order_by("-created_at").first()
            )

            if not latest_log:
                return Response(
                    {
                        "task_id": task_id,
                        "status": ProcessingStatus.PROCESSING,
                        "message": "Processing in progress",
                    }
                )

            if latest_log.status == ProcessingStatus.FAILED:
                return Response(
                    {
                        "task_id": task_id,
                        "status": ProcessingStatus.FAILED,
                        "error": latest_log.error_details,
                        "message": "Processing failed",
                    }
                )

            elif latest_log.status == ProcessingStatus.COMPLETED:
                # Determine document type from log or extraction
                # We can try to fetch DocumentExtraction to get more details
                
                return Response(
                    {
                        "task_id": task_id,
                        "status": ProcessingStatus.COMPLETED,
                        "document_id": str(latest_log.document_id),
                        "document_type": latest_log.document_type,
                        "message": "Processing completed successfully",
                    }
                )

            return Response(
                {
                    "task_id": task_id,
                    "status": ProcessingStatus.PROCESSING,
                    "message": "Processing in progress",
                }
            )

        except Exception as e:
            logger.error(f"Failed to check status: {e}", exc_info=True)
            return Response(
                {"error": "Failed to retrieve status", "detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class DocumentOCRResultAPIView(BaseAPIView):
    """
    Retrieve the processed document data
    """

    def get(self, request, task_id=None, *args, **kwargs):
        """Get processed document data"""
        organization = self.get_organization()

        try:
            task_id_str = str(task_id)
            latest_log = (
                OCRLog.objects.filter(
                    details__task_id=task_id_str, status=ProcessingStatus.COMPLETED
                )
                .order_by("-created_at")
                .first()
            )

            if not latest_log or not latest_log.document_id:
                # Try finding in DocumentExtraction if log is missing but task is done?
                # Rely on log for now
                return Response(
                    {
                        "error": "Document not yet processed",
                        "message": "Processing is still in progress or failed",
                    },
                    status=status.HTTP_404_NOT_FOUND,
                )

            doc_id = latest_log.document_id
            doc_type = latest_log.document_type

            # Use dispatch map for cleaner routing
            if doc_type not in RESULT_SERIALIZER_MAP:
                return Response(
                    {"error": f"Unknown document type: {doc_type}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            model_class, serializer_class = RESULT_SERIALIZER_MAP[doc_type]
            
            try:
                document = model_class.objects.prefetch_related("items").get(
                    id=doc_id, organization=organization
                )
                serializer = serializer_class(document)
                return Response(serializer.data)
            except model_class.DoesNotExist:
                return Response(
                    {"error": f"{model_class.__name__} not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )

        except Exception as e:
            logger.error(f"Failed to retrieve document result: {e}", exc_info=True)
            return Response(
                {"error": "Failed to retrieve document", "detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

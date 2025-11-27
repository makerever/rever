"""
Bill OCR API Views
Handles bill document upload, OCR processing, and status tracking
"""

import logging
import uuid
from datetime import datetime

from django.core.files.storage import default_storage
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from rever.app.views.base import BaseAPIView
from rever.db.models.payable import Bill
from rever.intellidocs.models import OCRLog, ProcessingStatus
from rever.intellidocs.serializers import (
    BillOCRResultSerializer,
    BillOCRUploadSerializer,
)
from rever.intellidocs.tasks import process_bill_ocr_task

logger = logging.getLogger(__name__)


class BillOCRUploadAPIView(BaseAPIView):
    """Serializer for bill document upload"""

    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        """Handle bill upload and trigger OCR processing"""
        serializer = BillOCRUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        uploaded_file = serializer.validated_data["file"]
        organization = self.get_organization()

        try:
            # Save file to storage without creating Attachment record yet
            # The Celery task will create both Bill and Attachment after processing

            now = datetime.now()
            year = now.strftime("%Y")
            month = now.strftime("%m")
            file_ext = uploaded_file.name.split(".")[-1]
            unique_filename = (
                f"{uploaded_file.name.split('.')[0]}_{uuid.uuid4().hex[:12]}.{file_ext}"
            )
            # Format: organizations/{org_id}/{document_type}/{year}/{month}/{filename}
            file_path = f"organizations/{organization.id}/bill/{year}/{month}/{unique_filename}"

            saved_path = default_storage.save(file_path, uploaded_file)

            logger.info(
                f"Bill document uploaded to temp storage: {uploaded_file.name} "
                f"(path: {saved_path}, org: {organization.id})"
            )

            task_id = str(uuid.uuid4())

            task = process_bill_ocr_task.delay(
                file_path=saved_path,
                file_name=uploaded_file.name,
                organization_id=str(organization.id),
                task_id=task_id,
                engine="auto",
            )

            logger.info(f"Started bill OCR task: {task.id} for file {saved_path}")

            return Response(
                {
                    "task_id": task_id,
                    "celery_task_id": task.id,
                    "status": ProcessingStatus.PROCESSING,
                    "message": "Bill upload successful, OCR processing started",
                    "file_name": uploaded_file.name,
                },
                status=status.HTTP_202_ACCEPTED,
            )

        except Exception as e:
            logger.error(f"Bill upload failed: {e!s}", exc_info=True)
            return Response(
                {"error": "Failed to upload bill", "detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class BillOCRStatusAPIView(BaseAPIView):
    """
    Check OCR processing status for a bill

    GET /api/bills/ocr/status/{task_id}/
    """

    def get(self, request, task_id=None, *args, **kwargs):
        """Get OCR processing status"""
        organization = self.get_organization()

        try:
            # Convert UUID to string for JSON query
            task_id_str = str(task_id)
            latest_log = (
                OCRLog.objects.filter(details__task_id=task_id_str).order_by("-created_at").first()
            )

            if not latest_log:
                return Response(
                    {
                        "task_id": task_id,
                        "status": ProcessingStatus.PROCESSING,
                        "message": "OCR processing in progress",
                    }
                )

            if latest_log.status == ProcessingStatus.FAILED:
                return Response(
                    {
                        "task_id": task_id,
                        "status": ProcessingStatus.FAILED,
                        "error": latest_log.error_details,
                        "message": "OCR processing failed",
                    }
                )

            elif latest_log.status == ProcessingStatus.COMPLETED:
                bill_id = latest_log.document_id
                try:
                    bill = Bill.objects.get(id=bill_id, organization=organization)
                    return Response(
                        {
                            "task_id": task_id,
                            "status": ProcessingStatus.COMPLETED,
                            "bill_id": str(bill.id),
                            "bill_number": bill.bill_number,
                            "vendor_name": bill.vendor.vendor_name if bill.vendor else None,
                            "total": str(bill.total),
                            "message": "OCR processing completed successfully",
                        }
                    )
                except Bill.DoesNotExist:
                    return Response(
                        {
                            "task_id": task_id,
                            "status": ProcessingStatus.COMPLETED,
                            "message": "Processing completed but bill not found",
                        },
                        status=status.HTTP_404_NOT_FOUND,
                    )

            return Response(
                {
                    "task_id": task_id,
                    "status": ProcessingStatus.PROCESSING,
                    "message": "OCR processing in progress",
                }
            )

        except Exception as e:
            logger.error(f"Failed to check status: {e}", exc_info=True)
            return Response(
                {"error": "Failed to retrieve status", "detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class BillOCRResultAPIView(BaseAPIView):
    """
    Retrieve the processed bill data

    GET /api/bills/ocr/result/{task_id}/
    """

    def get(self, request, task_id=None, *args, **kwargs):
        """Get processed bill data"""
        organization = self.get_organization()

        try:
            # Convert UUID to string for JSON query
            task_id_str = str(task_id)
            latest_log = (
                OCRLog.objects.filter(
                    details__task_id=task_id_str, status=ProcessingStatus.COMPLETED
                )
                .order_by("-created_at")
                .first()
            )

            if not latest_log or not latest_log.document_id:
                return Response(
                    {
                        "error": "Bill not yet processed",
                        "message": "OCR processing is still in progress or failed",
                    },
                    status=status.HTTP_404_NOT_FOUND,
                )

            try:
                bill = Bill.objects.prefetch_related("items").get(
                    id=latest_log.document_id, organization=organization
                )
                serializer = BillOCRResultSerializer(bill)
                return Response(serializer.data)

            except Bill.DoesNotExist:
                return Response({"error": "Bill not found"}, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            logger.error(f"Failed to retrieve bill result: {e}", exc_info=True)
            return Response(
                {"error": "Failed to retrieve bill", "detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

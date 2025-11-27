from django.core.files.storage import default_storage
from django.db import models
from django.db.models import JSONField

from rever.db.models.base import BaseModel


class ProcessingStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    PROCESSING = "processing", "Processing"
    COMPLETED = "completed", "Completed"
    FAILED = "failed", "Failed"


class BaseDocument(BaseModel):
    """Base model for all document types"""

    file = models.FileField(upload_to="documents/%Y/%m/%d/", max_length=500)
    file_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=50)
    file_size = models.IntegerField()

    status = models.CharField(
        max_length=20, choices=ProcessingStatus.choices, default=ProcessingStatus.PENDING
    )

    raw_text = models.TextField(blank=True, null=True)
    extracted_data = JSONField(default=dict, blank=True)
    confidence_score = models.FloatField(null=True, blank=True)

    processed_at = models.DateTimeField(null=True, blank=True)
    processing_time = models.FloatField(
        null=True, blank=True, help_text="Total processing time in seconds"
    )
    error_message = models.TextField(blank=True, null=True)

    @property
    def file_url(self):
        """Generate accessible URL for the file"""
        if self.file:
            return default_storage.url(self.file.name)
        return None

    class Meta:
        abstract = True
        ordering = ["-created_at"]


class OCRLog(BaseModel):
    """Log for OCR operations"""

    document_type = models.CharField(max_length=50)
    document_id = models.UUIDField(null=True, blank=True)

    operation = models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=ProcessingStatus.choices)

    processing_time = models.FloatField(null=True, blank=True)
    ocr_engine = models.CharField(max_length=50, blank=True)

    details = JSONField(default=dict, blank=True)
    error_details = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "ocr_logs"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.document_type} - {self.operation} - {self.status}"


class BillExtraction(BaseDocument):
    """
    Stores the raw extraction results from a bill/invoice document.
    Acts as a staging area before creating the actual Bill record.
    """

    organization = models.ForeignKey(
        "db.Organization", on_delete=models.CASCADE, related_name="bill_extractions"
    )

    bill = models.ForeignKey(
        "db.Bill", on_delete=models.SET_NULL, null=True, blank=True, related_name="extractions"
    )

    bill_number = models.CharField(max_length=100, blank=True, null=True)
    po_number = models.CharField(max_length=100, blank=True, null=True)
    vendor_name = models.CharField(max_length=255, blank=True, null=True)
    bill_date = models.DateField(null=True, blank=True)
    due_date = models.DateField(null=True, blank=True)
    total_amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=10, default="USD")

    extraction_engine = models.CharField(max_length=50, default="ollama")
    model_version = models.CharField(max_length=50, blank=True)
    prompt_tokens = models.IntegerField(null=True, blank=True)
    completion_tokens = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = "bill_extractions"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Extraction {self.id} - {self.file_name}"

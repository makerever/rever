"""
Enums for the Intellidocs module.
Centralizes hardcoded values for better maintainability and type safety.
"""

from django.db import models


class DocumentType(models.TextChoices):
    """Document type enum."""

    BILL = "bill", "Bill"
    PURCHASE_ORDER = "purchase_order", "Purchase Order"
    VENDOR_CREDIT = "vendor_credit", "Vendor Credit"


class ProcessingStatus(models.TextChoices):
    """Document processing status enum."""

    PENDING = "pending", "Pending"
    PROCESSING = "processing", "Processing"
    COMPLETED = "completed", "Completed"
    FAILED = "failed", "Failed"


class LineItemStatus(models.TextChoices):
    """Line item status enum."""

    OPEN = "open", "Open"
    PARTIAL = "partial", "Partial"
    CLOSED = "closed", "Closed"


class ExtractionEngine(models.TextChoices):
    """OCR/Extraction engine enum."""

    OLLAMA = "ollama", "Ollama"
    TESSERACT = "tesseract", "Tesseract"
    GOOGLE_VISION = "google_vision", "Google Vision"
    AUTO = "auto", "Auto"

"""
OCR Service - Using Tesseract for document understanding
"""

import logging
import shutil
import tempfile
import time
from pathlib import Path

import pdfplumber
import pytesseract
from django.core.files.storage import default_storage
from pdf2image import convert_from_path
from PIL import Image

logger = logging.getLogger(__name__)


class OCRService:
    """OCR Service using Tesseract"""

    def __init__(self, use_preprocessing=True):
        self.use_preprocessing = use_preprocessing
        self._init_ocr_engines()

    def _init_ocr_engines(self):
        """Initialize OCR engines"""
        try:
            logger.info("OCR engines (Tesseract) initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize OCR engines: {e}")
            raise

    def process_document(self, file_path, engine="auto"):
        """
        Process document with OCR and return extracted text
        Handles files from both local filesystem and cloud storage (MinIO/S3)

        Args:
            file_path: Path to document in storage (can be MinIO path or local path)
            engine: OCR engine to use ('tesseract', 'easyocr', or 'auto')

        Returns:
            dict with 'text' and 'engine' keys
        """
        logger.info(f"Starting document processing: {file_path}")
        start_time = time.time()

        try:
            # Download file from storage to temporary location if using cloud storage

            if not default_storage.exists(file_path):
                raise FileNotFoundError(f"File not found in storage: {file_path}")

            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
                temp_path = tmp_file.name

                with default_storage.open(file_path, "rb") as storage_file:
                    shutil.copyfileobj(storage_file, tmp_file)

                logger.info(f"Downloaded file from storage to temp location: {temp_path}")

            try:
                result = self._process_with_ocr(temp_path, engine, start_time)
                return result

            finally:
                try:
                    Path(temp_path).unlink()
                    logger.debug(f"Cleaned up temp file: {temp_path}")
                except Exception as cleanup_error:
                    logger.warning(f"Failed to cleanup temp file {temp_path}: {cleanup_error}")

        except Exception as e:
            logger.error(f"Document processing error: {e}", exc_info=True)
            return {"text": "", "engine": "error", "error": str(e)}

    def _process_with_ocr(self, file_path: str, engine: str, start_time: float) -> dict:
        """Fallback to traditional OCR (Tesseract/EasyOCR)"""
        logger.debug("Processing with fallback OCR")

        try:
            file_ext = Path(file_path).suffix.lower()

            if file_ext == ".pdf":
                logger.debug("Processing PDF document")

                # Try text extraction first
                try:
                    with pdfplumber.open(file_path) as pdf:
                        text_parts = []
                        for page in pdf.pages:
                            text = page.extract_text()
                            if text:
                                text_parts.append(text)

                        if text_parts:
                            text = "\n\n".join(text_parts)
                            processing_time = time.time() - start_time
                            logger.info(
                                f"PDF text extraction successful: {len(text)} chars in "
                                f"{processing_time:.2f}s"
                            )

                            text = self._clean_text(text)

                            return {
                                "text": text,
                                "confidence": 1.0,
                                "engine": "pdfplumber",
                                "processing_time": processing_time,
                                "method": "text_extraction",
                            }
                except Exception as e:
                    logger.warning(f"PDF text extraction failed: {e}")

                # Convert PDF to images for OCR (Iterative to save memory)
                logger.debug("Converting PDF to images for OCR")

                # Get page count first
                from pdf2image import pdfinfo_from_path

                try:
                    info = pdfinfo_from_path(file_path)
                    page_count = info["Pages"]
                except Exception:
                    # Fallback if info fails
                    images = convert_from_path(file_path)
                    page_count = len(images)

                all_text = []
                # Process 5 pages at a time to balance memory and speed
                chunk_size = 5

                for i in range(1, page_count + 1, chunk_size):
                    last_page = min(i + chunk_size - 1, page_count)
                    logger.debug(f"Processing PDF pages {i} to {last_page} of {page_count}")

                    images = convert_from_path(
                        file_path, first_page=i, last_page=last_page, dpi=300
                    )

                    for image in images:
                        page_text = pytesseract.image_to_string(image)
                        all_text.append(page_text)
                        # Help GC
                        image.close()

                    # Clear images list
                    del images

                text = "\n\n--- PAGE BREAK ---\n\n".join(all_text)

            else:
                logger.debug("Processing image document")
                image = Image.open(file_path)
                text = pytesseract.image_to_string(image)

            text = self._clean_text(text)

            processing_time = time.time() - start_time
            logger.info(f"Fallback OCR complete: {len(text)} chars in {processing_time:.2f}s")

            return {
                "text": text,
                "confidence": 0.8,
                "engine": "tesseract",
                "processing_time": processing_time,
                "method": "ocr",
            }

        except Exception as e:
            processing_time = time.time() - start_time
            logger.error(f"Fallback OCR error: {e!s}", exc_info=True)
            return {
                "text": "",
                "confidence": 0.0,
                "error": str(e),
                "processing_time": processing_time,
                "engine": "error",
            }

    def _clean_text(self, text: str) -> str:
        """Clean extracted text"""
        if not text:
            return text

        text = text.replace("\x00", "")

        cleaned = []
        for char in text:
            if ord(char) >= 32 or char in "\n\r\t":
                cleaned.append(char)

        return "".join(cleaned)

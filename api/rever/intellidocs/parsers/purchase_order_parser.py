"""
Purchase Order Parser - Extract structured data from PO text
Extends BaseParser for PO-specific processing
"""

import logging

from rever.intellidocs.parsers.base import BaseParser
from rever.intellidocs.utils import normalize_payment_terms

logger = logging.getLogger(__name__)


class PurchaseOrderParser(BaseParser):
    """Parse Purchase Order data using local Ollama LLM with fallback to regex"""

    def __init__(self):
        super().__init__()

    def parse(self, text: str) -> dict:
        """Parse PO text using Ollama LLM"""
        logger.info(f"Starting Ollama PO parsing ({len(text)} characters)")

        result = self.parse_with_llm(text)
        if result:
            logger.info(
                f"Ollama PO parsing successful: "
                f"{len(result.get('line_items', []))} line items"
            )
            return result

        logger.warning("Ollama not available or failed, using fallback regex parser for PO")
        return self._fallback_parse(text)

    def _get_prompt(self, text: str) -> str:
        """Generate the LLM prompt for PO parsing"""
        return f"""
Extract Purchase Order (PO) data from this text and return ONLY a valid JSON object.

PO Text:
{text}

Extract and return this exact JSON structure:
{{
    "po_number": "PO number (e.g. PO-12345)",
    "po_date": "YYYY-MM-DD format",
    "delivery_date": "YYYY-MM-DD format or null",
    "vendor": {{
        "name": "vendor/seller company name",
        "address": "vendor address",
        "email": "vendor email"
    }},
    "customer": {{
        "name": "customer/buyer name",
        "address": "customer address"
    }},
    "payment_terms": "payment terms (e.g. Net 30)",
    "amounts": {{
        "subtotal": "number only",
        "tax": "number only",
        "total": "number only"
    }},
    "line_items": [
        {{
            "line_number": "line number",
            "description": "item description",
            "quantity": "number",
            "unit_price": "number",
            "amount": "number"
        }}
    ],
    "currency": "USD/EUR/etc",
    "comments": "any notes"
}}

IMPORTANT:
1. Return ONLY valid JSON.
2. Ensure dates are YYYY-MM-DD.
3. Vendor is the Seller, Customer is the Buyer.
"""



    def _validate_and_clean(self, data: dict) -> dict:
        """
        Validate and clean parsed PO data.
        Uses common methods from BaseParser for line items and vendor/customer normalization.
        """
        result = {
            "po_number": data.get("po_number"),
            "po_date": data.get("po_date"),
            "delivery_date": data.get("delivery_date"),
            "vendor": self._normalize_vendor_dict(data.get("vendor")),
            "customer": self._normalize_customer_dict(data.get("customer")),
            "payment_terms": normalize_payment_terms(data.get("payment_terms")),
            "amounts": data.get("amounts", {}),
            "line_items": self._clean_line_items(data.get("line_items", [])),
            "currency": str(data.get("currency", "USD"))[:10],
            "comments": data.get("comments"),
        }
        return result

    def _fallback_parse(self, text: str) -> dict:
        # Stub for fallback - implementing minimal regex
        logger.info("Using fallback regex parser for PO")
        return {
            "po_number": self._extract_po_number(text),
            "total": None
        }

    # PO number patterns in priority order
    PO_NUMBER_PATTERNS = [
        r"Purchase\s*Order\s*(?:#|no\.?|number)?\s*:?\s*([A-Z0-9\-_]+)",
        r"PO\s*(?:#|no\.?|number)?\s*:?\s*([A-Z0-9\-_]+)",
        r"P\.?O\.?\s*:?\s*([A-Z0-9\-_]+)",
        r"Order\s*(?:#|no\.?|number)\s*:?\s*([A-Z0-9\-_]+)",
    ]

    def _extract_po_number(self, text: str) -> str | None:
        """Extract PO number using common extraction logic."""
        return self._extract_document_number(text, self.PO_NUMBER_PATTERNS)

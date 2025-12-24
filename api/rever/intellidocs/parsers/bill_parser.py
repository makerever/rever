"""
Bill Parser - Extract structured data from bill text
Extends BaseParser for bill-specific processing
Uses Ollama (local LLM) for intelligent extraction with regex fallback
"""

import logging

from rever.intellidocs.parsers.base import BaseParser
from rever.intellidocs.utils import normalize_payment_terms

logger = logging.getLogger(__name__)


class BillParser(BaseParser):
    """Parse bill data using local Ollama LLM with fallback to regex"""

    def __init__(self):
        super().__init__()

    def parse(self, text: str) -> dict:
        """Parse bill text using Ollama LLM"""
        logger.info(f"Starting Ollama bill parsing ({len(text)} characters)")

        result = self.parse_with_llm(text)
        if result:
            logger.info(
                f"Ollama parsing successful: "
                f"{len(result.get('line_items', []))} line items"
            )
            return result

        logger.warning("Ollama not available or failed, using fallback regex parser")
        return self._fallback_parse(text)

    def _get_prompt(self, text: str) -> str:
        """Generate the LLM prompt for bill parsing"""
        return f"""
Extract bill/invoice data from this text and return ONLY a valid JSON object.

Bill text:
{text}

Extract and return this exact JSON structure:
{{
    "bill_number": "actual bill/invoice number",
    "bill_date": "YYYY-MM-DD format or null",
    "due_date": "YYYY-MM-DD format or null",
    "purchase_order": "PO number if present (e.g., PO-12345)",
    "vendor": {{
        "name": "vendor/seller company name ONLY",
        "address": "full vendor address",
        "tax_id": "VAT/GST/EIN/TIN number",
        "email": "vendor email if present",
        "phone": "vendor phone if present"
    }},
    "customer": {{
        "name": "customer/buyer name",
        "address": "customer address"
    }},
    "payment_terms": "NET30, NET60, DUE_ON_RECEIPT, etc.",
    "amounts": {{
        "subtotal": "number only, no currency",
        "tax": "number only",
        "tax_percentage": "tax percentage if available",
        "total": "number only"
    }},
    "line_items": [
        {{
            "line_number": "line number if present",
            "description": "product/service description",
            "quantity": "number",
            "unit_price": "number",
            "uom": "unit of measure (pcs, kg, hours, etc.)",
            "product_code": "product/SKU code if present",
            "amount": "number (quantity * unit_price)"
        }}
    ],
    "currency": "USD/INR/EUR/GBP",
    "comments": "any additional notes or terms"
}}

IMPORTANT RULES:
1. Extract ONLY the company name for vendor.name, NOT the entire invoice
2. Parse dates in YYYY-MM-DD format (e.g., "2025-06-30")
3. Vendor is FROM/SELLER, Customer is BILL TO/BUYER - don't mix them
4. All amounts must be numbers only (no currency symbols, commas)
5. Line items should be actual products/services with proper descriptions
6. For each line item, ensure quantity, unit_price and amount are numbers
7. Return ONLY valid JSON, no explanations or markdown
"""

    def _validate_and_clean(self, data: dict) -> dict:
        """
        Validate and clean parsed data.
        Uses common methods from BaseParser for line items and vendor/customer normalization.
        """
        result = {
            "bill_number": data.get("bill_number"),
            "bill_date": data.get("bill_date"),
            "due_date": data.get("due_date"),
            "purchase_order": data.get("purchase_order"),
            "vendor": self._normalize_vendor_dict(data.get("vendor")),
            "customer": self._normalize_customer_dict(data.get("customer")),
            "payment_terms": normalize_payment_terms(data.get("payment_terms")),
            "amounts": data.get("amounts", {}),
            "line_items": self._clean_line_items(data.get("line_items", [])),
            "currency": str(data.get("currency", "USD"))[:10],
            "comments": data.get("comments"),
        }

        # Validate bill number isn't a generic label
        if result["bill_number"]:
            bill_num = str(result["bill_number"]).strip()
            if bill_num.lower() in ["invoice", "bill", "number", "inv"]:
                result["bill_number"] = None

        return result

    def _fallback_parse(self, text: str) -> dict:
        """
        Minimal fallback parsing when Ollama is not available.
        Only extracts bill_number using regex.
        """
        logger.info("Using fallback regex parser for bill")
        return {
            "bill_number": self._extract_bill_number(text.lower(), text),
            "total": None,
        }

    # Bill number patterns in priority order
    BILL_NUMBER_PATTERNS = [
        r"Invoice\s*Number\s*[:#]?\s*([A-Z0-9\-_]+)",
        r"(?:\n|^)\s*#\s*([a-z0-9\-_]+)",
        r"invoice\s*(?:#|no\.?|number)\s*:?\s*([a-z0-9\-_]+)",
        r"bill\s*(?:#|no\.?|number)\s*:?\s*([a-z0-9\-_]+)",
        r"invoice\s*:\s*([a-z0-9\-_]+)",
        r"bill\s*:\s*([a-z0-9\-_]+)",
        r"\binv\b\s+(?:#|no\.)?\s*:?\s*([a-z0-9\-_]+)",
        r"invoice\s+([a-z0-9\-_]+)",
    ]

    def _extract_bill_number(self, text_lower: str, text_original: str) -> str | None:
        """Extract bill/invoice number using common extraction logic."""
        return self._extract_document_number(text_original, self.BILL_NUMBER_PATTERNS)

import logging

from rever.intellidocs.parsers.base import BaseParser

logger = logging.getLogger(__name__)


class VendorCreditParser(BaseParser):
    """Parse vendor credit data using Ollama LLM with regex fallback"""

    def parse(self, text: str) -> dict:
        """Parse vendor credit text using Ollama LLM"""
        logger.info(f"Starting Ollama vendor credit parsing ({len(text)} characters)")

        result = self.parse_with_llm(text)
        if result:
            logger.info(
                f"Ollama parsing successful: "
                f"{len(result.get('line_items', []))} line items"
            )
            return result

        logger.warning("Ollama not available or failed, using fallback regex parser")
        return self._fallback_parse(text)

    # LLM PROMPT

    def _get_prompt(self, text: str) -> str:
        return f"""
Extract vendor credit / credit note data from this text and return ONLY valid JSON.

Document text:
{text}

Return this exact JSON structure:
{{
    "credit_note_number": "actual credit note number",
    "credit_note_date": "YYYY-MM-DD format or null",
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
    "amounts": {{
        "subtotal": "number only",
        "tax": "number only",
        "tax_percentage": "tax percentage if available",
        "total": "number only"
    }},
    "line_items": [
        {{
            "line_number": "line number if present",
            "description": "item description",
            "quantity": "number",
            "unit_price": "number",
            "uom": "unit of measure",
            "product_code": "product code",
            "amount": "number"
        }}
    ],
    "currency": "USD/INR/EUR/GBP",
    "reason": "reason for credit",
    "notes": "any additional notes"
}}

IMPORTANT:
1. Credit note number may appear as CN, Credit Memo, Credit Note No, etc.
2. Extract ONLY company name for vendor.name.
3. Return ONLY valid JSON.
"""

    def _validate_and_clean(self, data: dict) -> dict:
        result = {
            "credit_note_number": data.get("credit_note_number"),
            "credit_note_date": data.get("credit_note_date"),
            "vendor": self._normalize_vendor_dict(data.get("vendor")),
            "customer": self._normalize_customer_dict(data.get("customer")),
            "amounts": data.get("amounts", {}),
            "line_items": self._clean_line_items(data.get("line_items", [])),
            "currency": str(data.get("currency", "USD"))[:10],
            "reason": data.get("reason"),
            "notes": data.get("notes"),
        }

        # Validate credit note number isn't generic
        if result["credit_note_number"]:
            val = str(result["credit_note_number"]).strip()
            if val.lower() in ["credit", "credit note", "memo", "number"]:
                result["credit_note_number"] = None

        return result

    # FALLBACK PARSING

    CREDIT_NOTE_PATTERNS = [
    r"(?:Credit\s*Note\s*)(CN[-\w]*\d+[-\w]*)",
    r"Credit\s*Note\s*(?:No\.?|Number)?\s*[:#]?\s*([A-Z0-9\-_/]*\d+[A-Z0-9\-_/]*)",
    r"Credit\s*Memo\s*(?:No\.?|Number)?\s*[:#]?\s*([A-Z0-9\-_/]*\d+[A-Z0-9\-_/]*)",
    r"\b(CN[-:\s]*[A-Z0-9\-_/]*\d+[A-Z0-9\-_/]*)\b",
    ]

    def _fallback_parse(self, text: str) -> dict:
        logger.info("Using fallback regex parser for vendor credit")
        return {
            "credit_note_number": self._extract_credit_note_number(text),
            "total": None,
        }
    
    def _extract_credit_note_number(self, text: str) -> str | None:
        return self._extract_document_number(text, self.CREDIT_NOTE_PATTERNS)
    
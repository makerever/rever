"""
Bill Parser - Extract structured data from bill text
Extends InvoiceParser patterns for bill-specific processing
Uses Ollama (local LLM) for intelligent extraction with regex fallback
"""

import json
import logging
import re

import requests
from django.conf import settings

from rever.intellidocs.utils import clean_decimal, normalize_payment_terms

logger = logging.getLogger(__name__)


class BillParser:
    """Parse bill data using local Ollama LLM with fallback to regex"""

    # Pre-compiled regex patterns

    # 1. Complex Pattern (Description Qty Price Discount Tax Amount)
    # Matches: ... 1.00 238.98 15.00% TaxExempt 203.13
    # Group 1: Description
    # Group 2: Quantity (float)
    # Group 3: Unit Price (float)
    # Group 4: Amount (float)
    COMPLEX_ITEM_PATTERN = re.compile(
        r"(.*?)\s+(\d+(?:\.\d+)?)\s+[\$€£]?\s*([\d,]+\.?\d{2})\s+.*?[\$€£]?\s*([\d,]+\.?\d{2})$"
    )

    # 2. Standard Pattern (Description Qty Price Amount)
    # Matches: Description ... Qty ... Price ... Amount
    STANDARD_ITEM_PATTERN = re.compile(
        r"(.*?)\s+(\d+(?:\.\d+)?)\s+[\$€£]?\s*([\d,]+\.?\d{0,2})\s+[\$€£]?\s*([\d,]+\.?\d{0,2})$"
    )

    # 3. Dell Transaction Pattern: Date Description Amount
    DELL_ITEM_PATTERN = re.compile(
        r"(\d{2}-\d{2}-\d{2})\s+(.*?)\s+((?:-|\+)?\s*[\$€£]?\s*[\d,]+\.?\d{2})"
    )

    # 4. Flexible Pattern (Last Resort)
    # Matches lines ending in numbers when other patterns fail
    FLEXIBLE_ITEM_PATTERN = re.compile(
        r"(.*?)\s+(\d+)\s+[\$€£]?\s*([\d,]+\.?\d{0,2})\s+[\$€£]?\s*([\d,]+\.?\d{0,2})$"
    )

    def __init__(self):
        self.ollama_url = settings.OLLAMA_URL
        self.model = settings.OLLAMA_MODEL

    def parse(self, text: str) -> dict:
        """Parse bill text using Ollama LLM"""
        logger.info(f"Starting Ollama bill parsing ({len(text)} characters)")

        try:
            if not self._check_ollama():
                logger.warning("Ollama not available, using fallback regex parser")
                return self._fallback_parse(text)

            prompt = f"""
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

            response = requests.post(
                self.ollama_url,
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "format": "json",
                    "stream": False,
                    "temperature": 0.1,
                    "options": {"num_predict": 2000},
                },
                timeout=300,
            )

            if response.status_code != 200:
                logger.error(f"Ollama API error: {response.status_code}")
                return self._fallback_parse(text)

            result = response.json()
            result_text = result.get("response", "{}")
            result_text = self._extract_json(result_text)
            parsed_data = json.loads(result_text)
            parsed_data = self._validate_and_clean(parsed_data)

            logger.info(
                f"Ollama parsing successful: {len(parsed_data.get('line_items', []))} line items"
            )
            return parsed_data

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Ollama response as JSON: {e}")
            return self._fallback_parse(text)
        except requests.exceptions.RequestException as e:
            logger.error(f"Ollama connection error: {e}")
            return self._fallback_parse(text)
        except Exception as e:
            logger.error(f"Ollama parsing error: {e!s}", exc_info=True)
            return self._fallback_parse(text)

    def _check_ollama(self) -> bool:
        """Check if Ollama is running"""
        try:
            # Derive tags URL from generate URL (e.g. .../api/generate -> .../api/tags)
            tags_url = self.ollama_url.replace("/api/generate", "/api/tags")
            response = requests.get(tags_url, timeout=300)
            return response.status_code == 200
        except Exception:
            return False

    def _extract_json(self, text: str) -> str:
        """Extract JSON from text that might contain markdown or extra content"""
        # Case: ```json ... ```
        if "```json" in text:
            parts = text.split("```json", 1)
            if len(parts) > 1:
                after = parts[1]
                text = after.split("```", 1)[0] if "```" in after else after

        # Case: generic ``` ... ```
        elif "```" in text:
            parts = text.split("```")
            text = parts[1] if len(parts) >= 3 else text.replace("```", "")

        # Extract between first { and last }
        start = text.find("{")
        end = text.rfind("}") + 1

        if start >= 0 and end > start:
            return text[start:end].strip()

        return text.strip()

    def _validate_and_clean(self, data: dict) -> dict:
        """
        Validate and clean parsed data.
        Acts as a firewall between LLM output and the application.
        Ensures:
        1. Numbers are actual Decimals.
        2. Structure is consistent (no missing keys).
        3. Garbage data is filtered out.
        """
        result = {
            "bill_number": data.get("bill_number"),
            "bill_date": data.get("bill_date"),
            "due_date": data.get("due_date"),
            "purchase_order": data.get("purchase_order"),
            "vendor": data.get("vendor", {}),
            "customer": data.get("customer", {}),
            "payment_terms": data.get("payment_terms"),
            "amounts": data.get("amounts", {}),
            "line_items": data.get("line_items", []),
            "currency": str(data.get("currency", "USD"))[:10],
            "comments": data.get("comments"),
        }

        if result["bill_number"]:
            bill_num = str(result["bill_number"]).strip()
            if bill_num.lower() in ["invoice", "bill", "number", "inv"]:
                result["bill_number"] = None

        if not isinstance(result["vendor"], dict):
            result["vendor"] = {}
        result["vendor"] = {
            "name": result["vendor"].get("name"),
            "address": result["vendor"].get("address"),
            "tax_id": result["vendor"].get("tax_id"),
            "email": result["vendor"].get("email"),
            "phone": result["vendor"].get("phone"),
        }

        if not isinstance(result["customer"], dict):
            result["customer"] = {}
        result["customer"] = {
            "name": result["customer"].get("name"),
            "address": result["customer"].get("address"),
        }

        if result["payment_terms"]:
            result["payment_terms"] = normalize_payment_terms(result["payment_terms"])

        # Clean and validate line items with safe None handling
        cleaned_items = []
        if data.get("line_items"):
            for item in data["line_items"]:
                if item and isinstance(item, dict):
                    # Safely extract values with default to empty string or 0
                    desc_val = item.get("description")
                    qty_val = item.get("quantity")
                    price_val = item.get("unit_price")
                    amt_val = item.get("amount")
                    uom_val = item.get("uom")
                    code_val = item.get("product_code")

                    cleaned_item = {
                        "line_number": item.get("line_number", 0),
                        "description": desc_val.strip()
                        if desc_val and isinstance(desc_val, str)
                        else "",
                        "quantity": clean_decimal(qty_val) or 0,
                        "unit_price": clean_decimal(price_val) or 0,
                        "amount": clean_decimal(amt_val) or 0,
                        "uom": uom_val.strip() if uom_val and isinstance(uom_val, str) else "",
                        "product_code": code_val.strip()
                        if code_val and isinstance(code_val, str)
                        else "",
                    }
                    # Only add if has description and some meaningful data
                    if cleaned_item["description"] and (
                        cleaned_item["quantity"] or cleaned_item["amount"]
                    ):
                        cleaned_items.append(cleaned_item)

        result["line_items"] = cleaned_items

        return result

    def _fallback_parse(self, text: str) -> dict:
        """
        Fallback regex-based parsing when Ollama is not available.
        Acts as a safety net if:
        1. Ollama is offline.
        2. API errors occur.
        3. LLM returns invalid JSON.
        Uses strict pattern matching instead of AI.
        """
        logger.info("Using fallback regex parser for bill")

        text_lower = text.lower()

        result = {
            "bill_number": self._extract_bill_number(text_lower, text),
            "bill_date": self._extract_date(text_lower, "bill"),
            "due_date": self._extract_date(text_lower, "due"),
            "purchase_order": self._extract_purchase_order(text),
            "vendor": self._extract_vendor(text),
            "customer": self._extract_customer(text),
            "payment_terms": self._extract_payment_terms(text),
            "amounts": self._extract_amounts(text_lower, text),
            "line_items": self._extract_line_items(text),
            "currency": self._detect_currency(text),
            "comments": None,
        }

        return result

    def _extract_bill_number(self, text_lower: str, text_original: str) -> str | None:
        """Extract bill/invoice number"""
        # First, try to find explicit "InvoiceNumber" or "Invoice Number" which is very specific
        specific_match = re.search(
            r"Invoice\s*Number\s*[:#]?\s*([A-Z0-9\-_]+)", text_original, re.IGNORECASE
        )
        if specific_match:
            candidate = specific_match.group(1).strip()
            # Avoid small numbers if they look like suite numbers (heuristic)
            if len(candidate) > 3 or (candidate.isdigit() and int(candidate) > 1000):
                return candidate
            # If small, check if it's not near "Suite"
            start_pos = specific_match.start()
            context = text_original[max(0, start_pos - 20) : start_pos].lower()
            if "suite" not in context:
                return candidate

        patterns = [
            r"(?:\n|^)\s*#\s*([a-z0-9\-_]+)",  # High priority: # at start of line
            r"invoice\s*(?:#|no\.?|number)\s*:?\s*([a-z0-9\-_]+)",  # Explicit Invoice #
            r"bill\s*(?:#|no\.?|number)\s*:?\s*([a-z0-9\-_]+)",  # Explicit Bill #
            r"invoice\s*:\s*([a-z0-9\-_]+)",  # Invoice: ...
            r"bill\s*:\s*([a-z0-9\-_]+)",  # Bill: ...
            r"\binv\b\s+(?:#|no\.)?\s*:?\s*([a-z0-9\-_]+)",  # Require space after inv
            r"invoice\s+([a-z0-9\-_]+)",  # Fallback: Invoice 123
        ]

        for pattern in patterns:
            # Use finditer to check ALL matches, not just the first one
            for match in re.finditer(pattern, text_original, re.IGNORECASE):
                candidate = match.group(1).strip()
                # Validation:
                # 1. Not a common keyword
                if candidate.lower() in ["date", "total", "due", "amount", "number"]:
                    continue
                # 2. Length check (usually > 2)
                if len(candidate) < 3:
                    continue
                # 3. Context check: ensure it's not "Suite 126"
                start_pos = match.start()
                context = text_lower[max(0, start_pos - 20) : start_pos]
                if "suite" in context:
                    continue

                return candidate

        return None

    def _extract_purchase_order(self, text: str) -> str | None:
        """Extract Purchase Order number"""
        patterns = [
            r"PO\s*(?:#|no\.?|number)?\s*:?\s*([A-Z0-9\-_]+)",
            r"Purchase\s*Order\s*(?:#|no\.?|number)?\s*:?\s*([A-Z0-9\-_]+)",
            r"P\.O\.\s*(?:#|no\.?|number)?\s*:?\s*([A-Z0-9\-_]+)",
        ]

        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                po_num = match.group(1).strip()
                if len(po_num) > 2 and po_num.lower() not in ["date", "box", "number"]:
                    return po_num
        return None

    def _extract_date(self, text: str, date_type: str | None = None) -> str | None:
        """Extract dates"""
        if date_type == "bill":
            keywords = r"(?:bill|invoice|issue|statement|billing|date)"
        elif date_type == "due":
            keywords = r"(?:due|payment)\s*date"
        else:
            keywords = r"date"

        patterns = [
            rf"{keywords}\s*:?\s*(\d{{4}}-\d{{2}}-\d{{2}})",
            rf"{keywords}\s*:?\s*(\d{{1,2}}[\/\-\.]\d{{1,2}}[\/\-\.]\d{{2,4}})",
            rf"{keywords}\s*:?\s*([A-Za-z]+\s+\d{{1,2}}\s*,?\s*\d{{4}})",
            rf"{keywords}\s*:?\s*(\d{{1,2}}[\/\-\.][A-Za-z]{{3}}[\/\-\.]\d{{2,4}})",  # 31-Jan-2024
        ]

        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                date_str = match.group(1).strip()
                return date_str

        return None

    def _extract_vendor(self, text: str) -> dict:
        """Extract vendor info"""
        lines = text.split("\n")
        vendor = {"name": None, "address": None, "tax_id": None, "email": None, "phone": None}

        # Heuristic: Vendor is often the first non-empty line
        for line in lines[:5]:
            line = line.strip()
            # Skip if line is just "Invoice" or similar generic headers
            if (
                line
                and len(line) > 3
                and line.lower() not in ["invoice", "tax invoice", "bill", "purchase order"]
            ):
                vendor["name"] = line
                break

        vat_match = re.search(r"(?:VAT|GST|TAX)\s*ID:?\s*([A-Z0-9]+)", text, re.IGNORECASE)
        if vat_match:
            vendor["tax_id"] = vat_match.group(1)

        email_match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", text)
        if email_match:
            vendor["email"] = email_match.group(0)

        return vendor

    def _extract_customer(self, text: str) -> dict:
        """Extract customer info"""
        customer = {"name": None, "address": None}

        # Look for "Bill to" block
        bill_to_match = re.search(
            r"Bill\s+to\s*(?:Address)?\s*:?\s*\n(.*?)(?:\n|$)", text, re.IGNORECASE
        )
        if bill_to_match:
            customer["name"] = bill_to_match.group(1).strip()

        return customer

    def _extract_payment_terms(self, text: str) -> str | None:
        """Extract payment terms"""

        terms_match = re.search(
            r"(?:payment\s+terms|terms)\s*:?\s*([\w \t\d]+)", text, re.IGNORECASE
        )
        if terms_match:
            return normalize_payment_terms(terms_match.group(1))

        # Also look for standalone numbers like "45" days
        days_match = re.search(r"(\d{1,2})\s*days?", text, re.IGNORECASE)
        if days_match:
            return normalize_payment_terms(days_match.group(1))

        return None

    def _extract_amounts(self, text_lower: str, text_original: str) -> dict:
        """Extract amounts"""
        amounts = {}

        total_patterns = [
            r"total\s*(?:amount)?\s*(?:due)?\s*:?\s*\$?\s*([\d,]+\.?\d*)",
            r"amount\s+due\s*:?\s*\$?\s*([\d,]+\.?\d*)",
            r"balance\s*due\s*:?\s*\$?\s*([\d,]+\.?\d*)",
        ]

        for pattern in total_patterns:
            match = re.search(pattern, text_lower, re.IGNORECASE)
            if match:
                amounts["total"] = match.group(1).replace(",", "")
                break

        subtotal_match = re.search(
            r"subtotal\s*:?\s*\$?\s*([\d,]+\.?\d*)", text_lower, re.IGNORECASE
        )
        if subtotal_match:
            amounts["subtotal"] = subtotal_match.group(1).replace(",", "")

        # Tax
        tax_match = re.search(
            r"(?:tax|vat|gst)\s*(?:\(.*?\))?\s*:?\s*\$?\s*([\d,]+\.?\d*)",
            text_lower,
            re.IGNORECASE,
        )
        if tax_match:
            amounts["tax"] = tax_match.group(1).replace(",", "")

        tax_pct_match = re.search(r"(?:tax|vat|gst)\s*\(([\d.]+)%\)", text_original, re.IGNORECASE)
        if tax_pct_match:
            amounts["tax_percentage"] = tax_pct_match.group(1)

        return amounts

    def _extract_line_items(self, text: str) -> list:
        """Extract line items from text - using invoice_parser logic"""
        line_items = []

        # Pre-process: Replace pipes with spaces
        text = text.replace("|", " ")

        lines = text.split("\n")

        # Common column headers to identify the start of the table
        header_keywords = [
            "description",
            "item",
            "qty",
            "quantity",
            "price",
            "amount",
            "total",
            "transaction",
            "detail",
            "service",
            "product",
        ]
        start_index = -1

        for i, line in enumerate(lines):
            if sum(1 for kw in header_keywords if kw in line.lower()) >= 2:
                start_index = i + 1
                break

        if start_index == -1:
            # Fallback: try to find lines that look like items even without header
            start_index = 0

        current_item = None

        # 1. Complex Pattern (Description Qty Price Discount Tax Amount)
        # Matches: ... 1.00 238.98 15.00% TaxExempt 203.13
        # Uses self.COMPLEX_ITEM_PATTERN

        # 2. Standard Pattern (Description Qty Price Amount)
        # Matches: Description ... Qty ... Price ... Amount
        # Uses self.STANDARD_ITEM_PATTERN

        # 3. Dell Transaction Pattern: Date Description Amount
        # Uses self.DELL_ITEM_PATTERN

        for i in range(start_index, len(lines)):
            line = lines[i].strip()
            if not line or "subtotal" in line.lower() or "page" in line.lower():
                if current_item:
                    line_items.append(current_item)
                    current_item = None
                if (
                    "total" in line.lower()
                    and "subtotal" not in line.lower()
                    and re.search(r"total\s*[\$€£]?\s*[\d,]+\.?\d{2}", line.lower())
                ):
                    # Stop if we hit the total line
                    break
                continue

            # Check for Dell pattern first
            dell_match = self.DELL_ITEM_PATTERN.search(line)
            if dell_match:
                if current_item:
                    line_items.append(current_item)

                amount_str = (
                    dell_match.group(3)
                    .replace(",", "")
                    .replace("$", "")
                    .replace("€", "")
                    .replace("£", "")
                )

                current_item = {
                    "description": dell_match.group(2).strip(),
                    "quantity": "1",
                    "unit_price": amount_str,
                    "amount": amount_str,
                }
                continue

            # Check complex pattern first (more specific)
            match = self.COMPLEX_ITEM_PATTERN.search(line)
            if match:
                if current_item:
                    line_items.append(current_item)

                current_item = {
                    "description": match.group(1).strip(),
                    "quantity": match.group(2).replace(",", ""),
                    "unit_price": match.group(3).replace(",", ""),
                    "amount": match.group(4).replace(",", ""),
                }
                continue

            # Check standard pattern
            match = self.STANDARD_ITEM_PATTERN.search(line)
            if match:
                if current_item:
                    line_items.append(current_item)

                current_item = {
                    "description": match.group(1).strip(),
                    "quantity": match.group(2).replace(",", ""),
                    "unit_price": match.group(3).replace(",", ""),
                    "amount": match.group(4).replace(",", ""),
                }
            elif current_item:
                # Stop appending if we hit footer-like text
                lower_line = line.lower()
                if any(
                    kw in lower_line
                    for kw in [
                        "balance",
                        "payment",
                        "visit",
                        "www.",
                        "http",
                        "please",
                        "account",
                        "thank you",
                        "routing",
                        "swift",
                    ]
                ):
                    line_items.append(current_item)
                    current_item = None
                    continue

                # Append to description of current item
                current_item["description"] += " " + line
            else:
                # Try a more flexible pattern for lines ending in numbers (last resort)
                flexible_match = self.FLEXIBLE_ITEM_PATTERN.search(line)
                if flexible_match:
                    if current_item:
                        line_items.append(current_item)

                    current_item = {
                        "description": flexible_match.group(1).strip(),
                        "quantity": flexible_match.group(2).replace(",", ""),
                        "unit_price": flexible_match.group(3).replace(",", ""),
                        "amount": flexible_match.group(4).replace(",", ""),
                    }

        if current_item:
            line_items.append(current_item)

        return line_items

    def _detect_currency(self, text: str) -> str:
        """Detect currency"""
        if "EUR" in text.upper() or "€" in text:
            return "EUR"
        elif "GBP" in text.upper() or "£" in text:
            return "GBP"
        elif "INR" in text.upper() or "₹" in text:
            return "INR"
        elif "JPY" in text.upper() or "¥" in text:
            return "JPY"
        elif "USD" in text.upper() or "$" in text:
            return "USD"
        return "USD"

"""
Base Parser - Abstract base class for document parsers
Provides shared functionality for LLM-based parsing with regex fallback
"""

import json
import logging
import re
from abc import ABC, abstractmethod

import requests
from django.conf import settings

logger = logging.getLogger(__name__)


class BaseParser(ABC):
    """
    Abstract base class for document parsers.
    Provides common functionality for Ollama LLM integration.
    """

    def __init__(self):
        self.ollama_url = getattr(settings, "OLLAMA_URL", "http://localhost:11434/api/generate")
        self.model = getattr(settings, "OLLAMA_MODEL", "qwen2.5vl:7b")
        self.timeout = getattr(settings, "OLLAMA_TIMEOUT", 300)

    @abstractmethod
    def parse(self, text: str) -> dict:
        """
        Parse document text and return structured data.
        Must be implemented by subclasses.
        """

    @abstractmethod
    def _fallback_parse(self, text: str) -> dict:
        """
        Fallback parsing using regex when LLM is unavailable.
        Must be implemented by subclasses.
        """

    @abstractmethod
    def _get_prompt(self, text: str) -> str:
        """
        Generate the LLM prompt for this document type.
        Must be implemented by subclasses.
        """

    @abstractmethod
    def _validate_and_clean(self, data: dict) -> dict:
        """
        Validate and clean parsed data.
        Must be implemented by subclasses.
        """

    def check_ollama_available(self) -> bool:
        """Check if Ollama LLM service is running and available."""
        try:
            tags_url = self.ollama_url.replace("/api/generate", "/api/tags")
            response = requests.get(tags_url, timeout=5)
            return response.status_code == 200
        except requests.exceptions.RequestException:
            return False

    def call_ollama(self, prompt: str) -> str | None:
        """
        Call Ollama API with the given prompt.
        Returns the response text or None on failure.
        """
        try:
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
                timeout=self.timeout,
            )

            if response.status_code != 200:
                logger.error(f"Ollama API error: {response.status_code}")
                return None

            result = response.json()
            return result.get("response", "{}")

        except requests.exceptions.RequestException as e:
            logger.error(f"Ollama connection error: {e}")
            return None

    def extract_json_from_text(self, text: str) -> str:
        """
        Extract JSON from text that might contain markdown or extra content.
        Handles ```json ... ``` blocks and other formats.
        """
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

    def _clean_line_items(self, line_items: list) -> list:
        """
        Common line item cleaning logic.
        Cleans and validates line items from LLM output.
        """
        from rever.intellidocs.utils import clean_decimal
        
        cleaned_items = []
        if not line_items:
            return cleaned_items
            
        for item in line_items:
            if not item or not isinstance(item, dict):
                continue
                
            desc_val = item.get("description")
            qty_val = item.get("quantity")
            price_val = item.get("unit_price")
            amt_val = item.get("amount")
            uom_val = item.get("uom")
            code_val = item.get("product_code")

            cleaned_item = {
                "line_number": item.get("line_number", 0),
                "description": desc_val.strip() if desc_val and isinstance(desc_val, str) else "",
                "quantity": clean_decimal(qty_val) or 0,
                "unit_price": clean_decimal(price_val) or 0,
                "amount": clean_decimal(amt_val) or 0,
                "uom": uom_val.strip() if uom_val and isinstance(uom_val, str) else "",
                "product_code": code_val.strip() if code_val and isinstance(code_val, str) else "",
            }
            
            # Only add if has description and some meaningful data
            has_data = cleaned_item["quantity"] or cleaned_item["amount"]
            if cleaned_item["description"] and has_data:
                cleaned_items.append(cleaned_item)

        return cleaned_items

    def _normalize_vendor_dict(self, vendor_data: dict | None) -> dict:
        """Normalize vendor dictionary structure."""
        if not isinstance(vendor_data, dict):
            return {}
        return {
            "name": vendor_data.get("name"),
            "address": vendor_data.get("address"),
            "tax_id": vendor_data.get("tax_id"),
            "email": vendor_data.get("email"),
            "phone": vendor_data.get("phone"),
        }

    def _normalize_customer_dict(self, customer_data: dict | None) -> dict:
        """Normalize customer dictionary structure."""
        if not isinstance(customer_data, dict):
            return {}
        return {
            "name": customer_data.get("name"),
            "address": customer_data.get("address"),
        }

    def _extract_document_number(
        self, 
        text: str, 
        patterns: list[str],
        exclude_keywords: list[str] | None = None,
    ) -> str | None:
        """
        Common document number extraction with validation.
        
        Args:
            text: Document text to search
            patterns: List of regex patterns to try (in priority order)
            exclude_keywords: Keywords to exclude from matches
            
        Returns:
            Extracted document number or None
        """
        if exclude_keywords is None:
            exclude_keywords = ["date", "total", "due", "amount", "number", "box"]
        
        text_lower = text.lower()
        
        for pattern in patterns:
            for match in re.finditer(pattern, text, re.IGNORECASE):
                candidate = match.group(1).strip()
                
                # Validation checks
                if not candidate:
                    continue
                    
                # 1. Not a common keyword
                if candidate.lower() in exclude_keywords:
                    continue
                    
                # 2. Minimum length (usually > 2)
                if len(candidate) < 3:
                    continue
                    
                # 3. Context check: avoid "Suite 126" or "Box 123"
                start_pos = match.start()
                context = text_lower[max(0, start_pos - 20):start_pos]
                if any(kw in context for kw in ["suite", "box", "apt", "unit"]):
                    continue

                return candidate

        return None

    def parse_with_llm(self, text: str) -> dict | None:
        """
        Common LLM parsing flow.
        Returns parsed dict or None if LLM unavailable/fails.
        """
        if not self.check_ollama_available():
            logger.warning("Ollama not available")
            return None

        prompt = self._get_prompt(text)
        response_text = self.call_ollama(prompt)

        if not response_text:
            return None

        try:
            json_text = self.extract_json_from_text(response_text)
            parsed_data = json.loads(json_text)
            return self._validate_and_clean(parsed_data)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM response as JSON: {e}")
            return None

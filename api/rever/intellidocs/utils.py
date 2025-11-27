import re
from datetime import datetime
from decimal import Decimal
from typing import Any


def clean_string(value: Any) -> str | None:
    """Remove null bytes and problematic characters from string"""
    if value is None:
        return None
    if not isinstance(value, str):
        return value

    # Remove null bytes
    value = value.replace("\x00", "")

    # Remove other control characters except newlines and tabs
    value = "".join(char for char in value if ord(char) >= 32 or char in "\n\r\t")

    return value.strip() if value else None


def truncate_string(value: Any, max_length: int) -> str | None:
    """Safely truncate string to max_length"""
    if value is None:
        return None
    value_str = str(value)
    if len(value_str) > max_length:
        return value_str[:max_length]
    return value_str


def parse_date(date_str: Any) -> str | None:
    """Parse various date formats to YYYY-MM-DD"""
    if not date_str:
        return None

    # List of date formats to try
    date_formats = [
        "%Y-%m-%d",  # 2025-05-24
        "%B %d, %Y",  # May 24, 2025
        "%b %d, %Y",  # May 24, 2025
        "%m/%d/%Y",  # 05/24/2025
        "%d/%m/%Y",  # 24/05/2025
        "%Y/%m/%d",  # 2025/05/24
        "%m-%d-%Y",  # 05-24-2025
        "%d-%m-%Y",  # 24-05-2025
        "%d %B %Y",  # 24 May 2025
        "%d %b %Y",  # 24 May 2025
        "%b %d %Y",  # Mar 06 2012
        "%B %d %Y",  # March 06 2012
    ]

    for fmt in date_formats:
        try:
            dt = datetime.strptime(str(date_str).strip(), fmt)
            return dt.strftime("%Y-%m-%d")
        except (ValueError, AttributeError):
            continue

    return None


def normalize_payment_terms(term: Any) -> str | None:
    """
    Normalize extracted payment terms to valid DB choices
    """
    if not term:
        return None

    term = str(term).lower().strip()

    # Map common variations to DB values (max 8 chars)
    if "15" in term:
        return "net15"
    elif "30" in term:
        return "net30"
    elif "45" in term:
        return "net45"
    elif "60" in term:
        return "net60"  # If supported, otherwise maybe map to closest or leave null
    elif "due" in term or "receipt" in term or "immediate" in term:
        return "due"

    # Default fallback: if it fits in 8 chars, keep it, otherwise None
    if len(term) <= 8:
        return term

    return None


def clean_decimal(value: Any) -> Decimal:
    """
    Convert value to Decimal, handling various international formats.
    Examples:
    - "1,000.00" -> 1000.00 (US/UK)
    - "1.000,00" -> 1000.00 (EU)
    - "$ 1,234.56" -> 1234.56
    - "1 000,00" -> 1000.00 (Space separator)
    - "(100.00)" -> -100.00 (Negative)
    """
    if value is None:
        return Decimal("0")

    if isinstance(value, int | float | Decimal):
        return Decimal(str(value))

    if isinstance(value, str):
        # Handle negative numbers in parentheses (e.g. "(100.00)")
        if "(" in value and ")" in value:
            value = "-" + value.replace("(", "").replace(")", "")

        # 1. Clean basic noise (currency symbols, letters, spaces)
        # Keep only digits, dots, commas, and minus
        clean_val = re.sub(r"[^\d.,-]", "", value)

        if not clean_val:
            return Decimal("0")

        try:
            # 2. Handle "European" format (1.000,00) vs "US" format (1,000.00)
            if "," in clean_val and "." in clean_val:
                # Both present: The LAST one is the decimal separator
                if clean_val.rfind(",") > clean_val.rfind("."):
                    # EU Format: 1.000,00 -> Remove dots, replace comma with dot
                    clean_val = clean_val.replace(".", "").replace(",", ".")
                else:
                    # US Format: 1,000.00 -> Remove commas
                    clean_val = clean_val.replace(",", "")

            elif "," in clean_val:
                # Only commas: "1,000" (US 1000) or "10,50" (EU 10.50)
                # Heuristic: If comma is followed by exactly 2 digits at the end, assume decimal
                if re.search(r",\d{2}$", clean_val):
                    clean_val = clean_val.replace(",", ".")
                else:
                    # Assume thousands separator
                    clean_val = clean_val.replace(",", "")

            # (If only dots are present, Python's Decimal handles "1000.00" correctly.
            #  "1.000" is ambiguous but usually treated as 1.0 by computers,
            #  unless we add strict logic for 3-digit groups.)

            return Decimal(clean_val)
        except Exception:
            return Decimal("0")

    return Decimal("0")

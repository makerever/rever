import logging
import re

from django.conf import settings
from rapidfuzz import fuzz

from rever.db.models.payable import Vendor

logger = logging.getLogger(__name__)


class VendorMatcher:
    """
    Fuzzy matching service for vendor names using RapidFuzz.
    Simpler and more accurate than semantic embeddings for short vendor names.
    """

    def __init__(self):
        self.default_threshold = getattr(settings, "OCR_VENDOR_MATCHING_THRESHOLD", 70)

    def normalize_vendor_name(self, name: str) -> str:
        """
        Normalize vendor name for comparison.
        Removes suffixes, special characters, and standardizes format.

        Args:
            name: Raw vendor name

        Returns:
            Normalized vendor name
        """
        if not name:
            return ""

        normalized = name.lower().strip()

        # Remove common legal entity suffixes (must come before special char removal)
        suffixes = [
            r"\s+and\s+co\.?$",
            r"\s+&\s+co\.?$",
            r"\s+and\s+company$",
            r"\s+&\s+company$",
            r"\s+inc\.?$",
            r"\s+incorporated$",
            r"\s+corp\.?$",
            r"\s+corporation$",
            r"\s+co\.?$",
            r"\s+company$",
            r"\s+ltd\.?$",
            r"\s+limited$",
            r"\s+llc\.?$",
            r"\s+llp\.?$",
            r"\s+pvt\.?\s+ltd\.?$",
            r"\s+private\s+limited$",
        ]

        for suffix in suffixes:
            normalized = re.sub(suffix, "", normalized, flags=re.IGNORECASE)

        # Remove special characters but keep spaces and alphanumeric
        normalized = re.sub(r"[^\w\s]", " ", normalized)

        normalized = re.sub(r"\s+", " ", normalized)

        return normalized.strip()

    def get_first_word(self, name: str) -> str:
        """
        Get the first significant word from vendor name.
        Used for fast filtering of vendor list.

        Args:
            name: Vendor name (raw or normalized)

        Returns:
            First word in lowercase
        """
        words = self.normalize_vendor_name(name).split()
        return words[0] if words else ""

    def name_contains_all_words(self, vendor_name: str, search_words: set) -> bool:
        """
        Check if all search words are present in vendor name.

        Args:
            vendor_name: Vendor name to check
            search_words: Set of words to find

        Returns:
            True if all words found
        """
        vendor_words = set(self.normalize_vendor_name(vendor_name).split())
        return all(word in vendor_words for word in search_words)

    def calculate_fuzzy_score(self, query: str, target: str) -> float:
        """
        Calculate comprehensive fuzzy matching score.
        Averages multiple fuzzy algorithms for robust matching.

        Args:
            query: Extracted vendor name (normalized)
            target: Database vendor name (normalized)

        Returns:
            Score from 0-100
        """
        return (
            fuzz.ratio(query, target)
            + fuzz.partial_ratio(query, target)
            + fuzz.token_sort_ratio(query, target)
            + fuzz.token_set_ratio(query, target)
        ) / 4.0

    def find_best_match(
        self, extracted_vendor_name: str, organization, threshold: float | None = None
    ) -> tuple[object | None, float, str]:
        """
        Find best matching vendor using fuzzy matching with optimizations.

        Strategy:
        1. Filter by first word (fast)
        2. Check word containment for unique match
        3. Fuzzy score all candidates

        Args:
            extracted_vendor_name: Vendor name from OCR
            organization: Organization instance
            threshold: Minimum score (0-100), defaults to 70

        Returns:
            Tuple of (matched_vendor or None, confidence_score, match_reason)
        """
        if not extracted_vendor_name:
            return None, 0.0, "Empty vendor name"

        if threshold is None:
            threshold = self.default_threshold

        cleaned_query = self.normalize_vendor_name(extracted_vendor_name)
        if not cleaned_query:
            return None, 0.0, "Vendor name normalized to empty string"

        search_words = set(cleaned_query.split())
        query_first_word = self.get_first_word(extracted_vendor_name)

        logger.info(
            f"Matching vendor '{extracted_vendor_name}' "
            f"(Normalized: '{cleaned_query}', First word: '{query_first_word}')"
        )

        vendors = Vendor.objects.filter(organization=organization, is_active=True)

        if not vendors.exists():
            return None, 0.0, "No vendors in organization"

        # Optimization: Filter by first word
        first_word_matches = [
            v for v in vendors if self.get_first_word(v.vendor_name) == query_first_word
        ]

        if not first_word_matches:
            logger.warning(
                f"No vendors found matching first word '{query_first_word}'. "
                f"Falling back to full scan."
            )
            # Fallback: scan all vendors (slower but more thorough)
            # Note: Using list() instead of iterator() to avoid cursor issues in Celery
            first_word_matches = list(vendors)

        # Iterate once over candidates to find best match
        best_score = 0.0
        best_match = None
        unique_match = None
        unique_match_count = 0

        for vendor in first_word_matches:
            # Check for unique match by word containment
            if self.name_contains_all_words(vendor.vendor_name, search_words):
                unique_match = vendor
                unique_match_count += 1

            # Calculate fuzzy score
            cleaned_vendor = self.normalize_vendor_name(vendor.vendor_name)
            score = self.calculate_fuzzy_score(cleaned_query, cleaned_vendor)

            logger.debug(
                f"Fuzzy score: '{cleaned_query}' vs '{cleaned_vendor}' "
                f"({vendor.vendor_name}) = {score:.2f}"
            )

            if score > best_score:
                best_score = score
                best_match = vendor

        if unique_match_count == 1:
            vendor = unique_match
            # Still calculate score for logging
            score = self.calculate_fuzzy_score(
                cleaned_query, self.normalize_vendor_name(vendor.vendor_name)
            )
            logger.info(
                f"✅ Unique vendor found by word containment: '{vendor.vendor_name}' "
                f"(Score: {score:.1f})"
            )
            return vendor, score / 100.0, "Unique word containment match"

        if best_match and best_score >= threshold:
            logger.info(
                f"🔍 Best vendor match: '{best_match.vendor_name}' "
                f"(Score: {best_score:.1f}/{threshold})"
            )
            return best_match, best_score / 100.0, f"Fuzzy match (score: {best_score:.1f})"

        if best_match:
            logger.info(
                f"❌ No match: Best '{best_match.vendor_name}' below threshold "
                f"({best_score:.1f} < {threshold})"
            )
            return None, best_score / 100.0, f"Below threshold ({best_score:.1f} < {threshold})"

        return None, 0.0, "No candidates found"

    def find_vendor(
        self, extracted_vendor_data: dict, organization, similarity_threshold: float | None = None
    ) -> tuple[object | None, float, str]:
        """
        Find existing vendor based on fuzzy matching.
        Does NOT create new vendors.

        Args:
            extracted_vendor_data: Dict with vendor info (name, address, tax_id, etc.)
            organization: Organization instance
            similarity_threshold: Minimum similarity score for matching (0-100)

        Returns:
            Tuple of (vendor, confidence_score, match_reason)
        """
        vendor_name = extracted_vendor_data.get("name")

        if not vendor_name:
            return None, 0.0, "No vendor name provided"

        matched_vendor, confidence, match_reason = self.find_best_match(
            vendor_name, organization, similarity_threshold
        )

        if matched_vendor:
            logger.info(
                f"Matched vendor '{vendor_name}' to existing '{matched_vendor.vendor_name}' "
                f"({match_reason})"
            )
            return matched_vendor, confidence, match_reason

        logger.warning(f"No vendor match found for '{vendor_name}': {match_reason}. ")
        return None, confidence, f"No match found: {match_reason}"

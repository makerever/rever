import uuid
from decimal import Decimal
from pathlib import Path
from unittest.mock import patch

from django.test import TestCase
from django.utils import timezone

from rever.db.models.payable import Bill, BillItem, Organization, PurchaseOrder, Vendor
from rever.intellidocs.models import BillExtraction
from rever.intellidocs.parsers.bill_parser import BillParser
from rever.intellidocs.services.vendor_matcher import VendorMatcher
from rever.intellidocs.tasks import process_bill_ocr_task


class BillOCRTaskTest(TestCase):
    """
    Integration tests for the Bill OCR Task.
    Tests the full flow from task execution to DB record creation.
    """

    def setUp(self):
        self.organization = Organization.objects.create(name="Test Org")
        self.vendor = Vendor.objects.create(
            organization=self.organization, vendor_name="Xolo", email="contact@xolo.com"
        )
        self.po = PurchaseOrder.objects.create(
            organization=self.organization,
            po_number="PO-12345",
            vendor=self.vendor,
            total=Decimal("1000.00"),
            sub_total=Decimal("1000.00"),
            po_date=timezone.now().date(),
            delivery_date=timezone.now().date(),
            status="approved",
        )

        # Create a dummy file for testing
        # Create a dummy file for testing
        self.test_file_path = Path("test_bill.pdf")
        with self.test_file_path.open("wb") as f:
            f.write(b"dummy pdf content")

    def tearDown(self):
        if self.test_file_path.exists():
            self.test_file_path.unlink()

    @patch("rever.intellidocs.tasks.OCRService")
    @patch("rever.intellidocs.tasks.BillParser")
    @patch("rever.intellidocs.tasks.VendorMatcher")
    def test_1_basic_bill_happy_path(
        self, mock_vendor_matcher, mock_bill_parser, mock_ocr_service
    ):
        """Test 1: Basic Bill - Standard layout, clear fields, exact vendor match"""
        print("\n--- Test 1: Basic Bill Happy Path ---")

        # Mock OCR
        mock_ocr_instance = mock_ocr_service.return_value
        mock_ocr_instance.process_document.return_value = {
            "text": "Invoice INV-001 from Xolo",
            "engine": "test",
        }

        # Mock Parser
        mock_parser_instance = mock_bill_parser.return_value
        mock_parser_instance.parse.return_value = {
            "bill_number": "INV-001",
            "bill_date": "2025-01-01",
            "due_date": "2025-01-31",
            "vendor": {"name": "Xolo"},
            "amounts": {"subtotal": "100.00", "tax": "10.00", "total": "110.00"},
            "line_items": [
                {
                    "description": "Service A",
                    "quantity": "1",
                    "unit_price": "100.00",
                    "amount": "100.00",
                }
            ],
        }

        # Mock Vendor Matcher
        mock_matcher_instance = mock_vendor_matcher.return_value
        mock_matcher_instance.find_vendor.return_value = (self.vendor, 1.0, "Exact match")

        # Run Task
        result = process_bill_ocr_task(
            file_path=self.test_file_path,
            file_name="invoice.pdf",
            organization_id=self.organization.id,
            task_id=str(uuid.uuid4()),
        )

        # Verify
        assert result["status"] == "success"
        assert result["bill_number"] == "INV-001"
        assert result["vendor"] == "Xolo"

        # Check DB
        bill = Bill.objects.get(bill_number="INV-001")
        assert bill.vendor == self.vendor
        assert bill.total == Decimal("110.00")
        assert bill.items.count() == 1

        # Check Extraction
        extraction = BillExtraction.objects.get(bill=bill)
        assert extraction.bill_number == "INV-001"
        assert extraction.total_amount == Decimal("110.00")

    @patch("rever.intellidocs.tasks.OCRService")
    @patch("rever.intellidocs.tasks.BillParser")
    @patch("rever.intellidocs.tasks.VendorMatcher")
    def test_2_complex_bill_po_linking(
        self, mock_vendor_matcher, mock_bill_parser, mock_ocr_service
    ):
        """Test 2: Complex Bill - PO Linking"""
        print("\n--- Test 2: PO Linking ---")

        # Mock OCR/Parser
        mock_ocr_service.return_value.process_document.return_value = {
            "text": "Invoice with PO",
            "engine": "test",
        }
        mock_bill_parser.return_value.parse.return_value = {
            "bill_number": "INV-PO-001",
            "purchase_order": "PO-12345",  # Matches self.po
            "vendor": {"name": "Unknown Vendor"},  # Should be ignored in favor of PO vendor
            "amounts": {"total": "1000.00"},
        }

        # Mock Vendor Matcher (Should not be used if PO matched, or used as fallback)
        mock_vendor_matcher.return_value.find_vendor.return_value = (None, 0.0, "No match")

        process_bill_ocr_task(
            file_path=self.test_file_path,
            file_name="invoice_po.pdf",
            organization_id=self.organization.id,
            task_id=str(uuid.uuid4()),
        )

        bill = Bill.objects.get(bill_number="INV-PO-001")
        assert bill.purchase_order == self.po
        assert bill.vendor == self.vendor  # Should take vendor from PO

        extraction = BillExtraction.objects.get(bill=bill)
        assert extraction.po_number == "PO-12345"

    @patch("rever.intellidocs.tasks.OCRService")
    @patch("rever.intellidocs.tasks.BillParser")
    @patch("rever.intellidocs.tasks.VendorMatcher")
    def test_3_complex_bill_vendor_substring(
        self, mock_vendor_matcher, mock_bill_parser, mock_ocr_service
    ):
        """Test 3: Complex Bill - Vendor Substring Match"""
        print("\n--- Test 3: Vendor Substring Match ---")

        mock_ocr_service.return_value.process_document.return_value = {
            "text": "Invoice from XOLO India",
            "engine": "test",
        }
        mock_bill_parser.return_value.parse.return_value = {
            "bill_number": "INV-SUB-001",
            "vendor": {"name": "XOLO India"},  # Should match "Xolo"
            "amounts": {"total": "500.00"},
        }

        mock_vendor_matcher.return_value.find_vendor.return_value = (
            self.vendor,
            0.95,
            "Substring match",
        )

        process_bill_ocr_task(
            file_path=self.test_file_path,
            file_name="invoice_sub.pdf",
            organization_id=self.organization.id,
            task_id=str(uuid.uuid4()),
        )

        bill = Bill.objects.get(bill_number="INV-SUB-001")
        assert bill.vendor == self.vendor

    @patch("rever.intellidocs.tasks.OCRService")
    @patch("rever.intellidocs.tasks.BillParser")
    @patch("rever.intellidocs.tasks.VendorMatcher")
    def test_4_data_normalization(self, mock_vendor_matcher, mock_bill_parser, mock_ocr_service):
        """Test 4: Data Normalization (Payment Terms, Currency)"""
        print("\n--- Test 4: Data Normalization ---")

        mock_ocr_service.return_value.process_document.return_value = {
            "text": "Dirty Data Invoice",
            "engine": "test",
        }
        mock_bill_parser.return_value.parse.return_value = {
            "bill_number": "INV-NORM-001",
            "payment_terms": "Due on Receipt",  # Should normalize to 'due'
            "amounts": {
                "subtotal": "$1,000.00",
                "tax": "10%",  # Should handle %
                "total": "1,100.00",
                "tax_percentage": "10%",
            },
            "line_items": [
                {
                    "description": "Item 1",
                    "quantity": "10",
                    "unit_price": "$100.00",
                    "amount": "$1,000.00",
                }
            ],
        }
        mock_vendor_matcher.return_value.find_vendor.return_value = (self.vendor, 1.0, "Match")

        process_bill_ocr_task(
            file_path=self.test_file_path,
            file_name="invoice_norm.pdf",
            organization_id=self.organization.id,
            task_id=str(uuid.uuid4()),
        )

        bill = Bill.objects.get(bill_number="INV-NORM-001")
        assert bill.payment_terms == "due"
        assert bill.sub_total == Decimal("1000.00")
        assert bill.total == Decimal("1100.00")
        assert bill.tax_percentage == Decimal("10")  # 10% -> 10

        item = BillItem.objects.get(bill=bill)
        assert item.unit_price == Decimal("100.00")
        assert item.amount == Decimal("1000.00")

    @patch("rever.intellidocs.tasks.OCRService")
    @patch("rever.intellidocs.tasks.BillParser")
    @patch("rever.intellidocs.tasks.VendorMatcher")
    def test_5_edge_cases(self, mock_vendor_matcher, mock_bill_parser, mock_ocr_service):
        """Test 5: Edge Cases (Missing Data)"""
        print("\n--- Test 5: Edge Cases ---")

        mock_ocr_service.return_value.process_document.return_value = {
            "text": "Empty Invoice",
            "engine": "test",
        }
        mock_bill_parser.return_value.parse.return_value = {
            "bill_number": None,  # Should auto-generate
            "amounts": {},  # Missing amounts
            "vendor": {},  # Missing vendor
            "line_items": [],
        }
        mock_vendor_matcher.return_value.find_vendor.return_value = (None, 0.0, "No match")

        result = process_bill_ocr_task(
            file_path=self.test_file_path,
            file_name="invoice_edge.pdf",
            organization_id=self.organization.id,
            task_id=str(uuid.uuid4()),
        )

        assert result["status"] == "success"
        # Since bill_number is auto-generated, we check if a bill was created
        # We can't easily query by ID since we don't know it, but we can check count
        # or last created
        # Given setUp runs per test, we can check for bills created in this test method
        # But transaction rollback might make it tricky if we rely on global state.
        # However, we know we created one bill in this test.
        # Let's check if any bill exists that wasn't there before?
        # Actually, setUp creates objects, but no bills.
        bill = Bill.objects.filter(bill_number__startswith="BILL-").last()

        assert bill is not None
        assert bill.bill_number.startswith("BILL-")
        assert bill.total == Decimal("0")
        assert bill.vendor is None

        assert bill.vendor is None

    @patch("rever.intellidocs.tasks.OCRService")
    @patch("rever.intellidocs.tasks.BillParser")
    @patch("rever.intellidocs.tasks.VendorMatcher")
    def test_6_invalid_line_number(self, mock_vendor_matcher, mock_bill_parser, mock_ocr_service):
        """Test 6: Invalid Line Number (e.g. 'a')"""
        print("\n--- Test 6: Invalid Line Number ---")

        mock_ocr_service.return_value.process_document.return_value = {
            "text": "Invoice with bad line num",
            "engine": "test",
        }
        mock_bill_parser.return_value.parse.return_value = {
            "bill_number": "INV-BAD-LINE",
            "amounts": {"total": "100.00"},
            "line_items": [
                {
                    "description": "Item A",
                    "quantity": "1",
                    "unit_price": "100.00",
                    "amount": "100.00",
                    "line_number": "a",  # Invalid integer
                }
            ],
        }
        mock_vendor_matcher.return_value.find_vendor.return_value = (self.vendor, 1.0, "Match")

        result = process_bill_ocr_task(
            file_path=self.test_file_path,
            file_name="invoice_bad_line.pdf",
            organization_id=self.organization.id,
            task_id=str(uuid.uuid4()),
        )

        assert result["status"] == "success"

        bill = Bill.objects.get(bill_number="INV-BAD-LINE")
        assert bill.items.count() == 1
        item = bill.items.first()
        assert item.line_number == 1  # Should fallback to index (1)


class VendorMatcherTest(TestCase):
    """
    Unit tests for VendorMatcher using RapidFuzz.
    Tests all matching strategies and edge cases.
    """

    def setUp(self):
        """Create test organization and vendors"""
        self.organization = Organization.objects.create(name="Test Org")

        # Create test vendors with various name formats
        self.vendors = {
            "xolo": Vendor.objects.create(organization=self.organization, vendor_name="Xolo"),
            "xolo_india": Vendor.objects.create(
                organization=self.organization, vendor_name="XOLO India"
            ),
            "js_sundaram": Vendor.objects.create(
                organization=self.organization, vendor_name="J S Sundaram"
            ),
            "google": Vendor.objects.create(organization=self.organization, vendor_name="Google"),
            "google_india": Vendor.objects.create(
                organization=self.organization, vendor_name="Google India"
            ),
            "oracle": Vendor.objects.create(organization=self.organization, vendor_name="Oracle"),
        }

        self.matcher = VendorMatcher()

    def test_normalize_vendor_name(self):
        """Test vendor name normalization"""
        print("\n--- Test: Normalize Vendor Name ---")

        test_cases = [
            ("J S Sundaram and Co", "j s sundaram"),
            ("XOLO India Inc.", "xolo india"),
            ("Google LLC", "google"),
            ("Oracle Corporation", "oracle"),
            ("ABC & Company", "abc"),
            ("Test Corp.", "test"),
        ]

        for input_name, expected in test_cases:
            result = self.matcher.normalize_vendor_name(input_name)
            print(f"  '{input_name}' -> '{result}' (expected: '{expected}')")
            assert result == expected

    def test_exact_match_after_normalization(self):
        """Test: J S Sundaram and Co -> J S Sundaram"""
        print("\n--- Test: Exact Match After Normalization ---")

        vendor, score, reason = self.matcher.find_best_match(
            "J S Sundaram and Co", self.organization
        )

        print(f"  Matched: {vendor.vendor_name if vendor else 'None'}")
        print(f"  Score: {score:.2f}")
        print(f"  Reason: {reason}")

        assert vendor is not None
        assert vendor.vendor_name == "J S Sundaram"
        assert score * 100 >= 70  # Above threshold

    def test_substring_match(self):
        """Test: XOLO India vs Xolo"""
        print("\n--- Test: Substring Match ---")

        vendor, score, reason = self.matcher.find_best_match("XOLO India", self.organization)

        print(f"  Matched: {vendor.vendor_name if vendor else 'None'}")
        print(f"  Score: {score:.2f}")
        print(f"  Reason: {reason}")

        assert vendor is not None
        # Could match either "Xolo" or "XOLO India" - both are valid
        assert vendor.vendor_name in ["Xolo", "XOLO India"]
        assert score * 100 >= 70

    def test_typo_handling(self):
        """Test: Gogle (typo) -> Google"""
        print("\n--- Test: Typo Handling ---")

        vendor, score, reason = self.matcher.find_best_match(
            "Gogle",  # Missing 'o'
            self.organization,
        )

        print(f"  Matched: {vendor.vendor_name if vendor else 'None'}")
        print(f"  Score: {score:.2f}")
        print(f"  Reason: {reason}")

        assert vendor is not None
        assert vendor.vendor_name == "Google"

    def test_no_match_below_threshold(self):
        """Test: Completely different name"""
        print("\n--- Test: No Match Below Threshold ---")

        vendor, score, reason = self.matcher.find_best_match(
            "Microsoft",  # Doesn't exist
            self.organization,
        )

        print(f"  Matched: {vendor.vendor_name if vendor else 'None'}")
        print(f"  Score: {score:.2f}")
        print(f"  Reason: {reason}")

        assert vendor is None
        assert score * 100 < 70

    def test_empty_vendor_name(self):
        """Test: Empty vendor name"""
        print("\n--- Test: Empty Vendor Name ---")

        vendor, _score, reason = self.matcher.find_best_match("", self.organization)

        print(f"  Matched: {vendor.vendor_name if vendor else 'None'}")
        print(f"  Reason: {reason}")

        assert vendor is None
        assert reason == "Empty vendor name"

    def test_first_word_optimization(self):
        """Test: First word filtering works"""
        print("\n--- Test: First Word Filtering ---")

        # Should match Google, not Oracle (different first word)
        vendor, _score, _reason = self.matcher.find_best_match("Google LLC", self.organization)

        print(f"  Matched: {vendor.vendor_name if vendor else 'None'}")
        assert vendor is not None
        assert "Google" in vendor.vendor_name

    def test_find_vendor_match(self):
        """Test: find_vendor finds existing vendor"""
        # Use an existing vendor name for the test
        data = {"name": "J S Sundaram and Co"}

        # Should find existing vendor
        vendor, confidence, _reason = self.matcher.find_vendor(
            extracted_vendor_data=data, organization=self.organization
        )

        assert vendor is not None
        assert vendor.id == self.vendors["js_sundaram"].id  # Assuming 'J S Sundaram' is the target
        assert confidence > 0.9

    def test_find_vendor_no_match(self):
        """Test: find_vendor with no match"""
        data = {"name": "Brand New Vendor"}  # A vendor that does not exist

        # Should not find a vendor
        vendor, confidence, reason = self.matcher.find_vendor(
            extracted_vendor_data=data, organization=self.organization
        )

        assert vendor is None
        assert confidence < 0.7  # Should be below threshold
        assert "No match found" in reason  # Or similar reason from find_vendor

    def test_multiple_similar_vendors(self):
        """Test: Multiple Google vendors - picks best match"""
        print("\n--- Test: Multiple Similar Vendors ---")

        vendor, score, _reason = self.matcher.find_best_match("Google Inc", self.organization)

        print(f"  Matched: {vendor.vendor_name if vendor else 'None'}")
        print(f"  Score: {score:.2f}")

        assert vendor is not None
        # Should match one of the Google vendors
        assert "Google" in vendor.vendor_name


class BillParserTest(TestCase):
    """
    Unit tests for BillParser.
    Tests extraction logic for various bill formats.
    """

    def setUp(self):
        self.parser = BillParser()
        self.sample_text = """
        NARS Group LLC. INVOICE
        3720 Sidney Lane,
        Flower Mound, TX 75022
        # 61124
        Date: Jun 11, 2024
        Bill To:
        Payment Terms: 45
        Techouts
        13800 Coppermine Road, Suite 281, Due Date: Jul 26, 2024
        Herndon, VA 20171
        Balance Due: $11,040.00
        Item Quantity Rate Amount
        Consulting services provided by Amit Sharma 184 $60.00 $11,040.00
        Subtotal: $11,040.00
        Tax (0%): $0.00
        Total: $11,040.00
        Terms:
        Please remit payment to:
        Electronically:
        A/c number: 36118610983
        Routing number: 031176110
        By check: 3 Grace Court, Plainsboro, NJ 08536
        """

    def test_fallback_parse(self):
        """Test fallback parsing logic without LLM"""
        print("\n--- Test: Bill Parser Fallback ---")

        result = self.parser._fallback_parse(self.sample_text)

        # Verify basic fields
        assert result.get("bill_number") == "61124"
        assert result.get("payment_terms") == "net45"

        # Verify amounts
        amounts = result.get("amounts", {})
        assert amounts.get("total") == "11040.00"
        assert amounts.get("subtotal") == "11040.00"

        # Verify line items
        line_items = result.get("line_items", [])
        assert len(line_items) > 0
        item = line_items[0]
        assert "Consulting services" in item.get("description")
        assert item.get("quantity") == "184"
        assert item.get("unit_price") == "60.00"
        assert item.get("amount") == "11040.00"

    def test_bill_number_formats(self):
        """Test various bill number formats"""
        print("\n--- Test: Bill Number Formats ---")

        cases = [
            ("Invoice # 12345", "12345"),
            ("Invoice No: INV-999", "INV-999"),
            ("Bill Number: B-100", "B-100"),
            ("Invoice: 55555", "55555"),
            ("InvoiceNumber 187042", "187042"),  # From repro case
        ]

        for text, expected in cases:
            # Create a minimal context where this appears
            context = f"Header\n{text}\nDate: 2024-01-01"
            result = self.parser._extract_bill_number(context.lower(), context)
            print(f"  '{text}' -> '{result}' (expected: '{expected}')")
            assert result == expected

    def test_currency_truncation(self):
        """Test that currency strings longer than 10 chars are truncated"""
        data = {
            "currency": "United States Dollar",
            "line_items": [],
            "vendor": {},
            "customer": {},
        }
        cleaned = self.parser._validate_and_clean(data)
        assert cleaned["currency"] == "United Sta"
        assert len(cleaned["currency"]) == 10

    def test_complex_line_items(self):
        """Test complex line item formats (Discount, Tax, Decimals)"""
        print("\n--- Test: Complex Line Items ---")

        # Case 1: With Discount and Tax columns (like repro case)
        text_complex = """
        Description | Quantity | Unit Price | Discount | Tax | Amount
        Item A | 23.00 | 100.00 | 0.00 | 0.00 | 2300.00
        Item B | 1.5 | 50.00 | 5.00 | 2.50 | 72.50
        """
        items = self.parser._extract_line_items(text_complex)
        assert len(items) == 2

        # Item A
        assert items[0]["quantity"] == "23.00"
        assert items[0]["unit_price"] == "100.00"
        assert items[0]["amount"] == "2300.00"

        # Item B
        assert items[1]["quantity"] == "1.5"
        assert items[1]["unit_price"] == "50.00"
        # Note: logic might not extract discount/tax into separate fields yet,
        # but should get amount right
        assert items[1]["amount"] == "72.50"

    def test_date_formats(self):
        """Test various date formats"""
        print("\n--- Test: Date Formats ---")

        cases = [
            ("Date: 2024-01-31", "2024-01-31"),
            ("Invoice Date: Jan 31, 2024", "Jan 31, 2024"),
            ("Date: 01/31/2024", "01/31/2024"),
            ("Issue Date: 31-Jan-2024", "31-Jan-2024"),
        ]

        for text, expected in cases:
            result = self.parser._extract_date(text, "bill")
            print(f"  '{text}' -> '{result}'")
            # Note: The parser extracts the string, normalization happens in task
            assert expected in (result if result else "")

import uuid
from decimal import Decimal
from pathlib import Path
from unittest.mock import patch

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from rever.db.models.payable import Bill, BillItem, Organization, PurchaseOrder, Vendor
from rever.intellidocs.models import DocumentExtraction
from rever.intellidocs.parsers.bill_parser import BillParser
from rever.intellidocs.services.vendor_matcher import VendorMatcher
from rever.intellidocs.tasks import process_document_ocr_task


class DocumentOCRTaskTest(TestCase):
    """
    Integration tests for the Document OCR Task.
    Tests the full flow from task execution to DB record creation for Bills and POs.
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

        self.test_file_path = Path("test_doc.pdf")
        with self.test_file_path.open("wb") as f:
            f.write(b"dummy pdf content")

    def tearDown(self):
        if self.test_file_path.exists():
            self.test_file_path.unlink()

    @patch("rever.intellidocs.tasks.OCRService")
    @patch("rever.intellidocs.tasks.DocumentParserFactory")
    @patch("rever.intellidocs.tasks.VendorMatcher")
    def test_1_basic_bill_happy_path(
        self, mock_vendor_matcher, mock_factory, mock_ocr_service
    ):
        """Test 1: Basic Bill - Standard layout, clear fields, exact vendor match"""
        print("\n--- Test 1: Basic Bill Happy Path ---")

        # Mock OCR
        mock_ocr_instance = mock_ocr_service.return_value
        mock_ocr_instance.process_document.return_value = {
            "text": "Invoice INV-001 from Xolo",
            "engine": "test",
        }

        # Mock Parser Factory
        mock_parser = mock_factory.get_parser.return_value
        mock_parser.parse.return_value = {
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
        result = process_document_ocr_task(
            file_path=self.test_file_path,
            file_name="invoice.pdf",
            organization_id=self.organization.id,
            task_id=str(uuid.uuid4()),
            document_type="bill",
        )

        # Verify
        assert result["status"] == "success"
        assert result["document_number"] == "INV-001"

        # Check DB
        bill = Bill.objects.get(bill_number="INV-001")
        assert bill.vendor == self.vendor
        assert bill.total == Decimal("110.00")
        assert bill.items.count() == 1

        # Check Extraction
        extraction = DocumentExtraction.objects.get(bill=bill)
        assert extraction.bill_number == "INV-001"
        assert extraction.total_amount == Decimal("110.00")

    @patch("rever.intellidocs.tasks.OCRService")
    @patch("rever.intellidocs.tasks.DocumentParserFactory")
    @patch("rever.intellidocs.tasks.VendorMatcher")
    def test_po_processing(self, mock_vendor_matcher, mock_factory, mock_ocr_service):
        """Test PO Processing"""
        print("\n--- Test: PO Processing ---")

        # Mock OCR
        mock_ocr_service.return_value.process_document.return_value = {
            "text": "Purchase Order PO-NEW-001",
            "engine": "test",
        }

        # Mock Parser
        mock_parser = mock_factory.get_parser.return_value
        mock_parser.parse.return_value = {
            "po_number": "PO-NEW-001",
            "po_date": "2025-02-01",
            "delivery_date": "2025-02-15",
            "vendor": {"name": "Xolo"},
            "amounts": {"total": "500.00"},
            "line_items": [
                {
                    "description": "Item 1",
                    "quantity": "5",
                    "unit_price": "100.00",
                    "amount": "500.00",
                    "line_number": "1",
                }
            ],
        }

        # Mock Matcher
        mock_vendor_matcher.return_value.find_vendor.return_value = (self.vendor, 1.0, "Match")

        # Run Task
        result = process_document_ocr_task(
            file_path=self.test_file_path,
            file_name="po.pdf",
            organization_id=self.organization.id,
            task_id=str(uuid.uuid4()),
            document_type="purchase_order",
        )

        assert result["status"] == "success"
        assert result["document_number"] == "PO-NEW-001"

        # Check DB
        po = PurchaseOrder.objects.get(po_number="PO-NEW-001")
        assert po.vendor == self.vendor
        assert po.total == Decimal("500.00")
        assert po.items.count() == 1
        
        item = po.items.first()
        assert item.line_number == 1
        assert item.quantity == Decimal("5")

        # Check Extraction
        extraction = DocumentExtraction.objects.get(purchase_order=po)
        assert extraction.po_number == "PO-NEW-001"

    @patch("rever.intellidocs.tasks.OCRService")
    @patch("rever.intellidocs.tasks.DocumentParserFactory")
    @patch("rever.intellidocs.tasks.VendorMatcher")
    def test_2_complex_bill_po_linking(
        self, mock_vendor_matcher, mock_factory, mock_ocr_service
    ):
        """Test 2: Complex Bill - PO Linking"""
        print("\n--- Test 2: PO Linking ---")

        # Mock OCR/Parser
        mock_ocr_service.return_value.process_document.return_value = {
            "text": "Invoice with PO",
            "engine": "test",
        }
        mock_factory.get_parser.return_value.parse.return_value = {
            "bill_number": "INV-PO-001",
            "purchase_order": "PO-12345",  # Matches self.po
            "vendor": {"name": "Unknown Vendor"},  # Should be ignored in favor of PO vendor
            "amounts": {"total": "1000.00"},
        }

        # Mock Vendor Matcher (Should not be used if PO matched, or used as fallback)
        mock_vendor_matcher.return_value.find_vendor.return_value = (None, 0.0, "No match")

        process_document_ocr_task(
            file_path=self.test_file_path,
            file_name="invoice_po.pdf",
            organization_id=self.organization.id,
            task_id=str(uuid.uuid4()),
        )

        bill = Bill.objects.get(bill_number="INV-PO-001")
        assert bill.purchase_order == self.po
        assert bill.vendor == self.vendor  # Should take vendor from PO

        extraction = DocumentExtraction.objects.get(bill=bill)
        assert extraction.po_number == "PO-12345"

    @patch("rever.intellidocs.tasks.OCRService")
    @patch("rever.intellidocs.tasks.DocumentParserFactory")
    @patch("rever.intellidocs.tasks.VendorMatcher")
    def test_3_complex_bill_vendor_substring(
        self, mock_vendor_matcher, mock_factory, mock_ocr_service
    ):
        """Test 3: Complex Bill - Vendor Substring Match"""
        print("\n--- Test 3: Vendor Substring Match ---")

        mock_ocr_service.return_value.process_document.return_value = {
            "text": "Invoice from XOLO India",
            "engine": "test",
        }
        mock_factory.get_parser.return_value.parse.return_value = {
            "bill_number": "INV-SUB-001",
            "vendor": {"name": "XOLO India"},  # Should match "Xolo"
            "amounts": {"total": "500.00"},
        }

        mock_vendor_matcher.return_value.find_vendor.return_value = (
            self.vendor,
            0.95,
            "Substring match",
        )

        process_document_ocr_task(
            file_path=self.test_file_path,
            file_name="invoice_sub.pdf",
            organization_id=self.organization.id,
            task_id=str(uuid.uuid4()),
        )

        bill = Bill.objects.get(bill_number="INV-SUB-001")
        assert bill.vendor == self.vendor

    @patch("rever.intellidocs.tasks.OCRService")
    @patch("rever.intellidocs.tasks.DocumentParserFactory")
    @patch("rever.intellidocs.tasks.VendorMatcher")
    def test_4_data_normalization(self, mock_vendor_matcher, mock_factory, mock_ocr_service):
        """Test 4: Data Normalization (Payment Terms, Currency)"""
        print("\n--- Test 4: Data Normalization ---")

        mock_ocr_service.return_value.process_document.return_value = {
            "text": "Dirty Data Invoice",
            "engine": "test",
        }
        mock_factory.get_parser.return_value.parse.return_value = {
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

        process_document_ocr_task(
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
    @patch("rever.intellidocs.tasks.DocumentParserFactory")
    @patch("rever.intellidocs.tasks.VendorMatcher")
    def test_5_edge_cases(self, mock_vendor_matcher, mock_factory, mock_ocr_service):
        """Test 5: Edge Cases (Missing Data)"""
        print("\n--- Test 5: Edge Cases ---")

        mock_ocr_service.return_value.process_document.return_value = {
            "text": "Empty Invoice",
            "engine": "test",
        }
        mock_factory.get_parser.return_value.parse.return_value = {
            "bill_number": None,  # Should auto-generate
            "amounts": {},  # Missing amounts
            "vendor": {},  # Missing vendor
            "line_items": [],
        }
        mock_vendor_matcher.return_value.find_vendor.return_value = (None, 0.0, "No match")

        result = process_document_ocr_task(
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
    @patch("rever.intellidocs.tasks.DocumentParserFactory")
    @patch("rever.intellidocs.tasks.VendorMatcher")
    def test_6_invalid_line_number(self, mock_vendor_matcher, mock_factory, mock_ocr_service):
        """Test 6: Invalid Line Number (e.g. 'a')"""
        print("\n--- Test 6: Invalid Line Number ---")

        mock_ocr_service.return_value.process_document.return_value = {
            "text": "Invoice with bad line num",
            "engine": "test",
        }
        mock_factory.get_parser.return_value.parse.return_value = {
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

        result = process_document_ocr_task(
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

    @patch("rever.intellidocs.tasks.OCRService")
    @patch("rever.intellidocs.tasks.DocumentParserFactory")
    @patch("rever.intellidocs.tasks.VendorMatcher")
    def test_7_duplicate_po_check(self, mock_vendor_matcher, mock_factory, mock_ocr_service):
        """Test 7: Duplicate PO Check - Should assume existing PO"""
        print("\n--- Test 7: Duplicate PO Parsing ---")

        # 1. Existing PO is self.po (PO-12345)
        # Mock OCR to return this number
        mock_ocr_service.return_value.process_document.return_value = {
            "text": "Purchase Order PO-12345",
            "engine": "test",
        }
        mock_factory.get_parser.return_value.parse.return_value = {
            "po_number": "PO-12345",
            "amounts": {"total": "1000.00"},
            "vendor": {"name": "Xolo"},
        }
        mock_vendor_matcher.return_value.find_vendor.return_value = (self.vendor, 1.0, "Match")

        # Run Task
        result = process_document_ocr_task(
            file_path=self.test_file_path,
            file_name="duplicate_po.pdf",
            organization_id=self.organization.id,
            task_id=str(uuid.uuid4()),
            document_type="purchase_order",
        )

        assert result["status"] == "success"
        
        # Check that we got the EXISTING PO ID, not a new one
        assert result["document_id"] == str(self.po.id)
        
        # Verify no new PO was created
        assert PurchaseOrder.objects.count() == 1

    @patch("rever.intellidocs.tasks.OCRService")
    @patch("rever.intellidocs.tasks.DocumentParserFactory")
    @patch("rever.intellidocs.tasks.VendorMatcher")
    def test_8_ollama_failure_fallback(self, mock_vendor_matcher, mock_factory, mock_ocr_service):
        """Test 8: Ollama Service Failure Fallback"""
        print("\n--- Test 8: Ollama Failure Fallback ---")

        mock_ocr_service.return_value.process_document.return_value = {
            "text": "Invoice # 99999",
            "engine": "test",
        }
        
        # Mock Factory to return a REAL parser, with mocks inside it?
        # If parse() fails, we call _fallback_parse
        # BaseParser.parse is abstract - testing TASK exception handling
        # The task calls parser.parse(text)
        
        # Scenario: parse() raises Exception or returns incomplete data? 
        # BaseParser implementations handle LLM errors internally
        # If connection fails, parse_with_llm returns None, parse() may fallback
        
        # Let's mock parser.parse to raise an Exception to simulate total failure
        mock_parser = mock_factory.get_parser.return_value
        mock_parser.parse.side_effect = Exception("Ollama connection failed")
        
        # AND mock _fallback_parse to succeed (simulating task catching exception)
        # Wait, does the TASK catch generic exceptions?
        # Checking tasks.py:
        # try: parsed_data = parser.parse(text) ... except Exception as e: ...
        
        mock_parser._fallback_parse.return_value = {
            "bill_number": "99999",
            "total": None
        }

        # Run Task
        result = process_document_ocr_task(
            file_path=self.test_file_path,
            file_name="invoice_fail.pdf",
            organization_id=self.organization.id,
            task_id=str(uuid.uuid4()),
            document_type="bill",
        )

        # Expected behavior: Task catches exception, logs it, and marks as FAILED?
        # OR does it attempt fallback?
        # Currently tasks.py: catch Exception -> status=FAILED, error_message=str(e)
        
        assert result["status"] == "failed"
        assert "Ollama connection failed" in result.get("error", "")

        # Verify OCR Log records failure
        log = DocumentExtraction.objects.filter(file_name="invoice_fail.pdf").first()
        assert log.status == "failed"
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
        # 61124
        Date: Jun 11, 2024
        """

    def test_fallback_parse(self):
        """Test fallback parsing logic without LLM"""
        print("\n--- Test: Bill Parser Fallback ---")

        result = self.parser._fallback_parse(self.sample_text)

        # Verify only bill_number is extracted in minimal fallback
        assert result.get("bill_number") == "61124"
        assert result.get("total") is None
        # Fallback no longer extracts line items or other fields
        assert "line_items" not in result

    def test_bill_number_formats(self):
        """Test various bill number formats"""
        print("\n--- Test: Bill Number Formats ---")

        cases = [
            ("Invoice # 12345", "12345"),
            ("Invoice No: INV-999", "INV-999"),
            ("Bill Number: B-100", "B-100"),
            ("Invoice: 55555", "55555"),
            ("InvoiceNumber 187042", "187042"),
        ]

        for text, expected in cases:
            # Create a minimal context where this appears
            context = f"Header\n{text}\nDate: 2024-01-01"
            result = self.parser._extract_bill_number(context.lower(), context)
            print(f"  '{text}' -> '{result}' (expected: '{expected}')")
            assert result == expected

    def test_currency_truncation(self):
        """Test that currency strings longer than 10 chars are truncated during validation"""
        data = {
            "currency": "United States Dollar",
            "line_items": [],
            "vendor": {},
            "customer": {},
        }
        cleaned = self.parser._validate_and_clean(data)
        assert cleaned["currency"] == "United Sta"
        assert len(cleaned["currency"]) == 10

class PurchaseOrderParserTest(TestCase):
    """
    Unit tests for PurchaseOrderParser.
    """
    
    def setUp(self):
        from rever.intellidocs.parsers.purchase_order_parser import PurchaseOrderParser
        self.parser = PurchaseOrderParser()

    def test_po_number_formats(self):
        """Test various PO number formats"""
        print("\n--- Test: PO Number Formats ---")
        
        cases = [
            ("PO # 12345", "12345"),
            ("Purchase Order: PO-999", "PO-999"),
            ("PO Number: P-100", "P-100"),
            ("Order # 55555", "55555"),
        ]
        
        for text, expected in cases:
            context = f"Header\n{text}\nDate: 2024-01-01"
            result = self.parser._extract_po_number(context)
            assert result == expected

class DocumentAPIURLTest(TestCase):
    """
    Test URL configuration for Intellidocs API.
    Verifies that named routes resolve to the correct paths.
    """

    def test_bill_ocr_upload_url(self):
        url = reverse("document-ocr-upload")
        assert url == "/api/intellidocs/upload/"

    def test_bill_ocr_status_url(self):
        task_id = uuid.uuid4()
        url = reverse("document-ocr-status", args=[task_id])
        assert url == f"/api/intellidocs/status/{task_id}/"

    def test_bill_ocr_result_url(self):
        task_id = uuid.uuid4()
        url = reverse("document-ocr-result", args=[task_id])
        assert url == f"/api/intellidocs/result/{task_id}/"

    def test_bill_extraction_list_url(self):
        url = reverse("document-extraction-list")
        assert url == "/api/intellidocs/extractions/"

    def test_bill_extraction_detail_url(self):
        pk = uuid.uuid4()
        url = reverse("document-extraction-detail", args=[pk])
        assert url == f"/api/intellidocs/extractions/{pk}/"

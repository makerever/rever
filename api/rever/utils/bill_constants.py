from django.utils.translation import gettext_lazy as _

PAYMENT_TERM_CHOICES = (
    ("net15", _("Net 15")),
    ("net30", _("Net 30")),
    ("net45", _("Net 45")),
    ("due", _("Due on receipt")),
)
STATUS_CHOICES = [
    ("draft", "Draft"),
    ("in_review", "In-Review"),
    ("under_approval", "Under Approval"),
    ("approved", "Approved"),
    ("rejected", "Rejected"),
]
MATCH_PROGRESS_CHOICES = [
    ("not_started", "Not Started"),
    ("in_progress", "In Progress"),
    ("completed", "Completed"),
    ("error", "Error"),
]
RECEIPT_STATUS_CHOICES = [
    ("draft", "Draft"),  # initial state, default
    ("requested", "Requested"),  # request sent
    ("confirmed", "Confirmed"),  # receipt confirmed
    ("revoked", "Revoked"),  # receipt revoked
]

MATCH_STATUS_CHOICES = [
    ("pending", "Pending"),  # Not yet matched
    ("matched", "Matched"),  # Fully matched
    ("partial", "Partial Match"),  # Partially matched
    ("mismatch", "Mismatch"),  # Doesn't match PO
    ("no_po", "No PO"),  # Bill without purchase order
    ("exception", "Exception"),  # Requires manual review
]

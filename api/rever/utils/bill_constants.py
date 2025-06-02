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

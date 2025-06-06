from .approval import urlpatterns as approval_urls
from .attachment import urlpatterns as attachment_urls
from .audit import urlpatterns as audit_urls
from .auth import urlpatterns as auth_urls
from .notification import urlpatterns as notification_urls
from .payable import urlpatterns as payable_urls

urlpatterns = [
    *auth_urls,
    *payable_urls,
    *attachment_urls,
    *approval_urls,
    *notification_urls,
    *audit_urls,
]

import logging
import time

from django.http import HttpRequest
from rest_framework.request import Request

from rever.utils.ip_address import get_client_ip

api_logger = logging.getLogger("rever.api.request")


class RequestLoggerMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def _should_log_route(self, request: Request | HttpRequest) -> bool:
        return not (request.path == "/" and request.method == "GET")

    def __call__(self, request):
        start_time = time.time()
        response = self.get_response(request)
        duration = time.time() - start_time

        if not self._should_log_route(request):
            return response

        user_id = (
            request.user.id
            if hasattr(request, "user") and getattr(request.user, "is_authenticated", False)
            else None
        )

        api_logger.info(
            f"{request.method} {request.get_full_path()} {response.status_code}",
            extra={
                "path": request.path,
                "method": request.method,
                "status_code": response.status_code,
                "duration_ms": int(duration * 1000),
                "remote_addr": get_client_ip(request),
                "user_agent": request.META.get("HTTP_USER_AGENT", ""),
                "user_id": user_id,
            },
        )

        return response

from django.urls import path
from rest_framework.routers import DefaultRouter

from rever.app.views import NotificationViewSet, UserNotificationPreferenceAPIView

router = DefaultRouter()
router.register(r"notifications", NotificationViewSet, basename="notification")

urlpatterns = [
    path(
        "users/me/notification-preferences/",
        UserNotificationPreferenceAPIView.as_view(),
        name="user-notification-preferences",
    ),
    *router.urls,
]

from rest_framework.response import Response

from rever.app.serializers import UserNotificationPreferenceSerializer
from rever.app.views.base import BaseAPIView
from rever.db.models import UserNotificationPreference


class UserNotificationPreferenceAPIView(BaseAPIView):
    def get(self, request):
        setting, _ = UserNotificationPreference.objects.get_or_create(user=request.user)
        serializer = UserNotificationPreferenceSerializer(setting)
        return Response(serializer.data)

    def patch(self, request):
        setting, _ = UserNotificationPreference.objects.get_or_create(user=request.user)
        serializer = UserNotificationPreferenceSerializer(setting, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

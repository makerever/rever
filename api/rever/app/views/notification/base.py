from rest_framework.response import Response

from rever.app.serializers import UserNotificationSettingSerializer
from rever.app.views.base import BaseAPIView
from rever.db.models import UserNotificationSetting


class NotificationSettingAPIView(BaseAPIView):
    def get(self, request):
        setting, _ = UserNotificationSetting.objects.get_or_create(user=request.user)
        serializer = UserNotificationSettingSerializer(setting)
        return Response(serializer.data)

    def patch(self, request):
        setting, _ = UserNotificationSetting.objects.get_or_create(user=request.user)
        serializer = UserNotificationSettingSerializer(setting, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

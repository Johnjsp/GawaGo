from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from django.contrib.auth.models import User

from apps.notifications.models import Notification
from apps.notifications.serializers import NotificationSerializer


class NotificationListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        if request.user.is_authenticated:
            recipient = request.user
        else:
            username = request.query_params.get("username") or request.query_params.get("recipient_username")
            if not username:
                return Response({"detail": "username is required when not authenticated."}, status=status.HTTP_400_BAD_REQUEST)
            recipient = get_object_or_404(User, username=username)
        queryset = Notification.objects.select_related("recipient").filter(recipient=recipient)
        return Response(NotificationSerializer(queryset, many=True).data)


class NotificationMarkReadView(APIView):
    permission_classes = [AllowAny]

    def patch(self, request, pk):
        notification = get_object_or_404(Notification, pk=pk)
        actor = request.user if request.user.is_authenticated else None
        actor_username = None if actor is None else actor.username
        if not actor_username:
            actor_username = request.data.get("username") or request.query_params.get("username")
        if notification.recipient.username != actor_username and not (actor and actor.is_staff):
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)
        notification.is_read = True
        notification.save(update_fields=["is_read"])
        return Response(NotificationSerializer(notification).data, status=status.HTTP_200_OK)

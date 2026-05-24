from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.reviews.models import Review
from apps.reviews.serializers import ReviewCreateSerializer, ReviewSerializer
from apps.notifications.models import Notification


class ReviewListCreateView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        target_username = request.query_params.get("username") or request.query_params.get("target_username")
        author_username = request.query_params.get("author_username")
        reviews = Review.objects.select_related("author", "target")
        if target_username:
            reviews = reviews.filter(target__username=target_username)
        if author_username:
            reviews = reviews.filter(author__username=author_username)
        if not target_username and not author_username:
            if request.user.is_authenticated:
                reviews = reviews.filter(target=request.user)
            else:
                return Response({"detail": "username or author_username is required."}, status=status.HTTP_400_BAD_REQUEST)
        return Response(ReviewSerializer(reviews, many=True).data)

    def post(self, request):
        serializer = ReviewCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        target_user = serializer.validated_data["target_username"]
        author_user = request.user if request.user.is_authenticated else serializer.validated_data.get("author_username")
        if not author_user:
            return Response({"detail": "author_username is required when not authenticated."}, status=status.HTTP_400_BAD_REQUEST)

        author_profile = getattr(author_user, "profile", None)
        target_profile = getattr(target_user, "profile", None)

        if not author_profile or not target_profile:
            return Response({"detail": "Both users must have profiles."}, status=status.HTTP_400_BAD_REQUEST)

        author_role = author_profile.role
        target_role = target_profile.role
        if author_role == target_role:
            return Response({"detail": "Reviews are only allowed between workers and households."}, status=status.HTTP_400_BAD_REQUEST)

        if author_role == "worker" and target_role != "household":
            return Response({"detail": "Workers can only review households."}, status=status.HTTP_400_BAD_REQUEST)
        if author_role == "household" and target_role != "worker":
            return Response({"detail": "Households can only review workers."}, status=status.HTTP_400_BAD_REQUEST)
        if author_role == "worker" and serializer.validated_data.get("rating") is not None:
            return Response({"detail": "Workers cannot rate households."}, status=status.HTTP_400_BAD_REQUEST)

        review = Review.objects.create(
            author=author_user,
            target=target_user,
            author_role=author_role,
            target_role=target_role,
            job_title=serializer.validated_data.get("job_title", ""),
            rating=serializer.validated_data.get("rating") if author_role == "household" else None,
            feedback=serializer.validated_data.get("feedback", ""),
        )
        notification_message = (
            "You received anonymous feedback from a worker."
            if author_role == "worker"
            else f"You received a new review from {author_user.username}."
        )
        Notification.objects.create(
            recipient=target_user,
            notification_type=Notification.TYPE_ANALYTICS,
            title="New feedback received" if author_role == "worker" else "New review received",
            message=notification_message,
        )
        return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)

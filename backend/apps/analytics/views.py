from django.contrib.auth.models import User
from django.db.models import Avg
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import UserProfile
from apps.analytics.serializers import DashboardMetricsSerializer
from apps.jobs.models import JobApplication, JobPosting


class DashboardMetricsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        data = {
            "open_jobs": JobPosting.objects.filter(status=JobPosting.STATUS_OPEN).count(),
            "verified_workers": UserProfile.objects.filter(role=UserProfile.ROLE_WORKER, verification_status="verified").count(),
            "completed_jobs": JobPosting.objects.filter(status=JobPosting.STATUS_COMPLETED).count(),
            "cancelled_jobs": JobPosting.objects.filter(status=JobPosting.STATUS_CANCELLED).count(),
            "active_applications": JobApplication.objects.filter(status=JobApplication.STATUS_PENDING).count(),
            "total_accounts": User.objects.count(),
            "avg_rating": UserProfile.objects.filter(role=UserProfile.ROLE_WORKER, rating_count__gt=0, average_rating__isnull=False).aggregate(value=Avg("average_rating"))["value"],
        }
        serializer = DashboardMetricsSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data)

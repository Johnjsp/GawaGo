from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import UserProfile
from apps.jobs.models import JobPosting
from apps.matching.serializers import MatchRequestSerializer, MatchResultSerializer
from apps.matching.services import build_match_results


class RecommendedWorkersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = MatchRequestSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        return self._build_response(request, serializer.validated_data["job_id"])

    def post(self, request):
        serializer = MatchRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return self._build_response(request, serializer.validated_data["job_id"])

    def _build_response(self, request, job_id):
        try:
            job = JobPosting.objects.get(pk=job_id)
        except JobPosting.DoesNotExist:
            return Response(
                {
                    "detail": "Job posting not found.",
                    "job_id": job_id,
                    "results": [],
                },
                status=status.HTTP_404_NOT_FOUND,
            )
        if job.household != request.user and not request.user.is_staff:
            return Response(
                {"detail": "Only the job owner or staff can view recommended workers for this job."},
                status=status.HTTP_403_FORBIDDEN,
            )
        workers = (
            UserProfile.objects.select_related("user")
            .prefetch_related("user__availability_windows")
            .filter(role=UserProfile.ROLE_WORKER, user__is_staff=False)
        )
        results = build_match_results(job, list(workers))
        return Response(
            {
                "job_id": job.id,
                "job_title": job.title,
                "required_skill": job.required_skill,
                "results": MatchResultSerializer(results, many=True).data,
            }
        )

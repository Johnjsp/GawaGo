from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import UserProfile
from apps.jobs.models import JobPosting
from apps.matching.serializers import MatchRequestSerializer, MatchResultSerializer
from apps.matching.services import build_match_results


class RecommendedWorkersView(APIView):
    def get(self, request):
        serializer = MatchRequestSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        return self._build_response(serializer.validated_data["job_id"])

    def post(self, request):
        serializer = MatchRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return self._build_response(serializer.validated_data["job_id"])

    def _build_response(self, job_id):
        job = JobPosting.objects.get(pk=job_id)
        workers = UserProfile.objects.select_related("user").filter(role=UserProfile.ROLE_WORKER)
        results = build_match_results(job, list(workers))
        return Response(
            {
                "job_id": job.id,
                "job_title": job.title,
                "required_skill": job.required_skill,
                "results": MatchResultSerializer(results, many=True).data,
            }
        )

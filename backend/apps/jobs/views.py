from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.jobs.models import JobApplication, JobImage, JobPosting
from apps.jobs.serializers import (
    JobApplicationCreateSerializer,
    JobApplicationSerializer,
    JobApplicationStatusSerializer,
    JobCreateSerializer,
    JobPostingSerializer,
)
from apps.notifications.models import Notification
from apps.accounts.models import UserProfile


def ensure_worker_profile(user, role_hint=""):
    profile = getattr(user, "profile", None)
    normalized_hint = str(role_hint or "").strip().lower()
    if not profile:
        return UserProfile.objects.create(user=user, role=UserProfile.ROLE_WORKER)
    if profile.role != UserProfile.ROLE_WORKER and normalized_hint == UserProfile.ROLE_WORKER:
        profile.role = UserProfile.ROLE_WORKER
        profile.save(update_fields=["role"])
    return profile


class JobViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    queryset = JobPosting.objects.select_related("household").prefetch_related(
        "applications",
        "applications__worker",
        "images",
    ).order_by("-created_at")
    serializer_class = JobPostingSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        params = self.request.query_params
        if params.get("status"):
            queryset = queryset.filter(status=params["status"])
        if params.get("job_type"):
            queryset = queryset.filter(job_type__icontains=params["job_type"])
        if params.get("location"):
            queryset = queryset.filter(location_label__icontains=params["location"])
        if params.get("required_skill"):
            queryset = queryset.filter(required_skill__icontains=params["required_skill"])
        if params.get("min_rate"):
            queryset = queryset.filter(service_rate__gte=params["min_rate"])
        if params.get("max_rate"):
            queryset = queryset.filter(service_rate__lte=params["max_rate"])
        return queryset

    def create(self, request, *args, **kwargs):
        serializer = JobCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        image_files = request.FILES.getlist("images")
        if image_files and len(image_files) > 5:
            return Response({"detail": "You can upload up to 5 images only."}, status=status.HTTP_400_BAD_REQUEST)
        allowed_types = {"image/jpeg", "image/png", "image/webp"}
        max_file_size = 5 * 1024 * 1024
        for image_file in image_files:
            if image_file.content_type not in allowed_types:
                return Response({"detail": "Only JPG, PNG, and WebP images are allowed."}, status=status.HTTP_400_BAD_REQUEST)
            if image_file.size > max_file_size:
                return Response({"detail": "Each image must be 5MB or smaller."}, status=status.HTTP_400_BAD_REQUEST)
        if request.user.is_authenticated:
            household = request.user
        else:
            household_name = serializer.validated_data.get("household_username")
            if not household_name:
                return Response({"detail": "household_username is required when not authenticated."}, status=status.HTTP_400_BAD_REQUEST)
            household = get_object_or_404(User, username=household_name)
        if not getattr(household, "profile", None) or household.profile.role != UserProfile.ROLE_HOUSEHOLD:
            return Response({"detail": "Only households can create job postings."}, status=status.HTTP_403_FORBIDDEN)
        job = JobPosting.objects.create(
            household=household,
            title=serializer.validated_data["title"],
            job_type=serializer.validated_data["job_type"],
            required_skill=serializer.validated_data["required_skill"],
            schedule=serializer.validated_data["schedule"],
            description=serializer.validated_data.get("description", ""),
            location_label=serializer.validated_data["location_label"],
            latitude=serializer.validated_data["latitude"],
            longitude=serializer.validated_data["longitude"],
            service_rate=serializer.validated_data["service_rate"],
            worker_slots=serializer.validated_data["worker_slots"],
            status=serializer.validated_data.get("status", JobPosting.STATUS_OPEN),
        )
        for index, image_file in enumerate(image_files):
            JobImage.objects.create(job=job, image=image_file, order=index)
        return Response(JobPostingSerializer(job).data, status=status.HTTP_201_CREATED)

    def perform_update(self, serializer):
        actor_username = self.request.user.username if self.request.user.is_authenticated else self.request.data.get("household_username") or self.request.query_params.get("household_username")
        if not actor_username:
            raise PermissionDenied("household_username is required to update this posting.")
        if serializer.instance.household.username != actor_username and not self.request.user.is_staff:
            raise PermissionDenied("Only the job owner can update this posting.")
        serializer.save()

    def perform_destroy(self, instance):
        actor_username = self.request.user.username if self.request.user.is_authenticated else self.request.data.get("household_username") or self.request.query_params.get("household_username")
        if not actor_username:
            raise PermissionDenied("household_username is required to delete this posting.")
        if instance.household.username != actor_username and not self.request.user.is_staff:
            raise PermissionDenied("Only the job owner can delete this posting.")
        instance.delete()


class JobApplicationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, job_id):
        serializer = JobApplicationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        job = get_object_or_404(JobPosting, pk=job_id)
        worker = request.user if request.user.is_authenticated else get_object_or_404(User, username=serializer.validated_data.get("worker_username"))
        profile = ensure_worker_profile(worker, request.data.get("worker_role") or request.data.get("role"))
        if not profile or profile.role != UserProfile.ROLE_WORKER:
            return Response({"detail": "Only workers can apply to jobs."}, status=status.HTTP_403_FORBIDDEN)
        application, created = JobApplication.objects.get_or_create(
            job=job,
            worker=worker,
            defaults={"note": serializer.validated_data.get("note", "")},
        )
        if not created:
            return Response({"detail": "Worker already applied."}, status=status.HTTP_400_BAD_REQUEST)
        Notification.objects.create(
            recipient=job.household,
            notification_type=Notification.TYPE_APPLICATION,
            title="New worker application",
            message=f"{worker.username} applied to {job.title}.",
        )
        return Response(JobApplicationSerializer(application).data, status=status.HTTP_201_CREATED)


class JobApplicationStatusView(APIView):
    permission_classes = [AllowAny]

    def patch(self, request, pk):
        application = JobApplication.objects.select_related("job", "worker").filter(pk=pk).first()
        actor_username = request.user.username if request.user.is_authenticated else request.data.get("household_username") or request.query_params.get("household_username")
        if not actor_username:
            return Response({"detail": "household_username is required."}, status=status.HTTP_400_BAD_REQUEST)
        if application and application.job.household.username != actor_username and not request.user.is_staff:
            return Response({"detail": "Only the job owner can update application status."}, status=status.HTTP_403_FORBIDDEN)
        serializer = JobApplicationStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if not application:
            job_id = serializer.validated_data.get("job_id") or request.data.get("job_id") or pk
            worker_username = serializer.validated_data.get("worker_username") or request.data.get("worker_username")
            if not worker_username:
                return Response({"detail": "worker_username is required when application does not exist."}, status=status.HTTP_400_BAD_REQUEST)
            worker = get_object_or_404(User, username=worker_username)
            profile = ensure_worker_profile(worker, request.data.get("worker_role") or request.data.get("role"))
            if not profile or profile.role != UserProfile.ROLE_WORKER:
                return Response({"detail": "Only workers can receive application updates."}, status=status.HTTP_403_FORBIDDEN)
            job = get_object_or_404(JobPosting, pk=job_id)
            if job.household.username != actor_username and not request.user.is_staff:
                return Response({"detail": "Only the job owner can update application status."}, status=status.HTTP_403_FORBIDDEN)
            application, _ = JobApplication.objects.get_or_create(job=job, worker=worker)
        application.status = serializer.validated_data["status"]
        application.save(update_fields=["status", "updated_at"])
        if application.status == JobApplication.STATUS_HIRED:
            application.job.status = JobPosting.STATUS_ASSIGNED
            application.job.save(update_fields=["status"])
            Notification.objects.create(
                recipient=application.worker,
                notification_type=Notification.TYPE_HIRING,
                title="You were hired",
                message=f"You were hired for {application.job.title}.",
            )
        elif application.status == JobApplication.STATUS_REJECTED:
            Notification.objects.create(
                recipient=application.worker,
                notification_type=Notification.TYPE_REJECTION,
                title="Application rejected",
                message=f"Your application for {application.job.title} was rejected.",
            )
        return Response(JobApplicationSerializer(application).data)

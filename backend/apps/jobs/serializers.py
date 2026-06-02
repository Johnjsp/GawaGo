from rest_framework import serializers

from apps.jobs.models import JobApplication, JobImage, JobPosting
from apps.matching.services import get_road_route_for_match
from apps.reviews.models import Review


class JobApplicationSerializer(serializers.ModelSerializer):
    job_id = serializers.IntegerField(source="job.id", read_only=True)
    job_title = serializers.CharField(source="job.title", read_only=True)
    worker_username = serializers.CharField(source="worker.username", read_only=True)
    worker_name = serializers.SerializerMethodField()

    class Meta:
        model = JobApplication
        fields = [
            "id",
            "job_id",
            "job_title",
            "worker",
            "worker_username",
            "worker_name",
            "status",
            "applied_at",
            "updated_at",
            "note",
        ]
        read_only_fields = ["id", "worker_username", "applied_at", "updated_at"]

    def get_worker_name(self, obj):
        return obj.worker.get_full_name().strip() or obj.worker.username


class JobImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = JobImage
        fields = ["id", "image", "image_url", "uploaded_at", "order"]
        read_only_fields = ["id", "uploaded_at"]

    def get_image_url(self, obj):
        if not obj.image:
            return ""
        request = self.context.get("request")
        url = obj.image.url
        return request.build_absolute_uri(url) if request else url


class JobPostingSerializer(serializers.ModelSerializer):
    household_username = serializers.CharField(source="household.username", read_only=True)
    household_name = serializers.SerializerMethodField()
    applications = serializers.SerializerMethodField()
    current_worker_application = serializers.SerializerMethodField()
    hired_count = serializers.SerializerMethodField()
    workers_needed = serializers.IntegerField(source="worker_slots", read_only=True)
    can_apply = serializers.SerializerMethodField()
    can_accept_hire_request = serializers.SerializerMethodField()
    can_request_completion = serializers.SerializerMethodField()
    can_review = serializers.SerializerMethodField()
    images = JobImageSerializer(many=True, read_only=True)
    route_distance_km = serializers.SerializerMethodField()
    route_points = serializers.SerializerMethodField()

    class Meta:
        model = JobPosting
        fields = [
            "id",
            "household_username",
            "household_name",
            "title",
            "job_type",
            "required_skill",
            "schedule",
            "schedule_type",
            "preferred_date",
            "preferred_time",
            "description",
            "location_label",
            "latitude",
            "longitude",
            "service_rate",
            "worker_slots",
            "status",
            "hired_count",
            "workers_needed",
            "can_apply",
            "can_accept_hire_request",
            "can_request_completion",
            "can_review",
            "created_at",
            "completed_at",
            "applications",
            "current_worker_application",
            "images",
            "route_distance_km",
            "route_points",
        ]
        read_only_fields = [
            "id",
            "household_username",
            "household_name",
            "created_at",
            "completed_at",
            "applications",
            "current_worker_application",
            "images",
            "route_distance_km",
            "route_points",
        ]

    def get_household_name(self, obj):
        return obj.household.get_full_name().strip() or obj.household.username

    def get_applications(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return []
        applications = obj.applications.all()
        if user.is_staff or obj.household_id == user.id:
            visible_applications = applications
        else:
            profile = getattr(user, "profile", None)
            if not profile or profile.role != "worker":
                return []
            visible_applications = applications.filter(worker=user)
        return JobApplicationSerializer(visible_applications, many=True, context=self.context).data

    def get_current_worker_application(self, obj):
        application = self.get_current_worker_application_obj(obj)
        if not application:
            return None
        return JobApplicationSerializer(application, context=self.context).data

    def get_current_worker_application_obj(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        profile = getattr(user, "profile", None)
        if not user or not user.is_authenticated or not profile or profile.role != "worker":
            return None
        cache_key = f"current_worker_application:{obj.pk}:{user.pk}"
        if not hasattr(self, "_current_worker_application_cache"):
            self._current_worker_application_cache = {}
        if cache_key not in self._current_worker_application_cache:
            self._current_worker_application_cache[cache_key] = obj.applications.filter(worker=user).first()
        return self._current_worker_application_cache[cache_key]

    def get_hired_count(self, obj):
        return obj.applications.filter(status__in=[JobApplication.STATUS_HIRED, JobApplication.STATUS_COMPLETED]).count()

    def is_authenticated_worker(self):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        profile = getattr(user, "profile", None)
        if not user or not user.is_authenticated or not profile or profile.role != "worker":
            return False, None, None
        return True, user, profile

    def get_can_apply(self, obj):
        is_worker, user, profile = self.is_authenticated_worker()
        if not is_worker:
            return False
        if profile.verification_status != "verified":
            return False
        if obj.status != JobPosting.STATUS_OPEN:
            return False
        if self.get_hired_count(obj) >= obj.worker_slots:
            return False
        return not obj.applications.filter(worker=user).exists()

    def get_can_accept_hire_request(self, obj):
        application = self.get_current_worker_application_obj(obj)
        if not application or application.status != JobApplication.STATUS_HIRE_REQUESTED:
            return False
        if obj.status in [JobPosting.STATUS_COMPLETED, JobPosting.STATUS_CANCELLED]:
            return False
        return self.get_hired_count(obj) < obj.worker_slots

    def get_can_request_completion(self, obj):
        application = self.get_current_worker_application_obj(obj)
        if not application or application.status != JobApplication.STATUS_HIRED:
            return False
        return obj.status == JobPosting.STATUS_ASSIGNED

    def get_can_review(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        profile = getattr(user, "profile", None)
        if not user or not user.is_authenticated or obj.status != JobPosting.STATUS_COMPLETED:
            return False
        if user.is_staff:
            return False
        if obj.household_id == user.id:
            completed_applications = obj.applications.filter(
                status=JobApplication.STATUS_COMPLETED,
            )
            completed_worker_ids = completed_applications.values_list("worker_id", flat=True)
            reviewed_worker_ids = Review.objects.filter(
                job=obj,
                author=user,
                target_id__in=completed_worker_ids,
                author_role=Review.ROLE_HOUSEHOLD,
                target_role=Review.ROLE_WORKER,
            ).values_list("target_id", flat=True)
            return completed_applications.exclude(worker_id__in=reviewed_worker_ids).exists()
        if not profile or profile.role != "worker":
            return False
        application = self.get_current_worker_application_obj(obj)
        if not application or application.status != JobApplication.STATUS_COMPLETED:
            return False
        return not Review.objects.filter(
            job=obj,
            author=user,
            target=obj.household,
            author_role=Review.ROLE_WORKER,
            target_role=Review.ROLE_HOUSEHOLD,
        ).exists()

    def get_worker_route(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        profile = getattr(user, "profile", None)
        if not user or not user.is_authenticated or not profile or profile.role != "worker":
            return None
        cache_key = f"worker_route:{obj.pk}:{profile.pk}"
        if not hasattr(self, "_worker_route_cache"):
            self._worker_route_cache = {}
        if cache_key not in self._worker_route_cache:
            self._worker_route_cache[cache_key] = get_road_route_for_match(obj, profile)
        return self._worker_route_cache[cache_key]

    def get_route_distance_km(self, obj):
        route = self.get_worker_route(obj)
        distance_km = route.get("distance_km") if route else None
        return round(distance_km, 2) if distance_km is not None else None

    def get_route_points(self, obj):
        route = self.get_worker_route(obj)
        return route.get("route_points") if route else []


class JobCreateSerializer(serializers.Serializer):
    household_username = serializers.CharField(required=False, allow_blank=True)
    title = serializers.CharField()
    job_type = serializers.CharField()
    required_skill = serializers.CharField()
    schedule = serializers.CharField(required=False, allow_blank=True)
    schedule_type = serializers.CharField(required=False, allow_blank=True, default="")
    preferred_date = serializers.DateField(required=False, allow_null=True)
    preferred_time = serializers.TimeField(required=False, allow_null=True)
    description = serializers.CharField(required=False, allow_blank=True, default="")
    location_label = serializers.CharField()
    latitude = serializers.DecimalField(max_digits=10, decimal_places=7)
    longitude = serializers.DecimalField(max_digits=10, decimal_places=7)
    service_rate = serializers.DecimalField(max_digits=10, decimal_places=2)
    worker_slots = serializers.IntegerField(min_value=1, default=1)
    status = serializers.ChoiceField(choices=JobPosting.STATUS_CHOICES, required=False)

    def validate(self, attrs):
        if not attrs.get("schedule") and not (attrs.get("preferred_date") and attrs.get("preferred_time")):
            raise serializers.ValidationError({"schedule": "Schedule text or preferred date and time are required."})
        return attrs


class JobApplicationCreateSerializer(serializers.Serializer):
    worker_username = serializers.CharField(required=False)
    note = serializers.CharField(required=False, allow_blank=True, default="")


class JobApplicationStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=JobApplication.STATUS_CHOICES)
    job_id = serializers.IntegerField(required=False)
    worker_username = serializers.CharField(required=False, allow_blank=True)

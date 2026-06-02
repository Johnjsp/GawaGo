from rest_framework import serializers

from apps.jobs.models import JobApplication, JobImage, JobPosting
from apps.matching.services import get_road_route_for_match


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
        request = self.context.get("request")
        user = getattr(request, "user", None)
        profile = getattr(user, "profile", None)
        if not user or not user.is_authenticated or not profile or profile.role != "worker":
            return None
        application = obj.applications.filter(worker=user).first()
        if not application:
            return None
        return JobApplicationSerializer(application, context=self.context).data

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

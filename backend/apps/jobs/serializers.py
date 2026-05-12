from rest_framework import serializers

from apps.jobs.models import JobApplication, JobPosting


class JobApplicationSerializer(serializers.ModelSerializer):
    worker_username = serializers.CharField(source="worker.username", read_only=True)
    worker_name = serializers.SerializerMethodField()

    class Meta:
        model = JobApplication
        fields = ["id", "worker", "worker_username", "worker_name", "status", "applied_at", "updated_at", "note"]
        read_only_fields = ["id", "worker_username", "applied_at", "updated_at"]

    def get_worker_name(self, obj):
        return obj.worker.get_full_name().strip() or obj.worker.username


class JobPostingSerializer(serializers.ModelSerializer):
    household_username = serializers.CharField(source="household.username", read_only=True)
    household_name = serializers.SerializerMethodField()
    applications = JobApplicationSerializer(many=True, read_only=True)

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
            "description",
            "location_label",
            "latitude",
            "longitude",
            "service_rate",
            "worker_slots",
            "status",
            "created_at",
            "applications",
        ]
        read_only_fields = ["id", "household_username", "household_name", "created_at", "applications"]

    def get_household_name(self, obj):
        return obj.household.get_full_name().strip() or obj.household.username


class JobCreateSerializer(serializers.Serializer):
    household_username = serializers.CharField(required=False, allow_blank=True)
    title = serializers.CharField()
    job_type = serializers.CharField()
    required_skill = serializers.CharField()
    schedule = serializers.CharField()
    description = serializers.CharField(required=False, allow_blank=True, default="")
    location_label = serializers.CharField()
    latitude = serializers.DecimalField(max_digits=10, decimal_places=7)
    longitude = serializers.DecimalField(max_digits=10, decimal_places=7)
    service_rate = serializers.DecimalField(max_digits=10, decimal_places=2)
    worker_slots = serializers.IntegerField(min_value=1, default=1)
    status = serializers.ChoiceField(choices=JobPosting.STATUS_CHOICES, required=False)


class JobApplicationCreateSerializer(serializers.Serializer):
    worker_username = serializers.CharField(required=False)
    note = serializers.CharField(required=False, allow_blank=True, default="")


class JobApplicationStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=JobApplication.STATUS_CHOICES)
    job_id = serializers.IntegerField(required=False)
    worker_username = serializers.CharField(required=False, allow_blank=True)

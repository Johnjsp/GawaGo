from rest_framework import serializers

from apps.common.models import VerificationRequest


class VerificationRequestSerializer(serializers.ModelSerializer):
    worker_username = serializers.CharField(source="worker.username", read_only=True)
    worker_name = serializers.SerializerMethodField()

    class Meta:
        model = VerificationRequest
        fields = [
            "id",
            "worker",
            "worker_username",
            "worker_name",
            "primary_id_name",
            "secondary_doc_name",
            "primary_id_preview",
            "secondary_doc_preview",
            "notes",
            "status",
            "submitted_at",
            "reviewed_at",
            "review_note",
        ]
        read_only_fields = ["id", "status", "submitted_at", "reviewed_at", "review_note"]

    def get_worker_name(self, obj):
        full_name = obj.worker.get_full_name().strip()
        return full_name or obj.worker.username


class VerificationRequestCreateSerializer(serializers.Serializer):
    primary_id_name = serializers.CharField()
    secondary_doc_name = serializers.CharField()
    primary_id_preview = serializers.CharField(required=False, allow_blank=True)
    secondary_doc_preview = serializers.CharField(required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)
    worker_username = serializers.CharField(required=False, allow_blank=True)

from django.contrib.auth.models import User
from rest_framework import serializers

from apps.reviews.models import Review


class ReviewSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source="author.username", read_only=True)
    target_username = serializers.CharField(source="target.username", read_only=True)
    author_name = serializers.SerializerMethodField()
    target_name = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = [
            "id",
            "author",
            "author_username",
            "author_name",
            "author_role",
            "target",
            "target_username",
            "target_name",
            "target_role",
            "job_title",
            "rating",
            "feedback",
            "created_at",
        ]
        read_only_fields = ["id", "author", "author_username", "target_username", "created_at"]

    def get_author_name(self, obj):
        return obj.author.get_full_name().strip() or obj.author.username

    def get_target_name(self, obj):
        return obj.target.get_full_name().strip() or obj.target.username


class ReviewCreateSerializer(serializers.Serializer):
    author_username = serializers.CharField(max_length=150, required=False, allow_blank=True)
    target_username = serializers.CharField(max_length=150)
    job_title = serializers.CharField(max_length=255, required=False, allow_blank=True)
    rating = serializers.DecimalField(
        max_digits=2,
        decimal_places=1,
        required=False,
        min_value=1,
        max_value=5,
        allow_null=True,
    )
    feedback = serializers.CharField(required=False, allow_blank=True)

    def validate_author_username(self, value):
        if not value:
            return None
        try:
            return User.objects.get(username=value)
        except User.DoesNotExist as exc:
            raise serializers.ValidationError("Author user not found.") from exc

    def validate_target_username(self, value):
        try:
            return User.objects.get(username=value)
        except User.DoesNotExist as exc:
            raise serializers.ValidationError("Target user not found.") from exc

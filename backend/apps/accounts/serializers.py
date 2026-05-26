from django.contrib.auth.models import User
import json
from rest_framework import serializers

from apps.accounts.models import PasswordResetRequest, SignupVerificationRequest, UserProfile
from apps.common.serializers import VerificationRequestSerializer


class FlexibleStringListField(serializers.ListField):
    child = serializers.CharField()

    def to_internal_value(self, data):
        if isinstance(data, str):
            try:
                parsed = json.loads(data)
            except json.JSONDecodeError:
                parsed = [item.strip() for item in data.split(",") if item.strip()]
            data = parsed
        return super().to_internal_value(data)


class UserProfileSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    full_name = serializers.SerializerMethodField()
    user_type = serializers.CharField(source="role", read_only=True)
    verification_request = serializers.SerializerMethodField()
    profile_photo_url = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = [
            "id",
            "user_id",
            "username",
            "email",
            "full_name",
            "user_type",
            "role",
            "phone",
            "bio",
            "years_experience",
            "skills",
            "hourly_rate",
            "daily_rate",
            "verification_status",
            "location_label",
            "latitude",
            "longitude",
            "profile_photo",
            "profile_photo_url",
            "average_rating",
            "rating_count",
            "display_rating",
            "verification_request",
        ]
        read_only_fields = ["display_rating"]

    def get_full_name(self, obj):
        return obj.user.get_full_name().strip() or obj.user.username

    def get_verification_request(self, obj):
        request_obj = obj.user.verification_requests.order_by("-submitted_at").first()
        if not request_obj:
            return None
        return VerificationRequestSerializer(request_obj).data

    def get_profile_photo_url(self, obj):
        if not obj.profile_photo:
            return ""
        request = self.context.get("request")
        url = obj.profile_photo.url
        return request.build_absolute_uri(url) if request else url


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    role = serializers.ChoiceField(choices=UserProfile.ROLE_CHOICES, default=UserProfile.ROLE_WORKER)
    phone = serializers.CharField(max_length=30, required=False, allow_blank=True)
    bio = serializers.CharField(required=False, allow_blank=True)
    years_experience = serializers.IntegerField(required=False, min_value=0)
    skills = FlexibleStringListField(required=False)
    hourly_rate = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    daily_rate = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    location_label = serializers.CharField(required=False, allow_blank=True)
    latitude = serializers.DecimalField(max_digits=10, decimal_places=7, required=False, allow_null=True)
    longitude = serializers.DecimalField(max_digits=10, decimal_places=7, required=False, allow_null=True)


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()


class ProfileUpdateSerializer(serializers.Serializer):
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False)
    role = serializers.ChoiceField(choices=UserProfile.ROLE_CHOICES, required=False)
    phone = serializers.CharField(max_length=30, required=False, allow_blank=True)
    bio = serializers.CharField(required=False, allow_blank=True)
    years_experience = serializers.IntegerField(required=False, min_value=0)
    skills = FlexibleStringListField(required=False)
    hourly_rate = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    daily_rate = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    location_label = serializers.CharField(required=False, allow_blank=True)
    latitude = serializers.DecimalField(max_digits=10, decimal_places=7, required=False, allow_null=True)
    longitude = serializers.DecimalField(max_digits=10, decimal_places=7, required=False, allow_null=True)
    profile_photo = serializers.ImageField(required=False, allow_null=True)


class ForgotPasswordRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class VerifyResetTokenSerializer(serializers.Serializer):
    email = serializers.EmailField()
    token = serializers.CharField(min_length=6, max_length=12)


class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    token = serializers.CharField(min_length=6, max_length=12)
    new_password = serializers.CharField(min_length=8)


class VerifySignupSerializer(serializers.Serializer):
    email = serializers.EmailField()
    token = serializers.CharField(min_length=6, max_length=12)


class PasswordResetRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = PasswordResetRequest
        fields = ["id", "email", "created_at", "expires_at", "used_at", "attempts"]


class SignupVerificationRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = SignupVerificationRequest
        fields = ["id", "email", "created_at", "expires_at", "verified_at"]

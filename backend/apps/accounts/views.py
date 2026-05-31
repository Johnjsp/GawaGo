from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.mail import BadHeaderError
from django.db import transaction
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import PasswordResetRequest, SignupVerificationRequest, UserProfile, WorkerAvailability
from apps.accounts.serializers import (
    ForgotPasswordRequestSerializer,
    LoginSerializer,
    PasswordResetRequestSerializer,
    PublicUserProfileSerializer,
    RegisterSerializer,
    ProfileUpdateSerializer,
    ResetPasswordSerializer,
    SignupVerificationRequestSerializer,
    UserProfileSerializer,
    VerifyResetTokenSerializer,
    VerifySignupSerializer,
    WorkerAvailabilityBulkSerializer,
    WorkerAvailabilitySerializer,
)
from apps.notifications.models import Notification
from apps.notifications.services import create_notification
from apps.accounts.services import (
    create_password_reset_request,
    send_password_reset_email,
    validate_latest_reset_request,
)
from apps.common.authentication import create_jwt_token
from apps.reviews.services import assign_due_default_worker_ratings


class UserProfileListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    queryset = UserProfile.objects.select_related("user").order_by("id")

    def get_queryset(self):
        assign_due_default_worker_ratings()
        return super().get_queryset()

    def get_serializer_class(self):
        if self.request.user.is_authenticated and self.request.user.is_staff:
            return UserProfileSerializer
        return PublicUserProfileSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        username = data["username"].strip()
        email = data["email"].strip().lower()

        if User.objects.filter(username__iexact=username).exists():
            return Response({"detail": "Username already exists."}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(email__iexact=email).exists():
            return Response({"detail": "Email already exists."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            user = User.objects.create_user(
                username=username,
                email=email,
                password=data["password"],
                first_name=data.get("first_name", ""),
                last_name=data.get("last_name", ""),
            )
            profile = UserProfile.objects.create(
                user=user,
                role=data["role"],
                phone=data.get("phone", ""),
                bio=data.get("bio", ""),
                years_experience=data.get("years_experience", 0),
                skills=data.get("skills", []),
                hourly_rate=data.get("hourly_rate"),
                daily_rate=data.get("daily_rate"),
                location_label=data.get("location_label", ""),
                latitude=data.get("latitude"),
                longitude=data.get("longitude"),
            )
        return Response(
            {
                "detail": "Account created. You can now log in.",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                },
                "profile": UserProfileSerializer(profile, context={"request": request}).data,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        username = serializer.validated_data["username"].strip()
        password = serializer.validated_data["password"]
        matched_user = User.objects.filter(username__iexact=username).first()
        if matched_user and not matched_user.is_active and matched_user.check_password(password):
            matched_user.is_active = True
            matched_user.save(update_fields=["is_active"])
        user = authenticate(
            request,
            username=matched_user.username if matched_user else username,
            password=password,
        )
        if not user:
            return Response({"detail": "Invalid username or password."}, status=status.HTTP_400_BAD_REQUEST)
        profile = UserProfile.objects.filter(user=user).first()
        account_role = "admin" if user.is_staff else (profile.role if profile else UserProfile.ROLE_WORKER)
        return Response(
            {
                "detail": "Login successful.",
                "access": create_jwt_token({"user_id": user.id, "username": user.username, "role": account_role}),
                "username": user.username,
                "email": user.email,
                "display_name": user.get_full_name() or user.username,
                "role": account_role,
                "is_staff": user.is_staff,
                "profile": UserProfileSerializer(profile, context={"request": request}).data if profile else None,
            }
        )


class VerifySignupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifySignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].strip().lower()
        token = serializer.validated_data["token"].strip()
        request_obj = SignupVerificationRequest.objects.filter(email=email).select_related("user").first()
        if not request_obj or not request_obj.verify_token(token):
            return Response({"detail": "Invalid or expired verification code."}, status=status.HTTP_400_BAD_REQUEST)
        request_obj.verified_at = request_obj.verified_at or timezone.now()
        request_obj.save(update_fields=["verified_at"])
        request_obj.user.is_active = True
        request_obj.user.save(update_fields=["is_active"])
        return Response({"detail": "Email verified and account activated."}, status=status.HTTP_200_OK)


class ForgotPasswordRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].strip().lower()
        user = User.objects.filter(email__iexact=email).first()
        if not user:
            return Response({"detail": "If the email exists, a reset code has been sent."}, status=status.HTTP_200_OK)

        reset_request, token = create_password_reset_request(user)
        try:
            send_password_reset_email(user, token)
        except (BadHeaderError, OSError, ValueError) as exc:
            reset_request.delete()
            return Response({"detail": f"Unable to send reset code: {exc}"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        return Response({"detail": "Reset code sent.", "expires_at": reset_request.expires_at}, status=status.HTTP_200_OK)


class VerifyResetTokenView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyResetTokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].strip().lower()
        token = serializer.validated_data["token"].strip()
        reset_request = validate_latest_reset_request(email, token)
        if not reset_request:
            return Response({"detail": "Invalid or expired reset code."}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"detail": "Code verified.", "expires_at": reset_request.expires_at}, status=status.HTTP_200_OK)


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].strip().lower()
        token = serializer.validated_data["token"].strip()
        new_password = serializer.validated_data["new_password"]

        reset_request = validate_latest_reset_request(email, token)
        if not reset_request:
            return Response({"detail": "Invalid or expired reset code."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            validate_password(new_password, user=reset_request.user)
        except ValidationError as exc:
            return Response({"detail": exc.messages[0]}, status=status.HTTP_400_BAD_REQUEST)

        reset_request.user.set_password(new_password)
        reset_request.user.save(update_fields=["password"])
        reset_request.used_at = reset_request.used_at or timezone.now()
        reset_request.save(update_fields=["used_at"])
        return Response({"detail": "Password reset successful."}, status=status.HTTP_200_OK)


class LogoutView(APIView):
    def post(self, request):
        if request.user.is_authenticated:
            request.session.flush()
        return Response({"detail": "Logged out."}, status=status.HTTP_200_OK)


class MeProfileView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user, defaults={"role": UserProfile.ROLE_WORKER})
        return Response(
            {
                "user": {
                    "id": request.user.id,
                    "username": request.user.username,
                    "email": request.user.email,
                    "first_name": request.user.first_name,
                    "last_name": request.user.last_name,
                },
                "profile": UserProfileSerializer(profile, context={"request": request}).data,
            }
        )

    def patch(self, request):
        serializer = ProfileUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        user = request.user
        profile, _ = UserProfile.objects.get_or_create(user=user, defaults={"role": UserProfile.ROLE_WORKER})

        if "first_name" in serializer.validated_data:
            user.first_name = serializer.validated_data["first_name"]
        if "last_name" in serializer.validated_data:
            user.last_name = serializer.validated_data["last_name"]
        if "email" in serializer.validated_data:
            user.email = serializer.validated_data["email"].strip().lower()
        user.save()

        for field in ["phone", "bio", "years_experience", "skills", "hourly_rate", "daily_rate", "location_label", "latitude", "longitude", "profile_photo"]:
            if field in serializer.validated_data:
                setattr(profile, field, serializer.validated_data[field])
        profile.save()
        create_notification(
            recipient=user,
            notification_type=Notification.TYPE_ACCOUNT_ACTIVITY,
            title="Profile updated",
            message="Your GawaGo account profile was updated. If you did not make this change, please reset your password or contact support.",
        )
        return Response({
            "detail": "Profile updated.",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
            },
            "profile": UserProfileSerializer(profile, context={"request": request}).data,
        })


class WorkerAvailabilityView(APIView):
    permission_classes = [IsAuthenticated]

    def get_worker_profile(self, request):
        profile = getattr(request.user, "profile", None)
        if not profile or profile.role != UserProfile.ROLE_WORKER:
            return None
        return profile

    def get(self, request):
        if not self.get_worker_profile(request):
            return Response({"detail": "Only workers can manage availability."}, status=status.HTTP_403_FORBIDDEN)
        windows = request.user.availability_windows.filter(is_available=True).order_by("date", "start_time")
        return Response(WorkerAvailabilitySerializer(windows, many=True).data)

    def put(self, request):
        if not self.get_worker_profile(request):
            return Response({"detail": "Only workers can manage availability."}, status=status.HTTP_403_FORBIDDEN)
        serializer = WorkerAvailabilityBulkSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            request.user.availability_windows.all().delete()
            windows = [
                WorkerAvailability(worker=request.user, **window)
                for window in serializer.validated_data["availability_windows"]
            ]
            WorkerAvailability.objects.bulk_create(windows)
        saved_windows = request.user.availability_windows.filter(is_available=True).order_by("date", "start_time")
        return Response(WorkerAvailabilitySerializer(saved_windows, many=True).data)

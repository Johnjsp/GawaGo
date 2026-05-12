import secrets

from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.mail import BadHeaderError
from django.db import transaction
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import PasswordResetRequest, SignupVerificationRequest, UserProfile
from apps.accounts.serializers import (
    ForgotPasswordRequestSerializer,
    LoginSerializer,
    PasswordResetRequestSerializer,
    RegisterSerializer,
    ProfileUpdateSerializer,
    ResetPasswordSerializer,
    SignupVerificationRequestSerializer,
    UserProfileSerializer,
    VerifyResetTokenSerializer,
    VerifySignupSerializer,
)
from apps.accounts.services import create_password_reset_request, send_password_reset_email, validate_latest_reset_request
from apps.common.authentication import create_jwt_token


def generate_token() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


class UserProfileListView(generics.ListAPIView):
    queryset = UserProfile.objects.select_related("user").all()
    serializer_class = UserProfileSerializer


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

        token = generate_token()
        with transaction.atomic():
            user = User.objects.create_user(
                username=username,
                email=email,
                password=data["password"],
                first_name=data.get("first_name", ""),
                last_name=data.get("last_name", ""),
            )
            user.is_active = False
            user.save(update_fields=["is_active"])
            UserProfile.objects.create(
                user=user,
                role=data["role"],
                skills=data.get("skills", []),
                hourly_rate=data.get("hourly_rate"),
                daily_rate=data.get("daily_rate"),
                location_label=data.get("location_label", ""),
                latitude=data.get("latitude"),
                longitude=data.get("longitude"),
            )
            SignupVerificationRequest.create_request(user, token)
        return Response(
            {"detail": "Account created. Verify your email to activate it.", "verification_code": token},
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(
            request,
            username=serializer.validated_data["username"],
            password=serializer.validated_data["password"],
        )
        if not user:
            return Response({"detail": "Invalid username or password."}, status=status.HTTP_400_BAD_REQUEST)
        if not user.is_active:
            return Response({"detail": "Account is not verified yet."}, status=status.HTTP_403_FORBIDDEN)
        login(request, user)
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
                "profile": UserProfileSerializer(profile).data if profile else None,
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
        request_obj.verified_at = request_obj.verified_at or request_obj.created_at
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
        reset_request.used_at = reset_request.used_at or reset_request.created_at
        reset_request.save(update_fields=["used_at"])
        return Response({"detail": "Password reset successful."}, status=status.HTTP_200_OK)


class LogoutView(APIView):
    def post(self, request):
        if request.user.is_authenticated:
            request.session.flush()
        return Response({"detail": "Logged out."}, status=status.HTTP_200_OK)


class MeProfileView(APIView):
    permission_classes = [IsAuthenticated]

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
                "profile": UserProfileSerializer(profile).data,
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

        for field in ["role", "skills", "hourly_rate", "daily_rate", "location_label", "latitude", "longitude"]:
            if field in serializer.validated_data:
                setattr(profile, field, serializer.validated_data[field])
        profile.save()
        return Response({"detail": "Profile updated.", "profile": UserProfileSerializer(profile).data})

from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone
from django.contrib.auth.hashers import make_password, check_password
import secrets
from datetime import timedelta


class UserProfile(models.Model):
    ROLE_HOUSEHOLD = "household"
    ROLE_WORKER = "worker"
    ROLE_CHOICES = [
        (ROLE_HOUSEHOLD, "Household"),
        (ROLE_WORKER, "Worker"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_WORKER)
    skills = models.JSONField(default=list, blank=True)
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    daily_rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    verification_status = models.CharField(max_length=20, default="pending")
    location_label = models.CharField(max_length=255, blank=True, default="")
    latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)
    rating_count = models.PositiveIntegerField(default=0)

    def __str__(self) -> str:
        return f"{self.user.username} ({self.role})"

    @property
    def has_location(self) -> bool:
        return self.latitude is not None and self.longitude is not None

    @property
    def display_rating(self) -> str:
        if not self.rating_count or self.average_rating is None:
            return "No ratings yet"
        return f"{self.average_rating:.2f}"


class PasswordResetRequest(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="password_reset_requests")
    email = models.EmailField()
    token_hash = models.CharField(max_length=128)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)
    attempts = models.PositiveIntegerField(default=0)

    class Meta:
        indexes = [models.Index(fields=["email", "created_at"])]

    @property
    def is_expired(self) -> bool:
        return timezone.now() >= self.expires_at

    @property
    def is_used(self) -> bool:
        return self.used_at is not None

    @classmethod
    def create_request(cls, user: User, token: str, ttl_minutes: int = 10) -> "PasswordResetRequest":
        return cls.objects.create(
            user=user,
            email=user.email,
            token_hash=make_password(token),
            expires_at=timezone.now() + timedelta(minutes=ttl_minutes),
        )

    def verify_token(self, token: str) -> bool:
        if self.is_expired or self.is_used:
            return False
        return check_password(token, self.token_hash)


class SignupVerificationRequest(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="verification_request")
    email = models.EmailField()
    token_hash = models.CharField(max_length=128)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    verified_at = models.DateTimeField(null=True, blank=True)

    @property
    def is_expired(self) -> bool:
        return timezone.now() >= self.expires_at

    @classmethod
    def create_request(cls, user: User, token: str, ttl_minutes: int = 10) -> "SignupVerificationRequest":
        return cls.objects.create(
            user=user,
            email=user.email,
            token_hash=make_password(token),
            expires_at=timezone.now() + timedelta(minutes=ttl_minutes),
        )

    def verify_token(self, token: str) -> bool:
        if self.is_expired or self.verified_at is not None:
            return False
        return check_password(token, self.token_hash)

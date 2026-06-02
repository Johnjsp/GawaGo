import secrets

from django.conf import settings
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.utils import timezone

from apps.accounts.models import PasswordResetRequest, SignupVerificationRequest


RESET_TOKEN_TTL_MINUTES = int(getattr(settings, "PASSWORD_RESET_TOKEN_TTL_MINUTES", 10))
SIGNUP_TOKEN_TTL_MINUTES = int(getattr(settings, "SIGNUP_VERIFICATION_TOKEN_TTL_MINUTES", 10))


def generate_reset_token() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def generate_signup_token() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def create_password_reset_request(user: User) -> tuple[PasswordResetRequest, str]:
    token = generate_reset_token()
    reset_request = PasswordResetRequest.create_request(user, token, ttl_minutes=RESET_TOKEN_TTL_MINUTES)
    return reset_request, token


def create_signup_verification_request(user: User) -> tuple[SignupVerificationRequest, str]:
    token = generate_signup_token()
    signup_request = SignupVerificationRequest.create_request(user, token, ttl_minutes=SIGNUP_TOKEN_TTL_MINUTES)
    return signup_request, token


def send_password_reset_email(user: User, token: str) -> None:
    subject = "GawaGo password reset code"
    message = (
        f"Hello {user.get_username()},\n\n"
        f"Your GawaGo password reset code is: {token}\n\n"
        f"This code expires in {RESET_TOKEN_TTL_MINUTES} minutes.\n"
        "If you did not request this, you can ignore this email."
    )
    send_mail(subject, message, getattr(settings, "DEFAULT_FROM_EMAIL", None), [user.email], fail_silently=False)


def send_signup_verification_email(user: User, token: str) -> None:
    subject = "GawaGo account verification code"
    message = (
        f"Hello {user.get_username()},\n\n"
        f"Your GawaGo account verification code is: {token}\n\n"
        f"This code expires in {SIGNUP_TOKEN_TTL_MINUTES} minutes.\n"
        "Enter this code before logging in to activate your account."
    )
    send_mail(subject, message, getattr(settings, "DEFAULT_FROM_EMAIL", None), [user.email], fail_silently=False)


def validate_latest_reset_request(email: str, token: str) -> PasswordResetRequest | None:
    reset_request = PasswordResetRequest.objects.filter(email=email).order_by("-created_at").first()
    if not reset_request:
        return None
    if reset_request.is_expired or reset_request.is_used:
        return None
    if not reset_request.verify_token(token):
        reset_request.attempts += 1
        reset_request.save(update_fields=["attempts"])
        return None
    return reset_request

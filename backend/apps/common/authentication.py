import base64
import hashlib
import hmac
import json
from datetime import datetime, timedelta, timezone

from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import authentication, exceptions


def _b64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


def _b64url_decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def create_jwt_token(payload: dict, ttl_minutes: int = 60) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    claims = dict(payload)
    claims["exp"] = int((datetime.now(timezone.utc) + timedelta(minutes=ttl_minutes)).timestamp())
    header_b64 = _b64url_encode(json.dumps(header, separators=(",", ":"), sort_keys=True).encode("utf-8"))
    payload_b64 = _b64url_encode(json.dumps(claims, separators=(",", ":"), sort_keys=True).encode("utf-8"))
    signing_input = f"{header_b64}.{payload_b64}".encode("ascii")
    signature = hmac.new(settings.SECRET_KEY.encode("utf-8"), signing_input, hashlib.sha256).digest()
    return f"{header_b64}.{payload_b64}.{_b64url_encode(signature)}"


def decode_jwt_token(token: str) -> dict:
    try:
        header_b64, payload_b64, signature_b64 = token.split(".")
        signing_input = f"{header_b64}.{payload_b64}".encode("ascii")
        expected = hmac.new(settings.SECRET_KEY.encode("utf-8"), signing_input, hashlib.sha256).digest()
        if not hmac.compare_digest(expected, _b64url_decode(signature_b64)):
            raise exceptions.AuthenticationFailed("Invalid token signature.")
        payload = json.loads(_b64url_decode(payload_b64))
        if int(payload["exp"]) < int(datetime.now(timezone.utc).timestamp()):
            raise exceptions.AuthenticationFailed("Token expired.")
        return payload
    except (ValueError, KeyError, json.JSONDecodeError, UnicodeDecodeError) as exc:
        raise exceptions.AuthenticationFailed("Invalid token.") from exc


class JWTAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        header = authentication.get_authorization_header(request).decode("utf-8")
        if not header.startswith("Bearer "):
            return None
        token = header.split(" ", 1)[1].strip()
        payload = decode_jwt_token(token)
        user_model = get_user_model()
        user = user_model.objects.filter(pk=payload.get("user_id"), is_active=True).first()
        if not user:
            raise exceptions.AuthenticationFailed("User not found.")
        return (user, payload)

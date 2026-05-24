from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from apps.accounts.models import PasswordResetRequest, UserProfile


class RegisterLoginFlowTests(TestCase):
    def test_registered_worker_can_login_after_registration(self):
        register_response = self.client.post(
            reverse("register"),
            {
                "username": "JuanWorker",
                "email": "juan.worker@gmail.com",
                "password": "worker-pass123",
                "first_name": "Juan",
                "last_name": "Worker",
                "role": UserProfile.ROLE_WORKER,
            },
            content_type="application/json",
        )
        self.assertEqual(register_response.status_code, 201)

        user = User.objects.get(username="JuanWorker")
        self.assertTrue(user.is_active)
        self.assertTrue(user.check_password("worker-pass123"))

        login_response = self.client.post(
            reverse("login"),
            {"username": "JuanWorker", "password": "worker-pass123"},
            content_type="application/json",
        )
        self.assertEqual(login_response.status_code, 200)
        self.assertEqual(login_response.json()["username"], "JuanWorker")
        self.assertEqual(login_response.json()["role"], UserProfile.ROLE_WORKER)

    def test_login_reactivates_existing_inactive_account_with_valid_password(self):
        user = User.objects.create_user(
            username="LegacyInactive",
            email="legacy.inactive@gmail.com",
            password="legacy-pass123",
            is_active=False,
        )
        UserProfile.objects.create(user=user, role=UserProfile.ROLE_HOUSEHOLD)

        response = self.client.post(
            reverse("login"),
            {"username": "LegacyInactive", "password": "legacy-pass123"},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        user.refresh_from_db()
        self.assertTrue(user.is_active)
        self.assertEqual(response.json()["role"], UserProfile.ROLE_HOUSEHOLD)

    def test_login_accepts_username_case_used_differently_from_registration(self):
        User.objects.create_user(username="MixedCaseUser", email="mixed@gmail.com", password="case-pass123")
        UserProfile.objects.create(user=User.objects.get(username="MixedCaseUser"), role=UserProfile.ROLE_HOUSEHOLD)

        response = self.client.post(
            reverse("login"),
            {"username": " mixedcaseuser ", "password": "case-pass123"},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["username"], "MixedCaseUser")


class PasswordResetFlowTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="worker1", email="worker1@gmail.com", password="initial-pass123")

    @patch("apps.accounts.views.send_password_reset_email")
    @patch("apps.accounts.services.generate_reset_token", return_value="123456")
    def test_forgot_password_creates_reset_request(self, mock_generate_token, mock_send_email):
        response = self.client.post(reverse("forgot-password"), {"email": "worker1@gmail.com"}, content_type="application/json")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(PasswordResetRequest.objects.filter(email="worker1@gmail.com").exists())
        mock_generate_token.assert_called_once()
        mock_send_email.assert_called_once()

    @patch("apps.accounts.views.send_password_reset_email")
    @patch("apps.accounts.services.generate_reset_token", return_value="123456")
    def test_verify_and_reset_password(self, mock_generate_token, mock_send_email):
        self.client.post(reverse("forgot-password"), {"email": "worker1@gmail.com"}, content_type="application/json")

        verify_response = self.client.post(
            reverse("verify-reset-token"),
            {"email": "worker1@gmail.com", "token": "123456"},
            content_type="application/json",
        )
        self.assertEqual(verify_response.status_code, 200)

        reset_response = self.client.post(
            reverse("reset-password"),
            {"email": "worker1@gmail.com", "token": "123456", "new_password": "new-pass123"},
            content_type="application/json",
        )
        self.assertEqual(reset_response.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("new-pass123"))

        reset_request = PasswordResetRequest.objects.get(email="worker1@gmail.com")
        self.assertIsNotNone(reset_request.used_at)

    @patch("apps.accounts.views.send_password_reset_email")
    @patch("apps.accounts.services.generate_reset_token", return_value="123456")
    def test_expired_code_is_rejected(self, mock_generate_token, mock_send_email):
        self.client.post(reverse("forgot-password"), {"email": "worker1@gmail.com"}, content_type="application/json")
        reset_request = PasswordResetRequest.objects.get(email="worker1@gmail.com")
        reset_request.expires_at = timezone.now() - timedelta(minutes=1)
        reset_request.save(update_fields=["expires_at"])

        response = self.client.post(
            reverse("verify-reset-token"),
            {"email": "worker1@gmail.com", "token": "123456"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)

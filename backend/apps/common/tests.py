from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from apps.accounts.models import UserProfile
from apps.common.models import VerificationRequest


class VerificationRequestReviewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_superuser(username="admin", password="password", email="admin@example.com")
        self.worker = User.objects.create_user(username="maria", password="password")
        self.profile = UserProfile.objects.create(user=self.worker, role=UserProfile.ROLE_WORKER)
        self.request_record = VerificationRequest.objects.create(
            worker=self.worker,
            primary_id_name="primary-id.jpg",
            secondary_doc_name="barangay-clearance.jpg",
        )
        self.client.force_authenticate(user=self.admin)

    def test_approving_request_marks_worker_profile_verified(self):
        url = reverse("verification-request-review", args=[self.request_record.id])

        response = self.client.post(url, {"action": "approve"}, format="json")

        self.assertEqual(response.status_code, 200)
        self.request_record.refresh_from_db()
        self.profile.refresh_from_db()
        self.assertEqual(self.request_record.status, VerificationRequest.STATUS_APPROVED)
        self.assertEqual(self.profile.verification_status, "verified")

    def test_rejecting_request_marks_worker_profile_rejected(self):
        url = reverse("verification-request-review", args=[self.request_record.id])

        response = self.client.post(url, {"action": "reject", "review_note": "Please resubmit."}, format="json")

        self.assertEqual(response.status_code, 200)
        self.request_record.refresh_from_db()
        self.profile.refresh_from_db()
        self.assertEqual(self.request_record.status, VerificationRequest.STATUS_REJECTED)
        self.assertEqual(self.profile.verification_status, "rejected")

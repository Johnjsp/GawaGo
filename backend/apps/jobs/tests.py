from unittest.mock import patch

from django.contrib.auth.models import User
from django.core import mail
from django.test import override_settings
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from apps.accounts.models import UserProfile
from apps.common.authentication import create_jwt_token
from apps.jobs.models import JobApplication, JobPosting
from apps.jobs.services import complete_job
from apps.matching.models import RouteDistanceCache
from apps.notifications.models import Notification
from apps.reviews.models import Review


class JobPermissionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.household = User.objects.create_user(username="household1", email="household1@example.com", password="password")
        self.other_household = User.objects.create_user(username="household2", email="household2@example.com", password="password")
        self.worker = User.objects.create_user(username="worker1", email="worker1@example.com", password="password")
        UserProfile.objects.create(user=self.household, role=UserProfile.ROLE_HOUSEHOLD)
        UserProfile.objects.create(user=self.other_household, role=UserProfile.ROLE_HOUSEHOLD)
        UserProfile.objects.create(
            user=self.worker,
            role=UserProfile.ROLE_WORKER,
            verification_status="verified",
        )
        self.job = JobPosting.objects.create(
            household=self.household,
            title="Cleaning help",
            job_type="House Cleaning",
            required_skill="House Cleaning",
            schedule="2026-06-01 09:00",
            location_label="Isabang, Tayabas",
            latitude="13.9622745",
            longitude="121.5632841",
            service_rate="500.00",
        )
        self.application = JobApplication.objects.create(job=self.job, worker=self.worker)

    def test_anonymous_user_cannot_create_job_by_household_username(self):
        response = self.client.post(
            reverse("job-list"),
            {
                "household_username": self.household.username,
                "title": "Impersonated job",
                "job_type": "House Cleaning",
                "required_skill": "House Cleaning",
                "schedule": "2026-06-02 09:00",
                "schedule_type": "One-Time",
                "preferred_date": "2026-06-02",
                "preferred_time": "09:00",
                "location_label": "Isabang, Tayabas",
                "latitude": "13.9622745",
                "longitude": "121.5632841",
                "service_rate": "500.00",
                "worker_slots": 1,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 403)
        self.assertFalse(JobPosting.objects.filter(title="Impersonated job").exists())

    def test_anonymous_job_detail_hides_applications(self):
        response = self.client.get(reverse("job-detail", args=[self.job.id]))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["applications"], [])

    def test_anonymous_job_list_hides_applications(self):
        response = self.client.get(reverse("job-list"))

        self.assertEqual(response.status_code, 200)
        first_job = response.data["results"][0]
        self.assertEqual(first_job["applications"], [])

    def test_job_owner_can_see_applications(self):
        self.client.force_authenticate(user=self.household)

        response = self.client.get(reverse("job-detail", args=[self.job.id]))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["applications"]), 1)
        self.assertEqual(response.data["applications"][0]["worker_username"], self.worker.username)

    def test_worker_job_payload_uses_cached_road_route_distance(self):
        self.worker.profile.latitude = "13.9800000"
        self.worker.profile.longitude = "121.5800000"
        self.worker.profile.save(update_fields=["latitude", "longitude"])

        def fake_road_route(lat1, lon1, lat2, lon2):
            return {
                "distance_km": 6.9,
                "route_points": [[float(lat1), float(lon1)], [13.9700000, 121.5700000], [float(lat2), float(lon2)]],
            }

        self.client.force_authenticate(user=self.worker)
        with patch("apps.matching.services.fetch_road_route", side_effect=fake_road_route) as route_fetch:
            response = self.client.get(reverse("job-detail", args=[self.job.id]))
            second_response = self.client.get(reverse("job-detail", args=[self.job.id]))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(second_response.status_code, 200)
        self.assertEqual(response.data["route_distance_km"], 6.9)
        self.assertEqual(response.data["route_points"][1], [13.97, 121.57])
        self.assertEqual(route_fetch.call_count, 1)
        self.assertEqual(RouteDistanceCache.objects.count(), 1)

    def test_worker_only_sees_own_application_on_job_detail(self):
        second_worker = User.objects.create_user(username="worker-private-other", password="password")
        UserProfile.objects.create(user=second_worker, role=UserProfile.ROLE_WORKER)
        JobApplication.objects.create(job=self.job, worker=second_worker)
        self.client.force_authenticate(user=self.worker)

        response = self.client.get(reverse("job-detail", args=[self.job.id]))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["applications"]), 1)
        self.assertEqual(response.data["applications"][0]["worker_username"], self.worker.username)

    def test_unrelated_household_cannot_see_applications(self):
        self.client.force_authenticate(user=self.other_household)

        response = self.client.get(reverse("job-detail", args=[self.job.id]))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["applications"], [])

    def test_worker_application_list_only_includes_own_applications(self):
        second_worker = User.objects.create_user(username="worker-list-other", password="password")
        UserProfile.objects.create(user=second_worker, role=UserProfile.ROLE_WORKER)
        JobApplication.objects.create(job=self.job, worker=second_worker)
        self.client.force_authenticate(user=self.worker)

        response = self.client.get(reverse("job-application-list"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["worker_username"], self.worker.username)
        self.assertEqual(response.data[0]["job_id"], self.job.id)
        self.assertEqual(response.data[0]["job_title"], self.job.title)

    def test_household_application_list_only_includes_owned_jobs(self):
        other_job = JobPosting.objects.create(
            household=self.other_household,
            title="Other household job",
            job_type="Laundry",
            required_skill="Laundry",
            schedule="2026-06-03 09:00",
            location_label="Alitao, Tayabas",
            latitude="14.0537324",
            longitude="121.5336725",
            service_rate="700.00",
        )
        JobApplication.objects.create(job=other_job, worker=self.worker)
        self.client.force_authenticate(user=self.household)

        response = self.client.get(reverse("job-application-list"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["job_id"], self.job.id)

    def test_anonymous_user_cannot_apply_by_worker_username(self):
        response = self.client.post(
            reverse("job-apply", args=[self.job.id]),
            {"worker_username": self.worker.username},
            format="json",
        )

        self.assertEqual(response.status_code, 403)

    def test_household_cannot_apply_to_job(self):
        self.client.force_authenticate(user=self.household)

        response = self.client.post(reverse("job-apply", args=[self.job.id]), {}, format="json")

        self.assertEqual(response.status_code, 403)

    def test_unverified_worker_cannot_apply_to_job(self):
        unverified_worker = User.objects.create_user(username="worker-unverified-apply", password="password")
        UserProfile.objects.create(
            user=unverified_worker,
            role=UserProfile.ROLE_WORKER,
            verification_status="pending",
        )
        self.client.force_authenticate(user=unverified_worker)

        response = self.client.post(reverse("job-apply", args=[self.job.id]), {}, format="json")

        self.assertEqual(response.status_code, 403)
        self.assertFalse(JobApplication.objects.filter(job=self.job, worker=unverified_worker).exists())

    def test_worker_cannot_apply_to_closed_job(self):
        self.job.status = JobPosting.STATUS_CANCELLED
        self.job.save(update_fields=["status"])
        new_worker = User.objects.create_user(username="worker-closed", password="password")
        UserProfile.objects.create(user=new_worker, role=UserProfile.ROLE_WORKER, verification_status="verified")
        self.client.force_authenticate(user=new_worker)

        response = self.client.post(reverse("job-apply", args=[self.job.id]), {}, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertFalse(JobApplication.objects.filter(job=self.job, worker=new_worker).exists())

    def test_non_owner_cannot_edit_job(self):
        self.client.force_authenticate(user=self.other_household)

        response = self.client.patch(
            reverse("job-detail", args=[self.job.id]),
            {"title": "Changed by another household"},
            format="json",
        )

        self.assertEqual(response.status_code, 403)
        self.job.refresh_from_db()
        self.assertEqual(self.job.title, "Cleaning help")

    def test_non_owner_cannot_delete_job(self):
        self.client.force_authenticate(user=self.other_household)

        response = self.client.delete(reverse("job-detail", args=[self.job.id]))

        self.assertEqual(response.status_code, 403)
        self.assertTrue(JobPosting.objects.filter(pk=self.job.id).exists())

    def test_worker_cannot_create_job(self):
        self.client.force_authenticate(user=self.worker)

        response = self.client.post(
            reverse("job-list"),
            {
                "title": "Worker-created job",
                "job_type": "House Cleaning",
                "required_skill": "House Cleaning",
                "schedule": "2026-06-02 09:00",
                "location_label": "Isabang, Tayabas",
                "latitude": "13.9622745",
                "longitude": "121.5632841",
                "service_rate": "500.00",
                "worker_slots": 1,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 403)
        self.assertFalse(JobPosting.objects.filter(title="Worker-created job").exists())

    def test_household_can_create_job_with_structured_schedule_fields(self):
        self.client.force_authenticate(user=self.household)

        response = self.client.post(
            reverse("job-list"),
            {
                "title": "Structured schedule job",
                "job_type": "House Cleaning",
                "required_skill": "House Cleaning",
                "schedule_type": "One-Time",
                "preferred_date": "2026-06-02",
                "preferred_time": "09:30",
                "location_label": "Isabang, Tayabas",
                "latitude": "13.9622745",
                "longitude": "121.5632841",
                "service_rate": "500.00",
                "worker_slots": 1,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["schedule_type"], "One-Time")
        self.assertEqual(response.data["preferred_date"], "2026-06-02")
        self.assertEqual(response.data["preferred_time"], "09:30:00")
        self.assertEqual(response.data["schedule"], "One-Time on 2026-06-02 at 09:30")
        job = JobPosting.objects.get(title="Structured schedule job")
        self.assertEqual(str(job.preferred_date), "2026-06-02")
        self.assertEqual(job.preferred_time.strftime("%H:%M"), "09:30")

    def test_household_token_repairs_stale_profile_role_when_creating_job(self):
        stale_household = User.objects.create_user(username="stalehousehold", password="password")
        UserProfile.objects.create(user=stale_household, role=UserProfile.ROLE_WORKER)
        token = create_jwt_token(
            {
                "user_id": stale_household.id,
                "username": stale_household.username,
                "role": UserProfile.ROLE_HOUSEHOLD,
            }
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        response = self.client.post(
            reverse("job-list"),
            {
                "title": "Role repair job",
                "job_type": "Painting",
                "required_skill": "Painting",
                "schedule_type": "One-Time",
                "preferred_date": "2026-06-13",
                "preferred_time": "09:09",
                "location_label": "Lalo, Tayabas",
                "latitude": "13.9622745",
                "longitude": "121.5632841",
                "service_rate": "100.00",
                "worker_slots": 1,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        stale_household.profile.refresh_from_db()
        self.assertEqual(stale_household.profile.role, UserProfile.ROLE_HOUSEHOLD)
        self.assertTrue(JobPosting.objects.filter(title="Role repair job", household=stale_household).exists())

    def test_household_cannot_create_job_with_non_open_status(self):
        self.client.force_authenticate(user=self.household)

        response = self.client.post(
            reverse("job-list"),
            {
                "title": "Pre-completed job",
                "job_type": "House Cleaning",
                "required_skill": "House Cleaning",
                "schedule": "2026-06-02 09:00",
                "location_label": "Isabang, Tayabas",
                "latitude": "13.9622745",
                "longitude": "121.5632841",
                "service_rate": "500.00",
                "worker_slots": 1,
                "status": JobPosting.STATUS_COMPLETED,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(JobPosting.objects.filter(title="Pre-completed job").exists())

    def test_open_job_can_be_cancelled_by_owner(self):
        self.client.force_authenticate(user=self.household)

        response = self.client.patch(
            reverse("job-detail", args=[self.job.id]),
            {"status": JobPosting.STATUS_CANCELLED},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.job.refresh_from_db()
        self.assertEqual(self.job.status, JobPosting.STATUS_CANCELLED)

    def test_open_job_cannot_skip_to_completed(self):
        self.client.force_authenticate(user=self.household)

        response = self.client.patch(
            reverse("job-detail", args=[self.job.id]),
            {"status": JobPosting.STATUS_COMPLETED},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.job.refresh_from_db()
        self.assertEqual(self.job.status, JobPosting.STATUS_OPEN)

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_assigned_job_can_be_completed_by_owner(self):
        self.job.status = JobPosting.STATUS_ASSIGNED
        self.job.save(update_fields=["status"])
        self.application.status = JobApplication.STATUS_HIRED
        self.application.save(update_fields=["status"])
        self.client.force_authenticate(user=self.household)

        response = self.client.patch(
            reverse("job-detail", args=[self.job.id]),
            {"status": JobPosting.STATUS_COMPLETED},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.job.refresh_from_db()
        self.application.refresh_from_db()
        self.assertEqual(self.job.status, JobPosting.STATUS_COMPLETED)
        self.assertIsNotNone(self.job.completed_at)
        self.assertEqual(self.application.status, JobApplication.STATUS_COMPLETED)
        self.assertTrue(
            Notification.objects.filter(
                recipient=self.worker,
                notification_type=Notification.TYPE_COMPLETION,
                title="Job completed",
                message__contains=self.job.title,
            ).exists()
        )
        self.assertTrue(
            Notification.objects.filter(
                recipient=self.household,
                notification_type=Notification.TYPE_REVIEW_REMINDER,
                message__contains=self.worker.username,
            ).exists()
        )
        subjects = [message.subject for message in mail.outbox]
        self.assertIn("GawaGo: Job completed", subjects)
        self.assertIn("GawaGo: Review worker service", subjects)

    def test_completion_creates_one_review_reminder_per_completed_worker(self):
        second_worker = User.objects.create_user(username="worker-reminder-2", password="password")
        UserProfile.objects.create(user=second_worker, role=UserProfile.ROLE_WORKER)
        self.job.worker_slots = 2
        self.job.status = JobPosting.STATUS_ASSIGNED
        self.job.save(update_fields=["worker_slots", "status"])
        self.application.status = JobApplication.STATUS_HIRED
        self.application.save(update_fields=["status"])
        JobApplication.objects.create(job=self.job, worker=second_worker, status=JobApplication.STATUS_HIRED)

        complete_job(self.job)

        reminders = Notification.objects.filter(
            recipient=self.household,
            notification_type=Notification.TYPE_REVIEW_REMINDER,
        )
        self.assertEqual(reminders.count(), 2)
        self.assertTrue(reminders.filter(message__contains=self.worker.username).exists())
        self.assertTrue(reminders.filter(message__contains=second_worker.username).exists())

    def test_completion_review_reminders_are_not_duplicated(self):
        self.job.status = JobPosting.STATUS_ASSIGNED
        self.job.save(update_fields=["status"])
        self.application.status = JobApplication.STATUS_HIRED
        self.application.save(update_fields=["status"])

        complete_job(self.job)
        complete_job(self.job)

        self.assertEqual(
            Notification.objects.filter(
                recipient=self.household,
                notification_type=Notification.TYPE_REVIEW_REMINDER,
            ).count(),
            1,
        )

    def test_completion_skips_review_reminder_when_worker_already_rated(self):
        self.job.status = JobPosting.STATUS_ASSIGNED
        self.job.save(update_fields=["status"])
        self.application.status = JobApplication.STATUS_HIRED
        self.application.save(update_fields=["status"])
        Review.objects.create(
            author=self.household,
            target=self.worker,
            author_role=Review.ROLE_HOUSEHOLD,
            target_role=Review.ROLE_WORKER,
            job=self.job,
            job_title=self.job.title,
            rating="5.0",
            feedback="Already reviewed",
        )

        complete_job(self.job)

        self.assertFalse(
            Notification.objects.filter(
                recipient=self.household,
                notification_type=Notification.TYPE_REVIEW_REMINDER,
            ).exists()
        )

    def test_assigned_job_without_hired_workers_cannot_be_completed(self):
        self.job.status = JobPosting.STATUS_ASSIGNED
        self.job.save(update_fields=["status"])
        self.client.force_authenticate(user=self.household)

        response = self.client.patch(
            reverse("job-detail", args=[self.job.id]),
            {"status": JobPosting.STATUS_COMPLETED},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.job.refresh_from_db()
        self.assertEqual(self.job.status, JobPosting.STATUS_ASSIGNED)
        self.assertIsNone(self.job.completed_at)

    def test_completed_job_cannot_be_reopened(self):
        self.job.status = JobPosting.STATUS_COMPLETED
        self.job.save(update_fields=["status"])
        self.client.force_authenticate(user=self.household)

        response = self.client.patch(
            reverse("job-detail", args=[self.job.id]),
            {"status": JobPosting.STATUS_OPEN},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.job.refresh_from_db()
        self.assertEqual(self.job.status, JobPosting.STATUS_COMPLETED)

    def test_anonymous_user_cannot_update_application_status_by_household_username(self):
        response = self.client.patch(
            reverse("job-application-status", args=[self.application.id]),
            {"household_username": self.household.username, "status": JobApplication.STATUS_HIRED},
            format="json",
        )

        self.assertEqual(response.status_code, 403)
        self.application.refresh_from_db()
        self.assertEqual(self.application.status, JobApplication.STATUS_PENDING)

    def test_only_job_owner_can_hire_or_reject(self):
        self.client.force_authenticate(user=self.other_household)

        response = self.client.patch(
            reverse("job-application-status", args=[self.application.id]),
            {"status": JobApplication.STATUS_HIRED},
            format="json",
        )

        self.assertEqual(response.status_code, 403)
        self.application.refresh_from_db()
        self.assertEqual(self.application.status, JobApplication.STATUS_PENDING)

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_job_owner_can_send_hire_request_for_pending_application(self):
        self.client.force_authenticate(user=self.household)

        response = self.client.patch(
            reverse("job-application-status", args=[self.application.id]),
            {"status": JobApplication.STATUS_HIRE_REQUESTED},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.application.refresh_from_db()
        self.job.refresh_from_db()
        self.assertEqual(self.application.status, JobApplication.STATUS_HIRE_REQUESTED)
        self.assertEqual(self.job.status, JobPosting.STATUS_OPEN)
        notification = Notification.objects.get(
            recipient=self.worker,
            notification_type=Notification.TYPE_HIRING,
            title="Hire request",
            message__contains=self.job.title,
        )
        self.assertEqual(notification.related_job_id, self.job.id)
        self.assertEqual(notification.related_application_id, self.application.id)
        self.assertEqual(notification.action_type, Notification.ACTION_HIRE_REQUEST)
        self.assertEqual(mail.outbox[-1].to, [self.worker.email])
        self.assertEqual(mail.outbox[-1].subject, "GawaGo: Hire request")
        self.assertIn(self.job.title, mail.outbox[-1].body)

    def test_job_owner_cannot_hire_unverified_worker(self):
        self.worker.profile.verification_status = "pending"
        self.worker.profile.save(update_fields=["verification_status"])
        self.client.force_authenticate(user=self.household)

        response = self.client.patch(
            reverse("job-application-status", args=[self.application.id]),
            {"status": JobApplication.STATUS_HIRED},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.application.refresh_from_db()
        self.job.refresh_from_db()
        self.assertEqual(self.application.status, JobApplication.STATUS_PENDING)
        self.assertEqual(self.job.status, JobPosting.STATUS_OPEN)

    def test_hiring_respects_worker_slots(self):
        second_worker = User.objects.create_user(username="worker2", password="password")
        UserProfile.objects.create(user=second_worker, role=UserProfile.ROLE_WORKER, verification_status="verified")
        second_application = JobApplication.objects.create(job=self.job, worker=second_worker)
        self.client.force_authenticate(user=self.household)
        self.client.patch(
            reverse("job-application-status", args=[self.application.id]),
            {"status": JobApplication.STATUS_HIRE_REQUESTED},
            format="json",
        )
        self.client.force_authenticate(user=self.worker)
        self.client.patch(
            reverse("job-application-decision", args=[self.application.id]),
            {"decision": "accept"},
            format="json",
        )
        self.client.force_authenticate(user=self.household)

        response = self.client.patch(
            reverse("job-application-status", args=[second_application.id]),
            {"status": JobApplication.STATUS_HIRE_REQUESTED},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        second_application.refresh_from_db()
        self.assertEqual(second_application.status, JobApplication.STATUS_CLOSED)

    def test_finalized_application_cannot_be_changed(self):
        self.application.status = JobApplication.STATUS_REJECTED
        self.application.save(update_fields=["status"])
        self.client.force_authenticate(user=self.household)

        response = self.client.patch(
            reverse("job-application-status", args=[self.application.id]),
            {"status": JobApplication.STATUS_HIRED},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.application.refresh_from_db()
        self.assertEqual(self.application.status, JobApplication.STATUS_REJECTED)

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_owner_can_reject_pending_application(self):
        self.client.force_authenticate(user=self.household)

        response = self.client.patch(
            reverse("job-application-status", args=[self.application.id]),
            {"status": JobApplication.STATUS_REJECTED},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.application.refresh_from_db()
        self.assertEqual(self.application.status, JobApplication.STATUS_REJECTED)
        self.assertTrue(
            Notification.objects.filter(
                recipient=self.worker,
                notification_type=Notification.TYPE_REJECTION,
                title="Application rejected",
                message__contains=self.job.title,
            ).exists()
        )
        self.assertEqual(mail.outbox[-1].to, [self.worker.email])
        self.assertEqual(mail.outbox[-1].subject, "GawaGo: Application rejected")
        self.assertIn(self.job.title, mail.outbox[-1].body)

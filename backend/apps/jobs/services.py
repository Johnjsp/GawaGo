from django.utils import timezone

from apps.jobs.models import JobApplication, JobPosting
from apps.notifications.models import Notification
from apps.notifications.services import create_notification, send_notification_email
from apps.reviews.models import Review


def get_user_display_name(user) -> str:
    return user.get_full_name().strip() or user.username


def create_household_review_reminder(job: JobPosting, application: JobApplication) -> None:
    already_reviewed = Review.objects.filter(
        job=job,
        author=job.household,
        target=application.worker,
        author_role=Review.ROLE_HOUSEHOLD,
        target_role=Review.ROLE_WORKER,
        rating__isnull=False,
    ).exists()
    if already_reviewed:
        return

    worker_name = get_user_display_name(application.worker)
    notification, created = Notification.objects.get_or_create(
        recipient=job.household,
        notification_type=Notification.TYPE_REVIEW_REMINDER,
        title="Review worker service",
        message=f"{job.title} is complete. Please submit feedback for {worker_name}.",
    )
    if created:
        send_notification_email(job.household, notification.title, notification.message)


def complete_job(job: JobPosting) -> JobPosting:
    if job.status != JobPosting.STATUS_COMPLETED:
        job.status = JobPosting.STATUS_COMPLETED
    if job.completed_at is None:
        job.completed_at = timezone.now()
    job.save(update_fields=["status", "completed_at"])

    hired_applications = list(
        job.applications.select_related("worker").filter(status=JobApplication.STATUS_HIRED)
    )
    for application in hired_applications:
        application.status = JobApplication.STATUS_COMPLETED
        application.save(update_fields=["status", "updated_at"])
        create_notification(
            recipient=application.worker,
            notification_type=Notification.TYPE_COMPLETION,
            title="Job completed",
            message=f"{job.title} was marked completed.",
        )

    completed_applications = job.applications.select_related("worker").filter(
        status=JobApplication.STATUS_COMPLETED
    )
    for application in completed_applications:
        create_household_review_reminder(job, application)
    return job

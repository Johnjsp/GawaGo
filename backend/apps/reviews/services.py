from decimal import Decimal

from django.db import IntegrityError
from django.utils import timezone

from apps.accounts.models import UserProfile
from apps.jobs.models import JobApplication, JobPosting
from apps.reviews.models import Review

DEFAULT_NO_FEEDBACK_RATING = Decimal("3.5")
DEFAULT_NO_FEEDBACK_AFTER_HOURS = 72


def recalculate_user_rating(user) -> None:
    profile = getattr(user, "profile", None)
    if not profile or profile.role not in {UserProfile.ROLE_WORKER, UserProfile.ROLE_HOUSEHOLD}:
        return

    ratings = Review.objects.filter(
        target=user,
        rating__isnull=False,
    )
    rating_count = ratings.count()
    if rating_count == 0:
        profile.average_rating = None
        profile.rating_count = 0
    else:
        total_rating = sum((review.rating for review in ratings), Decimal("0.0"))
        profile.average_rating = total_rating / rating_count
        profile.rating_count = rating_count
    profile.save(update_fields=["average_rating", "rating_count"])


def recalculate_worker_rating(worker_user) -> None:
    recalculate_user_rating(worker_user)


def assign_default_worker_ratings(after_hours: int = DEFAULT_NO_FEEDBACK_AFTER_HOURS, dry_run: bool = False) -> int:
    cutoff = timezone.now() - timezone.timedelta(hours=after_hours)
    applications = JobApplication.objects.select_related("job", "job__household", "worker").filter(
        status=JobApplication.STATUS_COMPLETED,
        job__status=JobPosting.STATUS_COMPLETED,
        job__completed_at__isnull=False,
        job__completed_at__lte=cutoff,
    )

    created_count = 0
    for application in applications:
        job = application.job
        already_rated = Review.objects.filter(
            job=job,
            author=job.household,
            target=application.worker,
            author_role=Review.ROLE_HOUSEHOLD,
            target_role=Review.ROLE_WORKER,
            rating__isnull=False,
        ).exists()
        if already_rated:
            continue

        if dry_run:
            created_count += 1
            continue

        try:
            Review.objects.create(
                author=job.household,
                target=application.worker,
                author_role=Review.ROLE_HOUSEHOLD,
                target_role=Review.ROLE_WORKER,
                job=job,
                job_title=job.title,
                rating=DEFAULT_NO_FEEDBACK_RATING,
                feedback="Default 3.5-star rating assigned because no household feedback was submitted after job completion.",
            )
            created_count += 1
        except IntegrityError:
            continue

    return created_count


def assign_due_default_worker_ratings() -> int:
    return assign_default_worker_ratings(after_hours=DEFAULT_NO_FEEDBACK_AFTER_HOURS)

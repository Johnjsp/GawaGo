from django.conf import settings
from django.db import models


class Notification(models.Model):
    TYPE_APPLICATION = "application"
    TYPE_ACCOUNT_ACTIVITY = "account_activity"
    TYPE_ACCEPTED = "accepted"
    TYPE_HIRING = "hiring"
    TYPE_REJECTION = "rejection"
    TYPE_VERIFICATION = "verification"
    TYPE_ANALYTICS = "analytics"
    TYPE_COMPLETION = "completion"
    TYPE_REVIEW_REMINDER = "review_reminder"
    TYPE_CHOICES = [
        (TYPE_APPLICATION, "Application"),
        (TYPE_ACCOUNT_ACTIVITY, "Account Activity"),
        (TYPE_ACCEPTED, "Accepted"),
        (TYPE_HIRING, "Hiring"),
        (TYPE_REJECTION, "Rejection"),
        (TYPE_VERIFICATION, "Verification"),
        (TYPE_ANALYTICS, "Analytics"),
        (TYPE_COMPLETION, "Completion"),
        (TYPE_REVIEW_REMINDER, "Review Reminder"),
    ]

    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    notification_type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.recipient.username}: {self.title}"

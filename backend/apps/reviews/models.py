from django.conf import settings
from django.db import models


class Review(models.Model):
    ROLE_HOUSEHOLD = "household"
    ROLE_WORKER = "worker"
    AUTHOR_ROLE_CHOICES = [
        (ROLE_HOUSEHOLD, "Household"),
        (ROLE_WORKER, "Worker"),
    ]

    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="authored_reviews")
    target = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="received_reviews")
    author_role = models.CharField(max_length=20, choices=AUTHOR_ROLE_CHOICES)
    target_role = models.CharField(max_length=20, choices=AUTHOR_ROLE_CHOICES)
    job_title = models.CharField(max_length=255, blank=True, default="")
    rating = models.DecimalField(max_digits=2, decimal_places=1, null=True, blank=True)
    feedback = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.author.username} -> {self.target.username}"

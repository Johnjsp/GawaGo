from django.conf import settings
from django.db import models


class JobPosting(models.Model):
    STATUS_OPEN = "open"
    STATUS_ASSIGNED = "assigned"
    STATUS_COMPLETED = "completed"
    STATUS_CANCELLED = "cancelled"
    STATUS_CHOICES = [
        (STATUS_OPEN, "Open"),
        (STATUS_ASSIGNED, "Assigned"),
        (STATUS_COMPLETED, "Completed"),
        (STATUS_CANCELLED, "Cancelled"),
    ]

    household = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="job_postings")
    title = models.CharField(max_length=255)
    job_type = models.CharField(max_length=120)
    required_skill = models.CharField(max_length=120)
    schedule = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    location_label = models.CharField(max_length=255)
    latitude = models.DecimalField(max_digits=10, decimal_places=7)
    longitude = models.DecimalField(max_digits=10, decimal_places=7)
    service_rate = models.DecimalField(max_digits=10, decimal_places=2)
    worker_slots = models.PositiveIntegerField(default=1)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_OPEN)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return self.title


class JobApplication(models.Model):
    STATUS_PENDING = "pending"
    STATUS_HIRED = "hired"
    STATUS_REJECTED = "rejected"
    STATUS_CLOSED = "closed"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_HIRED, "Hired"),
        (STATUS_REJECTED, "Rejected"),
        (STATUS_CLOSED, "Closed"),
    ]

    job = models.ForeignKey(JobPosting, on_delete=models.CASCADE, related_name="applications")
    worker = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="job_applications")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    note = models.TextField(blank=True, default="")

    class Meta:
        unique_together = ("job", "worker")
        ordering = ["-applied_at"]

    def __str__(self) -> str:
        return f"{self.worker.username} -> {self.job.title}"

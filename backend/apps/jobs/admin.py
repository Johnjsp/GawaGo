from django.contrib import admin

from apps.jobs.models import JobApplication, JobImage, JobPosting


@admin.register(JobPosting)
class JobPostingAdmin(admin.ModelAdmin):
    list_display = ("title", "household", "job_type", "required_skill", "worker_slots", "status", "created_at")
    list_filter = ("job_type", "status", "created_at")
    search_fields = ("title", "household__username", "required_skill")


@admin.register(JobImage)
class JobImageAdmin(admin.ModelAdmin):
    list_display = ("job", "uploaded_at", "order")
    list_filter = ("uploaded_at",)
    search_fields = ("job__title",)


@admin.register(JobApplication)
class JobApplicationAdmin(admin.ModelAdmin):
    list_display = ("job", "worker", "status", "applied_at", "updated_at")
    list_filter = ("status", "applied_at")
    search_fields = ("job__title", "worker__username")

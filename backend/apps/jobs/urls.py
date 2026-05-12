from django.urls import path

from apps.jobs.views import JobApplicationStatusView, JobApplicationView, JobViewSet

urlpatterns = [
    path("", JobViewSet.as_view({"get": "list", "post": "create"}), name="job-list"),
    path("<int:pk>/", JobViewSet.as_view({"get": "retrieve", "patch": "partial_update", "put": "update", "delete": "destroy"}), name="job-detail"),
    path("<int:job_id>/apply/", JobApplicationView.as_view(), name="job-apply"),
    path("applications/<int:pk>/status/", JobApplicationStatusView.as_view(), name="job-application-status"),
    path("applications/<str:pk>/status/", JobApplicationStatusView.as_view(), name="job-application-status-legacy"),
]

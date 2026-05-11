from django.urls import path

from apps.common.views import VerificationRequestListCreateView, VerificationRequestReviewView


urlpatterns = [
    path("verification-requests/", VerificationRequestListCreateView.as_view(), name="verification-request-list-create"),
    path("verification-requests/<int:pk>/review/", VerificationRequestReviewView.as_view(), name="verification-request-review"),
]

from django.urls import path

from apps.accounts.views import (
    ForgotPasswordRequestView,
    LoginView,
    LogoutView,
    MeProfileView,
    RegisterView,
    ResetPasswordView,
    UserProfileListView,
    VerifyResetTokenView,
    VerifySignupView,
    WorkerAvailabilityView,
)


urlpatterns = [
    path("me/", MeProfileView.as_view(), name="profile-me"),
    path("me/availability/", WorkerAvailabilityView.as_view(), name="worker-availability"),
    path("profiles/", UserProfileListView.as_view(), name="profile-list"),
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("verify-signup/", VerifySignupView.as_view(), name="verify-signup"),
    path("forgot-password/", ForgotPasswordRequestView.as_view(), name="forgot-password"),
    path("verify-reset-token/", VerifyResetTokenView.as_view(), name="verify-reset-token"),
    path("reset-password/", ResetPasswordView.as_view(), name="reset-password"),
]

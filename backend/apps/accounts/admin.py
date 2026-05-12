from django.contrib import admin

from apps.accounts.models import PasswordResetRequest, SignupVerificationRequest, UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "role", "verification_status", "rating_count", "average_rating")
    list_filter = ("role", "verification_status")
    search_fields = ("user__username", "user__email")


@admin.register(PasswordResetRequest)
class PasswordResetRequestAdmin(admin.ModelAdmin):
    list_display = ("user", "email", "created_at", "expires_at", "used_at", "attempts")
    search_fields = ("user__username", "email")


@admin.register(SignupVerificationRequest)
class SignupVerificationRequestAdmin(admin.ModelAdmin):
    list_display = ("user", "email", "created_at", "expires_at", "verified_at")
    search_fields = ("user__username", "email")

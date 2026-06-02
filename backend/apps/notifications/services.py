from django.conf import settings
from django.contrib.auth.models import User
from django.core.mail import send_mail

from apps.notifications.models import Notification


def send_notification_email(recipient: User, title: str, message: str) -> None:
    if not recipient.email:
        return

    body = (
        f"Hello {recipient.get_full_name().strip() or recipient.username},\n\n"
        f"{message}\n\n"
        "You can also view this notification in your GawaGo account."
    )
    send_mail(
        f"GawaGo: {title}",
        body,
        getattr(settings, "DEFAULT_FROM_EMAIL", None),
        [recipient.email],
        fail_silently=True,
    )


def create_notification(
    *,
    recipient: User,
    notification_type: str,
    title: str,
    message: str,
    related_job_id: int | None = None,
    related_application_id: int | None = None,
    action_type: str = Notification.ACTION_NONE,
    send_email: bool = True,
) -> Notification:
    notification = Notification.objects.create(
        recipient=recipient,
        notification_type=notification_type,
        title=title,
        message=message,
        related_job_id=related_job_id,
        related_application_id=related_application_id,
        action_type=action_type or Notification.ACTION_NONE,
    )
    if send_email:
        send_notification_email(recipient, title, message)
    return notification

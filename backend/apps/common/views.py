from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import UserProfile
from apps.accounts.serializers import UserProfileSerializer
from apps.common.models import VerificationRequest
from apps.common.serializers import VerificationRequestCreateSerializer, VerificationRequestSerializer
from apps.notifications.models import Notification
from django.contrib.auth.models import User


class VerificationRequestListCreateView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        requests = VerificationRequest.objects.select_related("worker", "worker__profile").order_by("-submitted_at")
        return Response(VerificationRequestSerializer(requests, many=True).data)

    def post(self, request):
        serializer = VerificationRequestCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        worker_username = serializer.validated_data.get("worker_username") or ""
        if worker_username:
            worker = get_object_or_404(User, username=worker_username)
        elif request.user.is_authenticated:
            worker = request.user
        else:
            return Response({"detail": "worker_username is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not getattr(worker, "profile", None) or worker.profile.role != UserProfile.ROLE_WORKER:
            return Response({"detail": "Only workers can submit verification requests."}, status=status.HTTP_403_FORBIDDEN)
        request_record = VerificationRequest.objects.filter(worker=worker).exclude(status=VerificationRequest.STATUS_REJECTED).order_by("-submitted_at").first()
        if request_record:
            request_record.primary_id_name = serializer.validated_data["primary_id_name"]
            request_record.secondary_doc_name = serializer.validated_data["secondary_doc_name"]
            request_record.primary_id_preview = serializer.validated_data.get("primary_id_preview", "")
            request_record.secondary_doc_preview = serializer.validated_data.get("secondary_doc_preview", "")
            request_record.notes = serializer.validated_data.get("notes", "")
            request_record.status = VerificationRequest.STATUS_PENDING
            request_record.reviewed_at = None
            request_record.review_note = ""
            request_record.save(update_fields=["primary_id_name", "secondary_doc_name", "primary_id_preview", "secondary_doc_preview", "notes", "status", "reviewed_at", "review_note"])
        else:
            request_record = VerificationRequest.objects.create(
                worker=worker,
                primary_id_name=serializer.validated_data["primary_id_name"],
                secondary_doc_name=serializer.validated_data["secondary_doc_name"],
                primary_id_preview=serializer.validated_data.get("primary_id_preview", ""),
                secondary_doc_preview=serializer.validated_data.get("secondary_doc_preview", ""),
                notes=serializer.validated_data.get("notes", ""),
            )
        profile, _ = UserProfile.objects.get_or_create(user=worker, defaults={"role": UserProfile.ROLE_WORKER})
        if profile.verification_status != "pending":
            profile.verification_status = "pending"
            profile.save(update_fields=["verification_status"])
        return Response(
            {
                "verification_request": VerificationRequestSerializer(request_record).data,
                "worker": {
                    "id": worker.id,
                    "username": worker.username,
                    "email": worker.email,
                    "first_name": worker.first_name,
                    "last_name": worker.last_name,
                    "display_name": worker.get_full_name().strip() or worker.username,
                    "is_staff": worker.is_staff,
                    "profile": UserProfileSerializer(profile).data,
                },
            },
            status=status.HTTP_201_CREATED,
        )


class VerificationRequestReviewView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, pk):
        request_record = get_object_or_404(VerificationRequest.objects.select_related("worker"), pk=pk)
        action = request.data.get("action")
        if action == "approve":
            request_record.status = VerificationRequest.STATUS_APPROVED
            request_record.review_note = "Approved by admin review."
            profile_status = "verified"
            notification_title = "Verification approved"
            notification_message = "Your worker account is now Verified."
        elif action == "reject":
            request_record.status = VerificationRequest.STATUS_REJECTED
            request_record.review_note = request.data.get("review_note", "Rejected by admin.")
            profile_status = "rejected"
            notification_title = "Verification rejected"
            notification_message = request_record.review_note
        else:
            return Response({"detail": "Action must be 'approve' or 'reject'."}, status=status.HTTP_400_BAD_REQUEST)
        request_record.reviewed_at = timezone.now()
        request_record.save(update_fields=["status", "review_note", "reviewed_at"])
        profile, _ = UserProfile.objects.get_or_create(user=request_record.worker, defaults={"role": UserProfile.ROLE_WORKER})
        profile.verification_status = profile_status
        profile.save(update_fields=["verification_status"])
        Notification.objects.create(
            recipient=request_record.worker,
            notification_type=Notification.TYPE_VERIFICATION,
            title=notification_title,
            message=notification_message,
        )
        request_data = VerificationRequestSerializer(request_record).data
        request_data["reviewed_by"] = request.data.get("reviewed_by") or request.user.get_full_name().strip() or request.user.username or "System Admin"
        return Response(
            {
                "verification_request": request_data,
                "worker": {
                    "id": request_record.worker.id,
                    "username": request_record.worker.username,
                    "email": request_record.worker.email,
                    "first_name": request_record.worker.first_name,
                    "last_name": request_record.worker.last_name,
                    "display_name": request_record.worker.get_full_name().strip() or request_record.worker.username,
                    "is_staff": request_record.worker.is_staff,
                    "profile": UserProfileSerializer(profile).data,
                },
            }
        )


class VerificationRequestDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        request_record = get_object_or_404(VerificationRequest.objects.select_related("worker", "worker__profile"), pk=pk)
        return Response(
            {
                "verification_request": VerificationRequestSerializer(request_record).data,
                "worker": {
                    "id": request_record.worker.id,
                    "username": request_record.worker.username,
                    "email": request_record.worker.email,
                    "first_name": request_record.worker.first_name,
                    "last_name": request_record.worker.last_name,
                    "display_name": request_record.worker.get_full_name().strip() or request_record.worker.username,
                    "is_staff": request_record.worker.is_staff,
                    "profile": UserProfileSerializer(request_record.worker.profile).data if getattr(request_record.worker, "profile", None) else None,
                },
            }
        )

from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils.timezone import now
from .models import Reminder
from .serializers import ReminderSerializer


class ReminderViewSet(viewsets.ModelViewSet):
    serializer_class = ReminderSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_anonymous:
            return Reminder.objects.none()
        return Reminder.objects.filter(user=user).order_by('-id')

    def perform_create(self, serializer):
        reminder = serializer.save(user=self.request.user)


# DASHBOARD API (OUTSIDE THE CLASS)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def reminder_dashboard_summary(request):
    user = request.user
    today = now().date()

    pending = Reminder.objects.filter(
        user=user,
        is_completed=False,
        due_date__gte=today
    ).count()

    overdue = Reminder.objects.filter(
        user=user,
        is_completed=False,
        due_date__lt=today
    ).count()

    completed = Reminder.objects.filter(
        user=user,
        is_completed=True
    ).count()

    return Response({
        "pending": pending,
        "completed": completed,
        "overdue": overdue
    })


# TEST EMAIL ENDPOINT
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def test_reminder_email(request):
    """Test endpoint to verify reminder email sending works"""
    import logging
    logger = logging.getLogger(__name__)
    
    # Get all reminders for the user
    reminder = Reminder.objects.filter(user=request.user).first()
    
    if not reminder:
        return Response({
            "success": False,
            "message": "No reminders found to test email"
        }, status=400)
    
    from .utils import send_reminder_email
    
    logger.info(f"🧪 Testing email send for Reminder ID {reminder.id}")
    
    try:
        success = send_reminder_email(reminder.id, "Test Alert")
        return Response({
            "success": success,
            "message": f"Email test {'successful' if success else 'failed'} for Reminder: {reminder.title}",
            "reminder_id": reminder.id,
            "reminder_title": reminder.title
        })
    except Exception as e:
        logger.error(f"❌ Email test error: {type(e).__name__}: {str(e)}", exc_info=True)
        return Response({
            "success": False,
            "message": f"Email test failed: {type(e).__name__}: {str(e)}"
        }, status=500)
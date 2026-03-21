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
        serializer.save(user=self.request.user)


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
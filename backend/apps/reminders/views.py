from rest_framework import viewsets

from .models import Reminder
from .serializers import ReminderSerializer


class ReminderViewSet(viewsets.ModelViewSet):
    serializer_class = ReminderSerializer

    def get_queryset(self):
       user = self.request.user

       if user.is_anonymous:
            return Reminder.objects.none() 

       return Reminder.objects.filter(user=user)
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

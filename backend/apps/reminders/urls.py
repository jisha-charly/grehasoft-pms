from rest_framework.routers import DefaultRouter
from django.urls import path

from .views import ReminderViewSet, test_reminder_email

router = DefaultRouter()
router.register(r"reminders", ReminderViewSet, basename="reminder")

urlpatterns = [
    path('reminders/test-email/', test_reminder_email, name='test-reminder-email'),
] + router.urls


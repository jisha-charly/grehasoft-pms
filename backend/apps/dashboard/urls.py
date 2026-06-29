from django.urls import path
from .views import (
    dashboard_stats, 
    quarterly_report, 
    ClientDocumentsListView, 
    ClientNotificationsListView, 
    mark_notification_read,
    mark_all_notifications_read
)

urlpatterns = [
    path("stats/", dashboard_stats),
    path("quarterly-report/", quarterly_report),
    path("documents/", ClientDocumentsListView.as_view()),
    path("client-notifications/", ClientNotificationsListView.as_view()),
    path("client-notifications/mark-all-read/", mark_all_notifications_read),
    path("client-notifications/<int:pk>/mark-read/", mark_notification_read),
]
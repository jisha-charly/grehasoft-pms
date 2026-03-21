from django.urls import path
from .views import dashboard_stats, quarterly_report

urlpatterns = [
    path("stats/", dashboard_stats),
    path("quarterly-report/", quarterly_report),
]
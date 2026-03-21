from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils.timezone import now
from django.db.models import Q
from apps.invoices.models import Invoice
from apps.projects.models import Project, Client
from apps.tasks.models import Task
from apps.reminders.models import Reminder
from datetime import date

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    user = request.user
    today = now().date()

    # Projects where user is involved
    project_queryset = Project.objects.filter(
        Q(created_by=user) |
        Q(project_manager=user) |
        Q(members__user=user)   # IMPORTANT FIX
    ).distinct()
     # Active Clients (clients with active projects)
    active_clients = Client.objects.filter(
        projects__status='in_progress'
    ).distinct().count()
    data = {
        "projects": {
            "active": project_queryset.filter(status='in_progress').count(),
            "completed": project_queryset.filter(status='completed').count(),
            "total": project_queryset.count(),
        },
        "tasks": {
            "completed": Task.objects.filter(status='done').count(),
            "pending": Task.objects.filter(status__in=['todo', 'in_progress']).count(),
        },
        "reminders": {
            "pending": Reminder.objects.filter(is_completed=False, due_date__gte=today).count(),
            "overdue": Reminder.objects.filter(is_completed=False, due_date__lt=today).count(),
            "completed": Reminder.objects.filter(is_completed=True).count(),
        },
        "clients": {
            "active": active_clients
        }
        
    }

    return Response(data)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def quarterly_report(request):
    user = request.user

    # Current quarter dates (example Q2 Apr-Jun)
    start_date = date(date.today().year, 4, 1)
    end_date = date(date.today().year, 6, 30)

    projects = Project.objects.filter(created_at__range=[start_date, end_date])
    tasks = Task.objects.filter(created_at__range=[start_date, end_date])
    completed_tasks = tasks.filter(status='done')

    # Operational efficiency
    efficiency = 0
    if tasks.count() > 0:
        efficiency = int((completed_tasks.count() / tasks.count()) * 100)

    # Revenue growth (example)
    invoices = Invoice.objects.filter(created_at__range=[start_date, end_date])
    revenue = sum(inv.amount for inv in invoices)

    data = {
        "project_summary": projects.filter(status='in_progress').count(),
        "efficiency": efficiency,
        "tasks_created": tasks.count(),
        "tasks_done": completed_tasks.count(),
        "revenue": revenue,
        "satisfaction": 4.5  # later from feedback system
    }

    return Response(data)
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Count, Avg
from apps.projects.models import Project
from apps.tasks.models import Task
from apps.users.models import User
from apps.crm.models import Lead

from core.permissions import HasPermission

class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated, HasPermission]
    required_permission = 'VIEW_DASHBOARD'



    def get(self, request):
        user = request.user
        role_name = getattr(user.role, 'name', None) if hasattr(user, 'role') else None
        
        if role_name == 'TEAM_MEMBER':
            projects_qs = Project.objects.filter(members__user=user)
            tasks_qs = Task.objects.filter(assignments__employee=user)
            
            total_projects = projects_qs.count()
            active_tasks = tasks_qs.exclude(status='done').count()
            total_users = 0
            conversion_rate = 0
            
            avg_completion = projects_qs.aggregate(Avg('progress_percentage'))['progress_percentage__avg'] or 0
            status_dist = tasks_qs.values('status').annotate(count=Count('id'))
        else:
            total_projects = Project.objects.count()
            active_tasks = Task.objects.exclude(status='done').count()
            total_users = User.objects.filter(status='active').count()
            
            # Lead conversion rate
            total_leads = Lead.objects.count()
            converted_leads = Lead.objects.filter(status='converted').count()
            conversion_rate = (converted_leads / total_leads * 100) if total_leads > 0 else 0

            # Avg project completion
            avg_completion = Project.objects.aggregate(Avg('progress_percentage'))['progress_percentage__avg'] or 0

            # Task status distribution
            status_dist = Task.objects.values('status').annotate(count=Count('id'))

        return Response({
            'stats': {
                'total_projects': total_projects,
                'active_tasks': active_tasks,
                'total_users': total_users,
                'conversion_rate': round(conversion_rate, 2),
                'avg_project_completion': round(avg_completion, 2)
            },
            'task_distribution': status_dist
        })

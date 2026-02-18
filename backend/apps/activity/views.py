from rest_framework import viewsets, permissions
from .models import ActivityLog
from .serializers import ActivityLogSerializer

class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Centralized audit trail view. Read-only to preserve integrity.
    """
    queryset = ActivityLog.objects.all()
    serializer_class = ActivityLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = ActivityLog.objects.all()
        project_id = self.request.query_params.get('project_id')
        task_id = self.request.query_params.get('task_id')
        
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        if task_id:
            queryset = queryset.filter(task_id=task_id)
            
        return queryset

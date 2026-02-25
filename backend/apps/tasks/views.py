from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import Task, TaskType, TaskFile, TaskComment, TaskReview, TaskProgress
from .serializers import TaskSerializer, TaskTypeSerializer, TaskFileSerializer, TaskCommentSerializer, TaskReviewSerializer
from apps.activity.utils import log_system_activity
from core.permissions import IsProjectManager

class TaskTypeViewSet(viewsets.ModelViewSet):
    queryset = TaskType.objects.all()
    serializer_class = TaskTypeSerializer
    permission_classes = [permissions.IsAuthenticated]

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        project_id = self.request.query_params.get('project_id')
        
        queryset = self.queryset
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        
        if user.role.name in ['SUPER_ADMIN', 'PROJECT_MANAGER']:
            return queryset
        
        # Team members see tasks in projects they are part of
        return queryset.filter(project__members__user=user)

    def perform_create(self, serializer):
        task = serializer.save(created_by=self.request.user)
        log_system_activity(
            user=self.request.user,
            project=task.project,
            task=task,
            action=f"Created task: {task.title}"
        )

class TaskFileViewSet(viewsets.ModelViewSet):
    queryset = TaskFile.objects.all()
    serializer_class = TaskFileSerializer
    permission_classes = [permissions.IsAuthenticated]

class TaskCommentViewSet(viewsets.ModelViewSet):
    queryset = TaskComment.objects.all()
    serializer_class = TaskCommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class TaskReviewViewSet(viewsets.ModelViewSet):
    queryset = TaskReview.objects.all()
    serializer_class = TaskReviewSerializer
    permission_classes = [IsProjectManager]

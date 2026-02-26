from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import Task, TaskType, TaskFile, TaskComment, TaskReview, TaskProgress
from .serializers import TaskSerializer, TaskTypeSerializer, TaskFileSerializer, TaskCommentSerializer, TaskReviewSerializer
from apps.activity.utils import log_system_activity
from core.permissions import IsProjectManager
from django.db import IntegrityError
class TaskTypeViewSet(viewsets.ModelViewSet):
    queryset = TaskType.objects.all()
    serializer_class = TaskTypeSerializer

    def create(self, request, *args, **kwargs):
        name = request.data.get("name", "").upper().strip()
        description = request.data.get("description", "")

        if not name:
            return Response(
                {"error": "Name is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check including soft deleted
        existing = TaskType.all_objects.filter(name=name).first()

        if existing:
            # 🔁 If soft deleted → restore
            if existing.deleted_at is not None:
                existing.deleted_at = None
                existing.description = description
                existing.save()

                serializer = self.get_serializer(existing)
                return Response(
                    {"data": serializer.data, "restored": True},
                    status=status.HTTP_200_OK
                )

            # ❌ Already active
            return Response(
                {"error": "Task type already exists."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ✅ Create new
        task_type = TaskType.objects.create(
            name=name,
            description=description
        )

        serializer = self.get_serializer(task_type)
        return Response(
            {"data": serializer.data, "created": True},
            status=status.HTTP_201_CREATED
        )

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

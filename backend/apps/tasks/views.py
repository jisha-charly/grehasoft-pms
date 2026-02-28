from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import Task, TaskType, TaskFile, TaskComment, TaskReview, TaskProgress
from .serializers import TaskSerializer, TaskTypeSerializer, TaskFileSerializer, TaskCommentSerializer, TaskReviewSerializer
from apps.activity.utils import log_system_activity
from core.permissions import IsProjectManager
from django.db import IntegrityError
from rest_framework.permissions import IsAuthenticated
from apps.projects.utils import log_system_activity
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.exceptions import PermissionDenied
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
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        project_id = self.request.query_params.get('project')

        queryset = Task.objects.all()

        # Filter by project
        if self.action == 'list' and project_id:
            queryset = queryset.filter(project_id=project_id)

        # Role-based filtering
        if user.role.name in ['SUPER_ADMIN', 'PROJECT_MANAGER']:
            return queryset

        return queryset.filter(project__members__user=user)

    def perform_create(self, serializer):
        task = serializer.save(created_by=self.request.user)
        log_system_activity(
            user=self.request.user,
            project=task.project,
            action=f"Created task: {task.title}"
        )

    def perform_update(self, serializer):
        task = serializer.save()
        log_system_activity(
            user=self.request.user,
            project=task.project,
            action=f"Updated task: {task.title}"
        )

    def perform_destroy(self, instance):
        log_system_activity(
            user=self.request.user,
            project=instance.project,
            action=f"Deleted task: {instance.title}"
        )
        instance.delete()
class TaskFileViewSet(viewsets.ModelViewSet):
    queryset = TaskFile.objects.all()
    serializer_class = TaskFileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]  # ✅ IMPORTANT

class TaskCommentViewSet(viewsets.ModelViewSet):
    queryset = TaskComment.objects.all()
    serializer_class = TaskCommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class TaskReviewViewSet(viewsets.ModelViewSet):
    queryset = TaskReview.objects.all()
    serializer_class = TaskReviewSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(reviewer=self.request.user)

    def get_queryset(self):
     queryset = super().get_queryset()
     task_id = self.request.query_params.get("task")

     if task_id:
      queryset = queryset.filter(task_file__task=task_id)

     return queryset
    def perform_update(self, serializer):
        if self.request.user != serializer.instance.reviewer:
            raise PermissionDenied("You can edit only your own review.")
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user != instance.reviewer:
            raise PermissionDenied("You can delete only your own review.")
        instance.delete()
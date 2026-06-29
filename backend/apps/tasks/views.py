from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import Task, TaskType, TaskFile, TaskComment, TaskReview, TaskProgress
from .serializers import TaskSerializer, TaskTypeSerializer, TaskFileSerializer, TaskCommentSerializer, TaskReviewSerializer
from apps.activity.utils import log_system_activity
from core.permissions import HasPermission
from django.db import IntegrityError
from rest_framework.permissions import IsAuthenticated
from apps.projects.utils import log_system_activity, log_failed_attempt
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.exceptions import PermissionDenied
class TaskTypeViewSet(viewsets.ModelViewSet):
    queryset = TaskType.objects.all()
    serializer_class = TaskTypeSerializer
    permission_classes = [HasPermission]
    required_permission = 'VIEW_TASKS'

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
    permission_classes = [HasPermission]
    required_permission = 'VIEW_TASKS'

    def get_queryset(self):
        user = self.request.user
        project_id = self.request.query_params.get('project')

        queryset = Task.objects.all()

        # Filter by project
        if self.action == 'list' and project_id:
            queryset = queryset.filter(project_id=project_id)

        role_name = getattr(user.role, 'name', None) if hasattr(user, 'role') else None
        if role_name == 'SUPER_ADMIN' or role_name == 'PROJECT_MANAGER':
            return queryset
        if role_name == 'CLIENT':
            client = user.get_associated_client()
            if client:
                return queryset.filter(project__client=client)
            return queryset.none()

        return queryset.filter(project__members__user=user)

    def check_permissions(self, request):
        super().check_permissions(request)
        role_name = getattr(request.user.role, 'name', None) if hasattr(request.user, 'role') else None
        if role_name == 'CLIENT' and request.method not in permissions.SAFE_METHODS:
            log_failed_attempt(request.user, f"Tried to write task via {request.method}")
            self.permission_denied(request, message="Clients do not have permission to modify task data.")

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
    permission_classes = [HasPermission]
    required_permission = 'VIEW_TASKS'
    parser_classes = [MultiPartParser, FormParser]  # ✅ IMPORTANT

    def get_queryset(self):
        user = self.request.user
        role_name = getattr(user.role, 'name', None) if hasattr(user, 'role') else None
        queryset = super().get_queryset()
        
        if role_name == 'CLIENT':
            client = user.get_associated_client()
            if client:
                queryset = queryset.filter(task__project__client=client)
            else:
                queryset = queryset.none()

        task_id = self.request.query_params.get("task")
        if task_id:
            queryset = queryset.filter(task_id=task_id)
        return queryset

    def check_permissions(self, request):
        super().check_permissions(request)
        role_name = getattr(request.user.role, 'name', None) if hasattr(request.user, 'role') else None
        if role_name == 'CLIENT' and request.method not in permissions.SAFE_METHODS:
            log_failed_attempt(request.user, f"Tried to write task file via {request.method}")
            self.permission_denied(request, message="Clients do not have permission to modify task files.")

class TaskCommentViewSet(viewsets.ModelViewSet):
    queryset = TaskComment.objects.all()
    serializer_class = TaskCommentSerializer
    permission_classes = [HasPermission]
    required_permission = 'VIEW_TASKS'

    def get_queryset(self):
        user = self.request.user
        role_name = getattr(user.role, 'name', None) if hasattr(user, 'role') else None
        queryset = super().get_queryset()
        
        if role_name == 'CLIENT':
            client = user.get_associated_client()
            if client:
                queryset = queryset.filter(task__project__client=client)
            else:
                queryset = queryset.none()

        task_id = self.request.query_params.get("task")
        if task_id:
            queryset = queryset.filter(task_id=task_id)
        return queryset

    def check_permissions(self, request):
        super().check_permissions(request)
        role_name = getattr(request.user.role, 'name', None) if hasattr(request.user, 'role') else None
        if role_name == 'CLIENT':
            if request.method not in permissions.SAFE_METHODS and self.action != 'create':
                log_failed_attempt(request.user, f"Tried to edit/delete task comment via {request.method}")
                self.permission_denied(request, message="Clients do not have permission to edit or delete comments.")

    def perform_create(self, serializer):
        user = self.request.user
        role_name = getattr(user.role, 'name', None) if hasattr(user, 'role') else None
        task = serializer.validated_data.get('task')
        if role_name == 'CLIENT':
            client = user.get_associated_client()
            if not client or task.project.client != client:
                log_failed_attempt(user, f"Tried to comment on Task ID {task.id} (owned by another client)")
                raise PermissionDenied("You can only comment on tasks of your own projects.")
        
        comment = serializer.save(user=user)
        
        # Audit logging
        from apps.activity.models import ActivityLog
        ActivityLog.objects.create(
            user=user,
            project=task.project,
            task=task,
            action=f"Added comment on task '{task.title}'"
        )

class TaskReviewViewSet(viewsets.ModelViewSet):
    queryset = TaskReview.objects.all()
    serializer_class = TaskReviewSerializer
    permission_classes = [HasPermission]
    required_permission = 'VIEW_TASKS'

    def get_queryset(self):
        user = self.request.user
        role_name = getattr(user.role, 'name', None) if hasattr(user, 'role') else None
        queryset = super().get_queryset()
        
        if role_name == 'CLIENT':
            return queryset.none()

        task_id = self.request.query_params.get("task")
        if task_id:
            queryset = queryset.filter(task_file__task=task_id)
        return queryset

    def check_permissions(self, request):
        super().check_permissions(request)
        role_name = getattr(request.user.role, 'name', None) if hasattr(request.user, 'role') else None
        if role_name == 'CLIENT' and request.method not in permissions.SAFE_METHODS:
            log_failed_attempt(request.user, f"Tried to write task review via {request.method}")
            self.permission_denied(request, message="Clients do not have permission to modify task reviews.")

    def perform_create(self, serializer):
        user = self.request.user
        role_map = {
            'SUPER_ADMIN': 'ADMIN',
            'PROJECT_MANAGER': 'PM'
        }
        role_name = getattr(user.role, 'name', None) if hasattr(user, 'role') else None
        reviewed_by_role = role_map.get(role_name)
        if not reviewed_by_role:
            raise PermissionDenied("Only SUPER_ADMIN and PROJECT_MANAGER can review files.")

        task_file = serializer.validated_data.get('task_file')
        existing_reviews = TaskReview.objects.filter(task_file=task_file).count()
        
        serializer.save(
            reviewer=user,
            reviewed_by_role=reviewed_by_role,
            review_version=existing_reviews + 1
        )

    def perform_update(self, serializer):
        if self.request.user != serializer.instance.reviewer:
            raise PermissionDenied("You can edit only your own review.")
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user != instance.reviewer:
            raise PermissionDenied("You can delete only your own review.")
        instance.delete()
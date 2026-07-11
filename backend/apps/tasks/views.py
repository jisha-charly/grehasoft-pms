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
from rest_framework.decorators import action
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

    def paginate_queryset(self, queryset):
        if self.request.query_params.get('project') or self.request.query_params.get('all') == 'true':
            return None
        return super().paginate_queryset(queryset)

    def check_permissions(self, request):
        super().check_permissions(request)
        role_name = getattr(request.user.role, 'name', None) if hasattr(request.user, 'role') else None
        if role_name == 'CLIENT' and request.method not in permissions.SAFE_METHODS:
            log_failed_attempt(request.user, f"Tried to write task via {request.method}")
            self.permission_denied(request, message="Clients do not have permission to modify task data.")
        if role_name == 'TEAM_MEMBER':
            if self.action in ['create', 'destroy']:
                self.permission_denied(request, message="Team Members do not have permission to create or delete tasks.")

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        role_name = getattr(request.user.role, 'name', None) if hasattr(request.user, 'role') else None
        if role_name == 'TEAM_MEMBER':
            if request.method not in permissions.SAFE_METHODS:
                # 1. Must be assigned to the task
                is_assigned = obj.assignments.filter(employee=request.user).exists()
                if not is_assigned:
                    from rest_framework.exceptions import PermissionDenied
                    raise PermissionDenied("You can only modify tasks assigned to you.")
                # 2. Can only update status and progress_percentage
                allowed_fields = {'status', 'progress_percentage'}
                payload_keys = set(request.data.keys())
                unauthorized_fields = payload_keys - allowed_fields
                if unauthorized_fields:
                    from rest_framework.exceptions import PermissionDenied
                    raise PermissionDenied(
                        f"Team Members can only update status and progress. Unauthorized fields: {', '.join(unauthorized_fields)}"
                    )

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
        elif role_name not in ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'SALES_MANAGER']:
            # Non-client, non-admin users must belong to the project members/PM/creator
            from django.db.models import Q
            queryset = queryset.filter(
                Q(task__project__members__user=user) |
                Q(task__project__project_manager=user) |
                Q(task__project__created_by=user)
            ).distinct()

        task_id = self.request.query_params.get("task")
        if task_id:
            queryset = queryset.filter(task_id=task_id)
        return queryset

    def check_permissions(self, request):
        super().check_permissions(request)
        role_name = getattr(request.user.role, 'name', None) if hasattr(request.user, 'role') else None
        
        if role_name == 'CLIENT':
            if request.method not in permissions.SAFE_METHODS:
                log_failed_attempt(request.user, f"Tried to write task file via {request.method}")
                self.permission_denied(request, message="Clients do not have permission to modify task files.")
        elif role_name not in ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'SALES_MANAGER']:
            if request.method not in permissions.SAFE_METHODS and self.action == 'create':
                task_id = request.data.get('task')
                if task_id:
                    from apps.tasks.models import Task
                    from rest_framework.exceptions import PermissionDenied
                    try:
                        task = Task.objects.get(id=task_id)
                        is_pm = task.project.project_manager == request.user or task.project.created_by == request.user
                        is_member = task.project.members.filter(user=request.user).exists()
                        if not is_pm and not is_member:
                            raise PermissionDenied("You are not a member of the project for this task.")
                    except Task.DoesNotExist:
                        pass

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        role_name = getattr(request.user.role, 'name', None) if hasattr(request.user, 'role') else None
        
        if role_name == 'CLIENT':
            client = request.user.get_associated_client()
            if not client or obj.task.project.client != client:
                self.permission_denied(request, message="Clients do not have access to this file.")
        elif role_name not in ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'SALES_MANAGER']:
            task = obj.task
            is_pm = task.project.project_manager == request.user or task.project.created_by == request.user
            is_member = task.project.members.filter(user=request.user).exists()
            is_uploader = obj.uploaded_by == request.user
            if not is_pm and not is_member and not is_uploader:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You do not have access to this file.")

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        task_file = self.get_object()
        if not task_file.file or not task_file.file.storage.exists(task_file.file.name):
            from django.http import Http404
            raise Http404("Physical file does not exist on disk.")
        
        from django.http import FileResponse
        response = FileResponse(task_file.file.open(), content_type=task_file.file_type)
        response['Content-Disposition'] = f'attachment; filename="{task_file.file_path}"'
        return response

    @action(detail=True, methods=['get'])
    def preview(self, request, pk=None):
        task_file = self.get_object()
        if not task_file.file or not task_file.file.storage.exists(task_file.file.name):
            from django.http import Http404
            raise Http404("Physical file does not exist on disk.")
        
        from django.http import FileResponse
        response = FileResponse(task_file.file.open(), content_type=task_file.file_type)
        response['Content-Disposition'] = f'inline; filename="{task_file.file_path}"'
        return response


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

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        role_name = getattr(request.user.role, 'name', None) if hasattr(request.user, 'role') else None
        if request.method not in permissions.SAFE_METHODS:
            if role_name not in ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER']:
                if obj.user != request.user:
                    from rest_framework.exceptions import PermissionDenied
                    raise PermissionDenied("You can only modify or delete your own comments.")

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
        if request.method not in permissions.SAFE_METHODS:
            self.required_permission = 'MANAGE_PROJECTS'
        else:
            self.required_permission = 'VIEW_TASKS'
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
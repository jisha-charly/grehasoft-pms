from rest_framework import viewsets, permissions
from .models import Project, Client,Milestone,ProjectMember,ActivityLog
from rest_framework.permissions import IsAuthenticated
from .serializers import ProjectSerializer, ClientSerializer
from core.permissions import HasPermission
from .serializers import (
    MilestoneSerializer,
    ProjectMemberSerializer,
    ActivityLogSerializer
)
from .utils  import log_system_activity, log_failed_attempt
from rest_framework.exceptions import PermissionDenied


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [HasPermission]
    required_permission = 'VIEW_PROJECTS'
   
    def get_queryset(self):
        user = self.request.user
        role_name = getattr(user.role, 'name', None) if hasattr(user, 'role') else None
        
        base_qs = Project.objects.select_related(
            "client", "project_manager", "department"
        ).prefetch_related(
            "milestones", "members", "members__user", "tasks"
        )
        
        if role_name == 'SUPER_ADMIN' or user.is_superuser:
            return base_qs.all()
        if role_name == 'CLIENT':
            client = user.get_associated_client()
            if client:
                return base_qs.filter(client=client)
            return Project.objects.none()
        return base_qs.filter(members__user=user)

    def check_permissions(self, request):
        super().check_permissions(request)
        role_name = getattr(request.user.role, 'name', None) if hasattr(request.user, 'role') else None
        if role_name == 'CLIENT' and request.method not in permissions.SAFE_METHODS:
            log_failed_attempt(request.user, f"Tried to write on projects via {request.method}")
            self.permission_denied(request, message="Clients do not have permission to modify project data.")

class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    permission_classes = [HasPermission]
    required_permission = 'VIEW_CLIENTS'

    def get_queryset(self):
        user = self.request.user
        role_name = getattr(user.role, 'name', None) if hasattr(user, 'role') else None
        if role_name == 'CLIENT':
            client = user.get_associated_client()
            if client:
                return Client.objects.filter(id=client.id)
            return Client.objects.none()
        return Client.objects.all()

    def check_permissions(self, request):
        super().check_permissions(request)
        role_name = getattr(request.user.role, 'name', None) if hasattr(request.user, 'role') else None
        if role_name == 'CLIENT':
            if request.method not in permissions.SAFE_METHODS:
                if request.method in ['PUT', 'PATCH'] and self.action in ['update', 'partial_update']:
                    pass
                else:
                    log_failed_attempt(request.user, f"Tried to write clients model via {request.method}")
                    self.permission_denied(request, message="Clients do not have permission to modify this data.")

    def update(self, request, *args, **kwargs):
        user = request.user
        role_name = getattr(user.role, 'name', None) if hasattr(user, 'role') else None
        if role_name == 'CLIENT':
            instance = self.get_object()
            client = user.get_associated_client()
            if not client or instance.id != client.id:
                log_failed_attempt(user, f"Tried to edit Client ID {instance.id} (owned by {instance.email})")
                raise PermissionDenied("You can only modify your own client record.")
            allowed_fields = ['phone']
            for field in request.data.keys():
                if field not in allowed_fields:
                    log_failed_attempt(user, f"Tried to edit Client field '{field}'")
                    raise PermissionDenied(f"Clients cannot modify the field '{field}'.")
            
            # Audit log
            from apps.activity.models import ActivityLog
            ActivityLog.objects.create(user=user, action="Updated phone number in profile")

        return super().update(request, *args, **kwargs)
   
    def list(self, request, *args, **kwargs):
        if request.query_params.get('all') == 'true':
            from rest_framework.response import Response
            user = request.user
            role_name = getattr(user.role, 'name', None) if hasattr(user, 'role') else None
            is_admin_or_manager = getattr(user, 'is_superuser', False) or role_name in ['SUPER_ADMIN', 'SEO_MANAGER', 'PROJECT_MANAGER', 'SALES_MANAGER']
            
            if is_admin_or_manager:
                clients_qs = Client.objects.all()
            else:
                clients_qs = Client.objects.filter(projects__members__user=user).distinct()
            
            clients_data = []
            for c in clients_qs:
                company = c.company_name.strip() if c.company_name else None
                contact = c.name.strip() if c.name else None
                display_name = company or contact or f"Client #{c.id}"
                
                clients_data.append({
                    "id": c.id,
                    "company_name": display_name,
                    "contact_person": contact
                })
            
            clients_data.sort(key=lambda x: x["company_name"].lower())
            return Response(clients_data)
            
        return super().list(request, *args, **kwargs)

    def perform_create(self, serializer):
     serializer.save()

class MilestoneViewSet(viewsets.ModelViewSet):
    queryset = Milestone.objects.all()
    serializer_class = MilestoneSerializer
    permission_classes = [HasPermission]
    required_permission = 'VIEW_PROJECTS'

    def get_queryset(self):
        user = self.request.user
        role_name = getattr(user.role, 'name', None) if hasattr(user, 'role') else None
        if role_name == 'CLIENT':
            client = user.get_associated_client()
            if client:
                return Milestone.objects.filter(project__client=client)
            return Milestone.objects.none()
        return Milestone.objects.all()

    def check_permissions(self, request):
        super().check_permissions(request)
        role_name = getattr(request.user.role, 'name', None) if hasattr(request.user, 'role') else None
        if role_name == 'CLIENT' and request.method not in permissions.SAFE_METHODS:
            log_failed_attempt(request.user, f"Tried to write milestone via {request.method}")
            self.permission_denied(request, message="Clients do not have permission to modify milestones.")

    def perform_create(self, serializer):
        milestone = serializer.save()
        log_system_activity(
            user=self.request.user,
            project=milestone.project,
            action=f"Created milestone: {milestone.title}"
        )

    def perform_update(self, serializer):
        milestone = serializer.save()
        log_system_activity(
            user=self.request.user,
            project=milestone.project,
            action=f"Updated milestone: {milestone.title}"
        )

    def perform_destroy(self, instance):
        log_system_activity(
            user=self.request.user,
            project=instance.project,
            action=f"Deleted milestone: {instance.title}"
        )
        instance.delete()


class ProjectMemberViewSet(viewsets.ModelViewSet):
    queryset = ProjectMember.objects.all()
    serializer_class = ProjectMemberSerializer
    permission_classes = [HasPermission]
    required_permission = 'MANAGE_PROJECTS'

    def get_queryset(self):
        user = self.request.user
        role_name = getattr(user.role, 'name', None) if hasattr(user, 'role') else None
        if role_name == 'CLIENT':
            return ProjectMember.objects.none()
        return ProjectMember.objects.all()

    def check_permissions(self, request):
        super().check_permissions(request)
        role_name = getattr(request.user.role, 'name', None) if hasattr(request.user, 'role') else None
        if role_name == 'CLIENT' and request.method not in permissions.SAFE_METHODS:
            log_failed_attempt(request.user, f"Tried to write project member via {request.method}")
            self.permission_denied(request, message="Clients do not have permission to modify project members.")

    def perform_create(self, serializer):
        member = serializer.save()
        log_system_activity(
            user=self.request.user,
            project=member.project,
            action=f"Added member: {member.user.name}"
        )

    def perform_update(self, serializer):
        member = serializer.save()
        log_system_activity(
            user=self.request.user,
            project=member.project,
            action=f"Updated role of {member.user.name}"
        )

    def perform_destroy(self, instance):
        log_system_activity(
            user=self.request.user,
            project=instance.project,
            action=f"Removed member: {instance.user.name}"
        )
        instance.delete()


class ActivityLogViewSet(viewsets.ModelViewSet):
    queryset = ActivityLog.objects.all().order_by('-created_at')
    serializer_class = ActivityLogSerializer
    permission_classes = [HasPermission]
    required_permission = 'VIEW_PROJECTS'

    def get_queryset(self):
        user = self.request.user
        role_name = getattr(user.role, 'name', None) if hasattr(user, 'role') else None
        queryset = ActivityLog.objects.all().order_by('-created_at')
        
        if role_name == 'CLIENT':
            client = user.get_associated_client()
            if client:
                queryset = queryset.filter(project__client=client)
            else:
                queryset = queryset.none()

        project_id = self.request.query_params.get('project')
        if project_id:
            queryset = queryset.filter(project_id=project_id)

        return queryset

    def check_permissions(self, request):
        super().check_permissions(request)
        role_name = getattr(request.user.role, 'name', None) if hasattr(request.user, 'role') else None
        if role_name == 'CLIENT' and request.method not in permissions.SAFE_METHODS:
            log_failed_attempt(request.user, f"Tried to write activity log via {request.method}")
            self.permission_denied(request, message="Clients do not have permission to modify activity logs.")
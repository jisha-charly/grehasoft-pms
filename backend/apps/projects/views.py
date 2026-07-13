from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
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
        if request.method not in permissions.SAFE_METHODS:
            self.required_permission = 'MANAGE_PROJECTS'
        else:
            self.required_permission = 'VIEW_PROJECTS'
        super().check_permissions(request)
        role_name = getattr(request.user.role, 'name', None) if hasattr(request.user, 'role') else None
        if role_name == 'CLIENT' and request.method not in permissions.SAFE_METHODS:
            self.permission_denied(request, message="Clients do not have permission to modify project data.")

    @action(detail=True, methods=['get'], url_path='members')
    def members(self, request, pk=None):
        project = self.get_object()
        from apps.users.serializers import MinimalUserSerializer
        from .models import ProjectMember
        members = ProjectMember.objects.filter(project=project, user__is_active=True).select_related('user')
        users = [m.user for m in members]
        serializer = MinimalUserSerializer(users, many=True)
        return Response(serializer.data)

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

    @action(detail=True, methods=['get'], url_path='projects')
    def get_projects(self, request, pk=None):
        client = self.get_object()
        
        user = request.user
        role_name = getattr(user.role, 'name', None) if hasattr(user, 'role') else None
        if role_name == 'CLIENT':
            associated_client = user.get_associated_client()
            if not associated_client or associated_client.id != client.id:
                raise PermissionDenied("You do not have permission to view projects for this client.")
                
        projects = Project.objects.filter(client=client)
        from apps.seo.models import Website
        websites = Website.objects.filter(client=client)
        
        results = []
        for p in projects:
            results.append({
                "id": f"project_{p.id}",
                "name": p.name,
                "type": "standard",
                "description": p.name,
                "rate": 0,
            })
            
        for w in websites:
            plan_prices = {
                "basic": 5000,
                "standard": 10000,
                "premium": 20000,
                "custom": 0
            }
            plan_price = plan_prices.get(w.package_plan.lower(), 0)
            results.append({
                "id": f"seo_{w.id}",
                "name": f"SEO - {w.website_name}",
                "type": "seo",
                "description": f"Monthly SEO Services - {w.website_name}",
                "rate": plan_price,
            })
            
        return Response(results)

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=True, methods=['post'], url_path='create-portal-account')
    def create_portal_account(self, request, pk=None):
        client = self.get_object()
        username = request.data.get('username')
        password = request.data.get('password')
        name = request.data.get('name') or client.name
        email = request.data.get('email') or client.email
        
        if not username or not password:
            return Response({"error": "Username and password are required."}, status=status.HTTP_400_BAD_REQUEST)
            
        from apps.users.models import User, Role
        
        # Check if username is already taken
        if User.objects.filter(username=username).exists():
            return Response({"error": "This username is already taken."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Check if email is already taken
        if User.objects.filter(email=email).exists():
            return Response({"error": "A user with this email address already exists."}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            client_role = Role.objects.get(name='CLIENT')
        except Role.DoesNotExist:
            return Response({"error": "CLIENT role does not exist in the system."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        user = User.objects.create(
            username=username,
            name=name,
            email=email,
            role=client_role,
            client=client,
            status='active'
        )
        user.set_password(password)
        user.save()
        
        return Response({"status": "success", "user_id": user.id, "username": user.username})

    @action(detail=True, methods=['post'], url_path='reset-portal-user-password')
    def reset_portal_user_password(self, request, pk=None):
        client = self.get_object()
        user_id = request.data.get('user_id')
        new_password = request.data.get('password')
        if not user_id or not new_password:
            return Response({"error": "User ID and new password are required."}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            portal_user = client.portal_users.get(id=user_id)
        except Exception:
            return Response({"error": "Portal user not found for this client."}, status=status.HTTP_404_NOT_FOUND)
            
        portal_user.set_password(new_password)
        portal_user.save()
        return Response({"status": "success", "message": "Password reset successfully."})

    @action(detail=True, methods=['post'], url_path='toggle-portal-user-status')
    def toggle_portal_user_status(self, request, pk=None):
        client = self.get_object()
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({"error": "User ID is required."}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            portal_user = client.portal_users.get(id=user_id)
        except Exception:
            return Response({"error": "Portal user not found for this client."}, status=status.HTTP_404_NOT_FOUND)
            
        # Toggle is_active
        portal_user.is_active = not portal_user.is_active
        portal_user.save()
        return Response({"status": "success", "is_active": portal_user.is_active})

    @action(detail=True, methods=['post'], url_path='edit-portal-user-username')
    def edit_portal_user_username(self, request, pk=None):
        client = self.get_object()
        user_id = request.data.get('user_id')
        new_username = request.data.get('username')
        if not user_id or not new_username:
            return Response({"error": "User ID and new username are required."}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            portal_user = client.portal_users.get(id=user_id)
        except Exception:
            return Response({"error": "Portal user not found for this client."}, status=status.HTTP_404_NOT_FOUND)
            
        # Check uniqueness of new username
        from apps.users.models import User
        if User.objects.filter(username=new_username).exclude(id=user_id).exists():
            return Response({"error": "This username is already taken."}, status=status.HTTP_400_BAD_REQUEST)
            
        portal_user.username = new_username
        portal_user.save()
        return Response({"status": "success", "username": portal_user.username})

    @action(detail=True, methods=['post'], url_path='delete-portal-user')
    def delete_portal_user(self, request, pk=None):
        client = self.get_object()
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({"error": "User ID is required."}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            portal_user = client.portal_users.get(id=user_id)
        except Exception:
            return Response({"error": "Portal user not found for this client."}, status=status.HTTP_404_NOT_FOUND)
            
        portal_user.delete()
        return Response({"status": "success", "message": "Portal user deleted successfully."})

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
                queryset = Milestone.objects.filter(project__client=client)
            else:
                queryset = Milestone.objects.none()
        elif role_name == 'TEAM_MEMBER':
            queryset = Milestone.objects.filter(project__members__user=user).distinct()
        else:
            queryset = Milestone.objects.all()

        project_id = self.request.query_params.get('project')
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        return queryset

    def paginate_queryset(self, queryset):
        if self.request.query_params.get('project'):
            return None
        return super().paginate_queryset(queryset)

    def check_permissions(self, request):
        if request.method not in permissions.SAFE_METHODS:
            self.required_permission = 'MANAGE_PROJECTS'
        else:
            self.required_permission = 'VIEW_PROJECTS'
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
    required_permission = 'VIEW_PROJECTS'

    def create(self, request, *args, **kwargs):
        from django.db import IntegrityError
        from rest_framework.exceptions import ValidationError
        try:
            return super().create(request, *args, **kwargs)
        except IntegrityError:
            raise ValidationError("This user is already assigned to this project.")

    def get_queryset(self):
        user = self.request.user
        role_name = getattr(user.role, 'name', None) if hasattr(user, 'role') else None
        if role_name == 'CLIENT':
            queryset = ProjectMember.objects.none()
        elif role_name == 'TEAM_MEMBER':
            queryset = ProjectMember.objects.filter(project__members__user=user).distinct()
        else:
            queryset = ProjectMember.objects.all()

        project_id = self.request.query_params.get('project')
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        return queryset

    def paginate_queryset(self, queryset):
        if self.request.query_params.get('project'):
            return None
        return super().paginate_queryset(queryset)

    def check_permissions(self, request):
        if request.method not in permissions.SAFE_METHODS:
            self.required_permission = 'MANAGE_PROJECTS'
        else:
            self.required_permission = 'VIEW_PROJECTS'
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
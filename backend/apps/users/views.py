from rest_framework import viewsets, permissions,status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view
from django.contrib.auth.password_validation import validate_password
from rest_framework.decorators import api_view, permission_classes

from rest_framework.views import APIView
from .models import User, Role, Department
from .serializers import (
    UserSerializer, UserCreateUpdateSerializer, 
    RoleSerializer, DepartmentSerializer,UserProfileSerializer
)
from core.permissions import HasPermission

class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [HasPermission]
    required_permission = 'MANAGE_SETTINGS'

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            class ReadRolePermission(permissions.BasePermission):
                def has_permission(self, request, view):
                    from core.permissions import has_permission
                    return (
                        has_permission(request.user, 'MANAGE_SETTINGS') or 
                        has_permission(request.user, 'MANAGE_USERS')
                    )
            return [ReadRolePermission()]
        return super().get_permissions()

    def paginate_queryset(self, queryset):
        if self.request.query_params.get('all') == 'true':
            return None
        return super().paginate_queryset(queryset)

    def create(self, request, *args, **kwargs):
        name = request.data.get("name")
        description = request.data.get("description", "")
        permissions = request.data.get("permissions", [])

        if not name:
            return Response(
                {"error": "Name is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        name = name.upper()

        existing_role = Role.all_objects.filter(name=name).first()

        if existing_role:
            if existing_role.deleted_at:
                existing_role.deleted_at = None
                existing_role.description = description
                existing_role.permissions = permissions
                existing_role.save()

            serializer = self.get_serializer(existing_role)
            return Response(
                {"data": serializer.data, "created": False},
                status=status.HTTP_200_OK,
            )

        role = Role.objects.create(
            name=name,
            description=description,
            permissions=permissions
        )

        serializer = self.get_serializer(role)
        return Response(
            {"data": serializer.data, "created": True},
            status=status.HTTP_201_CREATED,
        )
class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [HasPermission]
    required_permission = 'MANAGE_USERS'

    def paginate_queryset(self, queryset):
        if self.request.query_params.get('all') == 'true':
            return None
        return super().paginate_queryset(queryset)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    
    def get_permissions(self):
        if self.action in ['me', 'project_managers']:
            return [permissions.IsAuthenticated()]
        return [HasPermission()]

    required_permission = 'MANAGE_USERS'

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return UserCreateUpdateSerializer
        return UserSerializer

    def get_queryset(self):
        queryset = User.objects.all()

        dept_id = self.request.query_params.get("department")
        role = self.request.query_params.get("role")
        role_name = self.request.query_params.get("role_name")
        is_active = self.request.query_params.get("is_active")

        if dept_id:
            queryset = queryset.filter(department_id=dept_id)

        if role:
            if role.isdigit():
                queryset = queryset.filter(role_id=role)
            elif role == 'PROJECT_MANAGER':
                from django.conf import settings
                eligible_roles = getattr(settings, 'ELIGIBLE_PM_ROLES', ['PROJECT_MANAGER'])
                queryset = queryset.filter(role__name__in=eligible_roles)
            else:
                queryset = queryset.filter(role__name=role)

        if role_name:
            role_names = [r.strip() for r in role_name.split(',')]
            queryset = queryset.filter(role__name__in=role_names)

        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == "true")

        from django.db.models import F, Value
        from django.db.models.functions import Coalesce, NullIf
        queryset = queryset.annotate(
            sort_name=Coalesce(NullIf(F('name'), Value('')), F('username'))
        ).order_by('sort_name')

        return queryset

    @action(detail=False, methods=["get"], url_path="project-managers")
    def project_managers(self, request):
        from django.conf import settings
        from apps.users.serializers import MinimalUserSerializer
        
        eligible_roles = getattr(settings, 'ELIGIBLE_PM_ROLES', ['PROJECT_MANAGER'])
        queryset = self.get_queryset().filter(role__name__in=eligible_roles, is_active=True)
        
        serializer = MinimalUserSerializer(queryset, many=True, context=self.get_serializer_context())
        return Response(serializer.data)

    def list(self, request, *args, **kwargs):
        if request.query_params.get('all') == 'true':
            queryset = self.filter_queryset(self.get_queryset())
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)
        return super().list(request, *args, **kwargs)

    def check_email_permission(self, request, instance):
        if 'email' in request.data and request.data['email'] != instance.email:
            req_user = request.user
            req_is_super = req_user.is_superuser or (req_user.role and req_user.role.name == 'SUPER_ADMIN')
            tgt_is_super = instance.role and instance.role.name == 'SUPER_ADMIN'
            
            if not req_is_super:
                return False
            if req_user.id != instance.id and tgt_is_super:
                return False
        return True

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        
        # Return read representation
        read_serializer = UserSerializer(serializer.instance, context=self.get_serializer_context())
        return Response(read_serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        if not self.check_email_permission(request, instance):
            return Response({"email": ["You do not have permission to change this user's email."]}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        if getattr(instance, '_prefetched_objects_cache', None):
            instance._prefetched_objects_cache = {}
            
        read_serializer = UserSerializer(instance, context=self.get_serializer_context())
        return Response(read_serializer.data)

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)


    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        """
        Endpoint to retrieve the current logged-in user's profile.
        GET /api/v1/users/me/
        """
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]
    from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        user = request.user
        role_name = getattr(user.role, 'name', None) if hasattr(user, 'role') else None
        
        from rest_framework.exceptions import PermissionDenied, ValidationError
        from apps.projects.utils import log_failed_attempt
        if role_name == 'CLIENT':
            allowed_fields = ['profile_photo']
            for field in request.data.keys():
                if field not in allowed_fields:
                    log_failed_attempt(user, f"Tried to edit Profile field '{field}'")
                    raise PermissionDenied(f"Clients cannot modify the field '{field}'.")

        # Validate profile photo
        profile_photo = request.FILES.get('profile_photo') or request.data.get('profile_photo')
        if profile_photo and not isinstance(profile_photo, str):
            # Validate size (max 5MB)
            max_size = 5 * 1024 * 1024
            if profile_photo.size > max_size:
                raise ValidationError({"profile_photo": "File size exceeds 5MB limit."})
            
            # Validate extension/type
            ext = profile_photo.name.split('.')[-1].lower() if hasattr(profile_photo, 'name') else ''
            allowed = ['jpg', 'jpeg', 'png', 'gif']
            if ext not in allowed:
                raise ValidationError({"profile_photo": "File type not supported. Allowed: jpg, jpeg, png, gif"})

        # Audit log
        from apps.activity.models import ActivityLog
        ActivityLog.objects.create(user=user, action="Updated profile photo")

        # Security check: Use the dedicated UserProfileUpdateSerializer to filter out administrative fields
        from .serializers import UserProfileUpdateSerializer
        serializer = UserProfileUpdateSerializer(
            request.user,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            # Return read representation formatted via UserSerializer to maintain full backward compatibility
            read_serializer = UserSerializer(request.user)
            return Response(read_serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password(request):

     user = request.user
     current_password = request.data.get("currentPassword")
     new_password = request.data.get("newPassword")

     if not user.check_password(current_password):
        return Response(
            {"error": "Current password is incorrect"},
            status=status.HTTP_400_BAD_REQUEST
        )

     try:
        validate_password(new_password)
     except Exception as e:
        return Response({"error": str(e)}, status=400)

     user.set_password(new_password)
     user.save()

     # Audit log
     from apps.activity.models import ActivityLog
     ActivityLog.objects.create(user=user, action="Changed password")

     return Response({"message": "Password updated successfully"})


from rest_framework_simplejwt.views import TokenObtainPairView
from django.utils import timezone

class CustomTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except Exception:
            return super().post(request, *args, **kwargs)

        user = serializer.user
        if user:
            user.last_login = timezone.now()
            user.save(update_fields=['last_login'])

        return Response(serializer.validated_data, status=status.HTTP_200_OK)
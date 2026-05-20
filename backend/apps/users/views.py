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

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    
    def get_permissions(self):
        if self.action == 'me':
            return [permissions.IsAuthenticated()]
        return [HasPermission()]

    required_permission = 'MANAGE_USERS'

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return UserCreateUpdateSerializer
        return UserSerializer

    def get_queryset(self):
        queryset = User.objects.all()
        dept_id = self.request.query_params.get('department', None)
        role_id = self.request.query_params.get('role', None)
        
        if dept_id:
            queryset = queryset.filter(department_id=dept_id)
        if role_id:
            queryset = queryset.filter(role_id=role_id)
            
        return queryset

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

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserSerializer(
            request.user,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

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

     return Response({"message": "Password updated successfully"})
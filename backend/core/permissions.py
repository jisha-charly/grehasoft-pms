
from rest_framework import permissions

def has_permission(user, permission):
    """
    Check if a user has a specific permission.
    Denies if user is not authenticated or has no role.
    Returns True if permission exists in user.role.permissions.
    """
    if not user or not user.is_authenticated:
        return False
        
    if getattr(user, 'is_superuser', False):
        return True
        
    if not hasattr(user, 'role') or not user.role:
        return False
        
    user_permissions = getattr(user.role, 'permissions', [])
    if not user_permissions:
        return False
        
    if not isinstance(user_permissions, list):
        return False
        
    return permission in user_permissions

class HasPermission(permissions.BasePermission):
    """
    Dynamic DRF permission class that reads `required_permission` from the view.
    Usage in ViewSet:
        permission_classes = [HasPermission]
        required_permission = "VIEW_PROJECTS"
    """
    def has_permission(self, request, view):
        # Let explicit action-level permissions override if strictly needed by DRF
        # But commonly we check if required_permission exists
        required_permission = getattr(view, 'required_permission', None)
        if not required_permission:
            # If no permission is required by the view, default to basic auth
            return request.user and request.user.is_authenticated
            
        return has_permission(request.user, required_permission)

class IsSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and (
                request.user.is_superuser or
                (request.user.role and request.user.role.name == 'SUPER_ADMIN')
            )
        )

class IsProjectManager(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated or not request.user.role:
            return False
        return request.user.role.name in ['SUPER_ADMIN', 'PROJECT_MANAGER']

class IsSalesManager(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated or not request.user.role:
            return False
        return request.user.role.name in ['SUPER_ADMIN', 'SALES_MANAGER']

class IsTeamMember(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated or not request.user.role:
            return False
        return request.user.role.name in ['SUPER_ADMIN', 'PROJECT_MANAGER', 'TEAM_MEMBER']


class IsClientOwner(permissions.BasePermission):
    """
    Object-level permission to restrict access to clients owning the object.
    """
    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.is_authenticated:
            return False
            
        role_name = getattr(user.role, 'name', None) if hasattr(user, 'role') else None
        if role_name == 'CLIENT':
            client = user.get_associated_client()
            if not client:
                return False
            
            # Check if obj itself is Client
            from apps.projects.models import Client
            if isinstance(obj, Client):
                return obj == client
                
            # Check if obj has a client field
            if hasattr(obj, 'client'):
                return obj.client == client
                
            return False
            
        return True


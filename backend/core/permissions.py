from rest_framework import permissions

class IsSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role.name == 'SUPER_ADMIN'

class IsProjectManager(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role.name in ['SUPER_ADMIN', 'PROJECT_MANAGER']

class IsSalesManager(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role.name in ['SUPER_ADMIN', 'SALES_MANAGER']

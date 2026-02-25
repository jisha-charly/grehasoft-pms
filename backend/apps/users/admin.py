from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Role, Department


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("id", "name")


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ("id", "name")


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    model = User
    list_display = ("username", "email", "name", "role", "department", "is_staff")

    fieldsets = UserAdmin.fieldsets + (
        ("Additional Info", {
            "fields": ("name", "role", "department", "status")
        }),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        ("Additional Info", {
            "fields": ("name", "role", "department", "status")
        }),
    )
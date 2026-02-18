from django.db import models
from django.contrib.auth.models import AbstractUser
from backend.core.models import SoftDeleteModel

class Role(SoftDeleteModel):
    name = models.CharField(max_length=50, unique=True)  # ADMIN, PROJECT_MANAGER, EMPLOYEE, etc.
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

class Department(SoftDeleteModel):
    name = models.CharField(max_length=100)
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='sub_departments')
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

class User(AbstractUser, SoftDeleteModel):
    name = models.CharField(max_length=100)  # Specific field from DB doc
    role = models.ForeignKey(Role, on_delete=models.PROTECT, null=True, related_name='users')
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, related_name='users')
    status = models.CharField(max_length=10, choices=[('active', 'Active'), ('inactive', 'Inactive')], default='active')

    class Meta:
        db_table = 'users'

    def __str__(self):
        return f"{self.name} ({self.username})"

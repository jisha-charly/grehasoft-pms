
from django.db import models
from django.contrib.auth.models import AbstractUser
from core.models import SoftDeleteModel

class Role(SoftDeleteModel):
    # Strictly follows frontend enums: SUPER_ADMIN, PROJECT_MANAGER, TEAM_MEMBER, SALES_MANAGER, SALES_EXECUTIVE, CLIENT
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

class Department(SoftDeleteModel):
    name = models.CharField(max_length=100)
    # Support for hierarchical departments per DB doc 1.2
    parent = models.ForeignKey(
        'self', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='sub_departments'
    )

    def __str__(self):
        return self.name

class User(AbstractUser, SoftDeleteModel):
    # Extended fields from DB Design 3.1
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True, max_length=150) # Enforced uniqueness per design
    role = models.ForeignKey(Role, on_delete=models.PROTECT, related_name='users', null=True)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, related_name='users')
    status = models.CharField(
        max_length=10, 
        choices=[('active', 'Active'), ('inactive', 'Inactive')], 
        default='active'
    )

    class Meta:
        db_table = 'users'

    def __str__(self):
        return f"{self.name} ({self.username})"

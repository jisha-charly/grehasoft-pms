
from django.db import models
from django.contrib.auth.models import AbstractUser, UserManager
from core.models import SoftDeleteModel

class SoftDeleteUserManager(UserManager):
    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=True)

class Role(SoftDeleteModel):
    # Strictly follows frontend enums: SUPER_ADMIN, PROJECT_MANAGER, TEAM_MEMBER, SALES_MANAGER, SALES_EXECUTIVE, CLIENT
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    permissions = models.JSONField(default=list)  # ✅ store permissions

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-id']

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

    class Meta:
        ordering = ['-id']

    def __str__(self):
        return self.name

class User(AbstractUser, SoftDeleteModel):
    objects = SoftDeleteUserManager()

    # Extended fields from DB Design 3.1
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True, max_length=150) # Enforced uniqueness per design
    address = models.TextField(blank=True, null=True)
    role = models.ForeignKey(Role, on_delete=models.PROTECT, related_name='users', null=True)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, related_name='users')
    position = models.CharField(max_length=100, blank=True, null=True)
    joining_date = models.DateField(blank=True, null=True)
    salary_monthly = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    status = models.CharField(
        max_length=10, 
        choices=[('active', 'Active'), ('inactive', 'Inactive')], 
        default='active'
    )
    client = models.ForeignKey(
        'projects.Client',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='associated_users'
    )
    profile_photo = models.ImageField(upload_to='profile_photos/', null=True, blank=True)

    def get_associated_client(self):
        if self.client:
            return self.client
        from apps.projects.models import Client
        return Client.objects.filter(email=self.email).first()

    class Meta:
        db_table = 'users'
        ordering = ['-id']

    def __str__(self):
        return f"{self.name} ({self.username})"

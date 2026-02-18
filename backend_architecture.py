
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

class SoftDeleteModel(models.Model):
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        abstract = True

    def delete(self):
        self.deleted_at = timezone.now()
        self.save()

class Role(SoftDeleteModel):
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField()

class Department(SoftDeleteModel):
    name = models.CharField(max_length=100)
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True)

class User(AbstractUser, SoftDeleteModel):
    role = models.ForeignKey(Role, on_delete=models.PROTECT)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True)
    status = models.CharField(max_length=10, choices=[('active', 'Active'), ('inactive', 'Inactive')])

class Client(SoftDeleteModel):
    name = models.CharField(max_length=150)
    email = models.EmailField(max_length=150)
    company_name = models.CharField(max_length=200)
    gst_no = models.CharField(max_length=50, null=True, blank=True)

class Project(SoftDeleteModel):
    name = models.CharField(max_length=200)
    client = models.ForeignKey(Client, on_delete=models.CASCADE)
    department = models.ForeignKey(Department, on_delete=models.PROTECT)
    manager = models.ForeignKey(User, related_name='managed_projects', on_delete=models.PROTECT)
    status = models.CharField(max_length=20, choices=[
        ('not_started', 'Not Started'),
        ('in_progress', 'In Progress'),
        ('on_hold', 'On Hold'),
        ('completed', 'Completed')
    ])
    progress_percentage = models.IntegerField(default=0)

    class Meta:
        indexes = [
            models.Index(fields=['status']),
        ]

class Task(SoftDeleteModel):
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField()
    priority = models.CharField(max_length=10, choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High')])
    status = models.CharField(max_length=20, choices=[
        ('todo', 'Todo'),
        ('in_progress', 'In Progress'),
        ('done', 'Done'),
        ('blocked', 'Blocked')
    ])
    board_order = models.IntegerField(default=0)
    due_date = models.DateField()
    created_by = models.ForeignKey(User, on_delete=models.PROTECT)

    class Meta:
        indexes = [
            models.Index(fields=['project', 'status']),
            models.Index(fields=['due_date']),
        ]

class ActivityLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    task = models.ForeignKey(Task, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['project', 'created_at']),
        ]

# Additional SEO and CRM models follow same pattern...

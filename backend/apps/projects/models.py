from django.db import models
from core.models import SoftDeleteModel
from django.conf import settings

class Client(SoftDeleteModel):
    name = models.CharField(max_length=150)
    email = models.EmailField(max_length=150)
    phone = models.CharField(max_length=20)
    company_name = models.CharField(max_length=200)
    gst_no = models.CharField(max_length=50, null=True, blank=True)
    address = models.TextField()

    def __str__(self):
        return self.company_name

class Project(SoftDeleteModel):
    STATUS_CHOICES = [
        ('not_started', 'Not Started'),
        ('in_progress', 'In Progress'),
        ('on_hold', 'On Hold'),
        ('completed', 'Completed'),
    ]

    name = models.CharField(max_length=200)
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='projects')
    department = models.ForeignKey('users.Department', on_delete=models.PROTECT)
    project_manager = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='managed_projects')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='created_projects')
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='not_started')
    progress_percentage = models.IntegerField(default=0)

    class Meta:
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['client']),
        ]

class Milestone(models.Model):
    project = models.ForeignKey(
        "projects.Project",  # adjust if app name differs
        on_delete=models.CASCADE,
        related_name="milestones"
    )
    title = models.CharField(max_length=255)
    due_date = models.DateField()
    status = models.CharField(
        max_length=20,
        choices=[("pending", "Pending"), ("completed", "Completed")],
        default="pending"
    )
    progress = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class ProjectMember(models.Model):
    project = models.ForeignKey(
        "projects.Project",
        on_delete=models.CASCADE,
        related_name="members"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )
    role_in_project = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.user} - {self.project}"


class ActivityLog(models.Model):
    project = models.ForeignKey(
        "projects.Project",
        on_delete=models.CASCADE,
        related_name="activities"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )
    action = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.action
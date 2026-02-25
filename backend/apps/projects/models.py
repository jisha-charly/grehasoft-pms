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

class ProjectMilestone(SoftDeleteModel):
    STATUS_CHOICES = [('pending', 'Pending'), ('completed', 'Completed')]
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='milestones')
    title = models.CharField(max_length=200)
    due_date = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')

class ProjectMember(models.Model):
    ROLE_IN_PROJECT = [('PM', 'PM'), ('MEMBER', 'Member'), ('QA', 'QA'), ('VIEWER', 'Viewer')]
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    role_in_project = models.CharField(max_length=10, choices=ROLE_IN_PROJECT)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('project', 'user')
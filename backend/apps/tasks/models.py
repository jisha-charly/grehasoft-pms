
from django.db import models
from core.models import SoftDeleteModel
from django.conf import settings

class TaskType(SoftDeleteModel):
    name = models.CharField(max_length=100, unique=True) # Dev, SEO, Design, Ads
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

class Task(SoftDeleteModel):
    PRIORITY_CHOICES = [('low', 'Low'), ('medium', 'Medium'), ('high', 'High')]
    STATUS_CHOICES = [
        ('todo', 'Todo'), 
        ('in_progress', 'In Progress'), 
        ('done', 'Done'), 
        ('blocked', 'Blocked')
    ]

    project = models.ForeignKey(
        'projects.Project', 
        on_delete=models.CASCADE, 
        related_name='tasks'
    )
    title = models.CharField(max_length=200)
    description = models.TextField()
    task_type = models.ForeignKey(TaskType, on_delete=models.PROTECT)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='todo')
    board_order = models.IntegerField(default=0)
    due_date = models.DateField()
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)

    class Meta:
        indexes = [
            models.Index(fields=['project', 'status']),
            models.Index(fields=['due_date']),
        ]

class TaskAssignment(SoftDeleteModel):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='assignments')
    employee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='assigned_tasks')
    assigned_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    assigned_at = models.DateTimeField(auto_now_add=True)
    unassigned_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('task', 'employee')

class TaskProgress(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='progress_history')
    progress_percentage = models.IntegerField()
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    updated_at = models.DateTimeField(auto_now_add=True)

class TaskFile(SoftDeleteModel):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='files')
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    file_path = models.CharField(max_length=255)
    file_type = models.CharField(max_length=50)
    revision_no = models.IntegerField(default=1)
    uploaded_at = models.DateTimeField(auto_now_add=True)

class TaskReview(models.Model):
    ROLE_CHOICES = [('PM', 'Project Manager'), ('ADMIN', 'Admin')]
    STATUS_CHOICES = [('approved', 'Approved'), ('rework', 'Rework')]
    
    task_file = models.ForeignKey(TaskFile, on_delete=models.CASCADE, related_name='reviews')
    reviewer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    reviewed_by_role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    review_version = models.IntegerField()
    comments = models.TextField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    reviewed_at = models.DateTimeField(auto_now_add=True)

class TaskComment(SoftDeleteModel):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

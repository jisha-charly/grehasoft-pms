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

    class Meta:
        ordering = ['-id']

    def __str__(self):
        return self.company_name

class Project(SoftDeleteModel):
    STATUS_CHOICES = [
        ('not_started', 'Not Started'),
        ('in_progress', 'In Progress'),
        ('on_hold', 'On Hold'),
        ('completed', 'Completed'),
        ('blocked', 'Blocked'),
    ]

    name = models.CharField(max_length=200)
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='projects')
    department = models.ForeignKey('users.Department', on_delete=models.SET_NULL, null=True, blank=True)
    project_manager = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='managed_projects')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='created_projects')
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='not_started')
    progress_percentage = models.IntegerField(default=0)

    class Meta:
        ordering = ['-id']
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
    STATUS_CHOICES = [
        ("not_started", "Not Started"),
        ("in_progress", "In Progress"),
        ("blocked", "Blocked"),
        ("completed", "Completed")
    ]
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="not_started"
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

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

def update_milestone_progress(milestone):
    tasks = milestone.tasks.filter(deleted_at__isnull=True)
    total_tasks = tasks.count()
    blocked_tasks = tasks.filter(status='blocked').count()

    task_progress_map = {
        "todo": 0,
        "in_progress": 50,
        "done": 100,
        "blocked": 0
    }

    if total_tasks > 0:
        total_progress = sum(task_progress_map.get(t.status, 0) for t in tasks)
        milestone.progress = int(total_progress / total_tasks)
    else:
        milestone.progress = 0

    if blocked_tasks > 0:
        milestone.status = 'blocked'
    elif milestone.progress == 0:
        milestone.status = 'not_started'
    elif milestone.progress < 100:
        milestone.status = 'in_progress'
    elif milestone.progress == 100:
        milestone.status = 'completed'

    milestone.save(update_fields=['status', 'progress'])

    if hasattr(milestone, 'project') and milestone.project:
        update_project_progress(milestone.project)

def update_project_progress(project):
    from django.db.models import Avg
    from apps.projects.models import Milestone
    
    milestones = Milestone.objects.filter(project=project)
    blocked_milestones = milestones.filter(status='blocked').count()
    total_milestones = milestones.count()

    if total_milestones > 0:
        avg = milestones.aggregate(Avg('progress'))['progress__avg']
        project.progress_percentage = int(avg) if avg is not None else 0
    else:
        project.progress_percentage = 0

    if blocked_milestones > 0:
        project.status = 'blocked'
    elif project.progress_percentage == 0:
        project.status = 'not_started'
    elif project.progress_percentage < 100:
        project.status = 'in_progress'
    elif project.progress_percentage == 100:
        project.status = 'completed'

    project.save(update_fields=['status', 'progress_percentage'])

@receiver(post_save, sender=Milestone)
@receiver(post_delete, sender=Milestone)
def milestone_changed(sender, instance, **kwargs):
    if hasattr(instance, 'project') and instance.project:
        update_project_progress(instance.project)

@receiver(post_save, sender='tasks.Task')
@receiver(post_delete, sender='tasks.Task')
def task_changed(sender, instance, **kwargs):
    if hasattr(instance, 'milestone') and instance.milestone:
        update_milestone_progress(instance.milestone)
    elif hasattr(instance, 'project') and instance.project:
        update_project_progress(instance.project)
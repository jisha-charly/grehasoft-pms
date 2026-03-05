
from django.db import models
from django.conf import settings
from apps.projects.models import Project
class ActivityLog(models.Model):
    user = models.ForeignKey(
    settings.AUTH_USER_MODEL,
    on_delete=models.CASCADE,
    related_name="activity_app_logs"
)
    project = models.ForeignKey(Project, null=True, blank=True, on_delete=models.SET_NULL)
    task = models.ForeignKey(
        'tasks.Task', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    action = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['project', 'created_at']),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.name} - {self.action} ({self.created_at})"

# apps/projects/utils.py

from apps.projects.models import ActivityLog

def log_system_activity(user, project, action):
    ActivityLog.objects.create(
        user=user,
        project=project,
        action=action
    )
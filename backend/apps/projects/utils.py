# apps/projects/utils.py

from apps.projects.models import ActivityLog

def log_system_activity(user, project, action):
    ActivityLog.objects.create(
        user=user,
        project=project,
        action=action
    )

def log_failed_attempt(user, action):
    from apps.activity.models import ActivityLog as GlobalActivityLog
    GlobalActivityLog.objects.create(
        user=user,
        action=f"FAILED UNAUTHORIZED ACCESS ATTEMPT: {action}"
    )
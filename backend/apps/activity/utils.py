from .models import ActivityLog

def log_system_activity(user, project, action, task=None):
    """
    Utility function to create an audit log entry.
    """
    ActivityLog.objects.create(
        user=user,
        project=project,
        task=task,
        action=action
    )

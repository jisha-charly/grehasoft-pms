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

def get_or_create_active_client(email, name, phone, company_name, address=""):
    """
    Finds or creates an active Client record using the provided email.
    
    CONTRACT & SCOPE:
    - This function exists ONLY for backend CRM conversion workflows (Leads and Proposals).
    - It is NOT a replacement for ClientSerializer validation.
    - It is NOT a replacement for Client.objects.create() in manual creations.
    - It does NOT guarantee database uniqueness under concurrent requests (subject to TOCTOU race conditions).
    - It performs a best-effort lookup followed by creation.
    """
    from apps.projects.models import Client
    # Client.objects utilizes SoftDeleteManager (deleted_at__isnull=True)
    client = Client.objects.filter(email=email).first()
    if not client:
        client = Client.objects.create(
            name=name,
            email=email,
            phone=phone,
            company_name=company_name,
            address=address
        )
        return client, True
    return client, False
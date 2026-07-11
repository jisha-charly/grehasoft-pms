import os
import sys
import django

# Setup django environment
sys.path.append(os.path.abspath("."))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from rest_framework.test import APIClient
from apps.users.models import User
from apps.projects.models import Project, Client, ProjectMember
from apps.tasks.models import Task, TaskType

# Create clients, users, and projects for testing
admin_user = User.all_objects.filter(is_superuser=True).first()
if not admin_user:
    admin_user = User.objects.create_superuser("admin_test", "admin_test@test.com", "pass123")

# Ensure required Roles exist
def get_or_create_role(name):
    from apps.users.models import Role
    role, _ = Role.objects.get_or_create(name=name, defaults={"description": name})
    return role

pm_role = get_or_create_role("PROJECT_MANAGER")
member_role = get_or_create_role("TEAM_MEMBER")

# Setup users
john, _ = User.objects.get_or_create(username="john", defaults={"email": "john@test.com", "role": member_role, "name": "John"})
sarah, _ = User.objects.get_or_create(username="sarah", defaults={"email": "sarah@test.com", "role": member_role, "name": "Sarah"})
david, _ = User.objects.get_or_create(username="david", defaults={"email": "david@test.com", "role": member_role, "name": "David"})

# Make sure they are active
john.is_active = True
john.save()
sarah.is_active = True
sarah.save()
david.is_active = True
david.save()

# Setup Client
test_client, _ = Client.objects.get_or_create(company_name="Test Company", defaults={"name": "Test Client", "email": "client@test.com", "phone": "12345", "address": "Test"})

# Setup Projects
import datetime
proj_a, _ = Project.objects.get_or_create(name="Project A", defaults={
    "client": test_client, "start_date": datetime.date.today(), "end_date": datetime.date.today() + datetime.timedelta(days=30),
    "created_by": admin_user
})
proj_b, _ = Project.objects.get_or_create(name="Project B", defaults={
    "client": test_client, "start_date": datetime.date.today(), "end_date": datetime.date.today() + datetime.timedelta(days=30),
    "created_by": admin_user
})

# Setup Project Members
ProjectMember.objects.filter(project__in=[proj_a, proj_b]).delete()
ProjectMember.objects.create(project=proj_a, user=john, role_in_project="Developer")
ProjectMember.objects.create(project=proj_a, user=sarah, role_in_project="Designer")
ProjectMember.objects.create(project=proj_b, user=david, role_in_project="Manager")

# Setup TaskType
task_type, _ = TaskType.objects.get_or_create(name="DEVELOPMENT", defaults={"description": "dev"})

# API Client
client = APIClient()
client.force_authenticate(user=admin_user)

print("--- STARTING TASK ASSIGNEE FILTERING AUDIT VERIFICATION ---")

# 1. GET /projects/<id>/members/ returns only correct project members
print("\n1. Querying Project A members...")
res_a = client.get(f"/api/v1/projects/{proj_a.id}/members/")
print("Status:", res_a.status_code)
members_a = [m['username'] for m in res_a.json()]
print("Project A Members:", members_a)
assert "john" in members_a and "sarah" in members_a and "david" not in members_a, "Fail: Project A members incorrect"

print("\n2. Querying Project B members...")
res_b = client.get(f"/api/v1/projects/{proj_b.id}/members/")
print("Status:", res_b.status_code)
members_b = [m['username'] for m in res_b.json()]
print("Project B Members:", members_b)
assert "david" in members_b and "john" not in members_b, "Fail: Project B members incorrect"

# 2. Creating a task in Project A assigned to John succeeds (HTTP 201)
print("\n3. Creating task for Project A assigned to John (member)...")
task_data_john = {
    "project": proj_a.id,
    "title": "Task for John",
    "description": "desc",
    "task_type": task_type.id,
    "priority": "low",
    "status": "todo",
    "due_date": str(datetime.date.today() + datetime.timedelta(days=5)),
    "assignees": [john.id]
}
res_john = client.post("/api/v1/tasks/", task_data_john)
print("Status (expected 201):", res_john.status_code)
assert res_john.status_code == 201, "Fail: John assignment failed"

# 3. Creating a task in Project A assigned to Sarah succeeds (HTTP 201)
print("\n4. Creating task for Project A assigned to Sarah (member)...")
task_data_sarah = {
    "project": proj_a.id,
    "title": "Task for Sarah",
    "description": "desc",
    "task_type": task_type.id,
    "priority": "medium",
    "status": "todo",
    "due_date": str(datetime.date.today() + datetime.timedelta(days=5)),
    "assignees": [sarah.id]
}
res_sarah = client.post("/api/v1/tasks/", task_data_sarah)
print("Status (expected 201):", res_sarah.status_code)
assert res_sarah.status_code == 201, "Fail: Sarah assignment failed"

# 4. Creating a task in Project A assigned to David returns HTTP 400 Bad Request
print("\n5. Creating task for Project A assigned to David (non-member)...")
task_data_david = {
    "project": proj_a.id,
    "title": "Task for David",
    "description": "desc",
    "task_type": task_type.id,
    "priority": "high",
    "status": "todo",
    "due_date": str(datetime.date.today() + datetime.timedelta(days=5)),
    "assignees": [david.id]
}
res_david = client.post("/api/v1/tasks/", task_data_david)
print("Status (expected 400):", res_david.status_code)
print("Response:", res_david.json())
assert res_david.status_code == 400, "Fail: David assignment did not fail"
assert res_david.json() == {"assignee": ["This user is not a member of the selected project."]}, "Fail: Unexpected response payload"

print("\n--- ALL BACKEND ASSIGNEE FILTERING CHECKS PASSED SUCCESSFULLY ---")

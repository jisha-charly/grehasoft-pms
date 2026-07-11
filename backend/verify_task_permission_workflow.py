import os
import sys
import django
import datetime

sys.path.append(os.path.abspath("."))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from rest_framework.test import APIClient
from apps.users.models import User
from apps.projects.models import Project, Client, ProjectMember
from apps.tasks.models import Task, TaskType, TaskAssignment

def get_or_create_role(name):
    from apps.users.models import Role
    role, _ = Role.objects.get_or_create(name=name, defaults={"description": name})
    return role

# Ensure required Roles
admin_role = get_or_create_role("ADMIN")
pm_role = get_or_create_role("PROJECT_MANAGER")
member_role = get_or_create_role("TEAM_MEMBER")

# Setup users
admin_user = User.all_objects.filter(is_superuser=True).first()
if not admin_user:
    admin_user = User.objects.create_superuser("admin_test", "admin_test@test.com", "pass123")

pm, _ = User.objects.get_or_create(username="pm_perm_test", defaults={"email": "pm1@test.com", "role": pm_role, "name": "PM"})
maria, _ = User.objects.get_or_create(username="maria_perm_test", defaults={"email": "maria@test.com", "role": member_role, "name": "Maria"})
bob, _ = User.objects.get_or_create(username="bob_perm_test", defaults={"email": "bob@test.com", "role": member_role, "name": "Bob"})

for u in [pm, maria, bob]:
    u.is_active = True
    u.save()

# Setup Client
client_obj, _ = Client.objects.get_or_create(company_name="Test Company", defaults={"name": "Test Client", "email": "client@test.com", "phone": "12345", "address": "Test"})

# Setup Project
proj, _ = Project.objects.get_or_create(name="Project X", defaults={
    "client": client_obj, "start_date": datetime.date.today(), "end_date": datetime.date.today() + datetime.timedelta(days=30),
    "created_by": admin_user
})

# Setup Members
ProjectMember.objects.filter(project=proj).delete()
ProjectMember.objects.create(project=proj, user=pm, role_in_project="Manager")
ProjectMember.objects.create(project=proj, user=maria, role_in_project="Developer")
ProjectMember.objects.create(project=proj, user=bob, role_in_project="Developer")

# TaskType
task_type, _ = TaskType.objects.get_or_create(name="DEVELOPMENT", defaults={"description": "dev"})

# Clean previous tasks for Project X
Task.objects.filter(project=proj).delete()

# Create tasks
task_maria = Task.objects.create(
    project=proj, title="Maria's Task", description="desc", task_type=task_type,
    priority="low", status="todo", due_date=datetime.date.today(), created_by=admin_user
)
TaskAssignment.objects.create(task=task_maria, employee=maria, assigned_by=admin_user)

task_bob = Task.objects.create(
    project=proj, title="Bob's Task", description="desc", task_type=task_type,
    priority="low", status="todo", due_date=datetime.date.today(), created_by=admin_user
)
TaskAssignment.objects.create(task=task_bob, employee=bob, assigned_by=admin_user)

print("--- STARTING TASK WORKFLOW PERMISSION VERIFICATION ---")

# API Clients
client_admin = APIClient()
client_admin.force_authenticate(user=admin_user)

client_pm = APIClient()
client_pm.force_authenticate(user=pm)

client_maria = APIClient()
client_maria.force_authenticate(user=maria)

# 1. Team Member maria retrieves all tasks for the project
print("\n1. Team Member Maria views all tasks for project...")
res = client_maria.get(f"/api/v1/tasks/?project={proj.id}")
print("Status:", res.status_code)
task_titles = [t['title'] for t in res.json()]
print("Tasks found:", task_titles)
assert len(task_titles) == 2, "Fail: Team Member cannot view all tasks"

# 2. Admin edits any task
print("\n2. Admin edits Bob's task...")
res = client_admin.patch(f"/api/v1/tasks/{task_bob.id}/", {"title": "Bob's Task Edited by Admin"})
print("Status (expected 200):", res.status_code)
assert res.status_code == 200, "Fail: Admin cannot edit task"

# 3. Project Manager edits any task
print("\n3. Project Manager edits Maria's task...")
res = client_pm.patch(f"/api/v1/tasks/{task_maria.id}/", {"title": "Maria's Task Edited by PM"})
print("Status (expected 200):", res.status_code)
assert res.status_code == 200, "Fail: PM cannot edit task"

# 4. Team Member Maria edits own task (status/progress only or regular update?)
print("\n4. Maria edits status of her own task...")
res = client_maria.patch(f"/api/v1/tasks/{task_maria.id}/", {"status": "in_progress", "progress_percentage": 50})
print("Status (expected 200):", res.status_code)
assert res.status_code == 200, "Fail: Maria cannot edit status of her own task"

# 5. Team Member Maria receives HTTP 403 when trying to edit Bob's task
print("\n5. Maria attempts to edit Bob's task...")
res = client_maria.patch(f"/api/v1/tasks/{task_bob.id}/", {"status": "done"})
print("Status (expected 403):", res.status_code)
print("Response:", res.json())
assert res.status_code == 403, "Fail: Maria edited Bob's task"
assert res.json() == {"detail": "You can only modify tasks assigned to you."}, "Fail: Incorrect error message"

# 6. Team Member Maria receives HTTP 403 when trying to delete any task (Maria's own task)
print("\n6. Maria attempts to delete her own task...")
res = client_maria.delete(f"/api/v1/tasks/{task_maria.id}/")
print("Status (expected 403):", res.status_code)
print("Response:", res.json())
assert res.status_code == 403, "Fail: Maria deleted her own task"
assert res.json() == {"detail": "Only Project Managers or Administrators can delete tasks."}, "Fail: Incorrect delete message"

# 7. Project Manager deletes a task
print("\n7. Project Manager deletes Maria's task...")
res = client_pm.delete(f"/api/v1/tasks/{task_maria.id}/")
print("Status (expected 204):", res.status_code)
assert res.status_code == 204, "Fail: PM cannot delete task"

print("\n--- ALL BACKEND PERMISSION WORKFLOW TESTS PASSED SUCCESSFULLY ---")

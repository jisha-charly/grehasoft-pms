import os
import django
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework.exceptions import PermissionDenied, NotAuthenticated
from apps.users.models import Role, Department
from apps.projects.models import Project, Client, Milestone, ProjectMember
from apps.tasks.models import Task, TaskType, TaskAssignment, TaskFile, TaskReview, TaskComment
from apps.tasks.views import TaskViewSet, TaskCommentViewSet, TaskReviewViewSet
from apps.projects.views import ProjectViewSet, MilestoneViewSet, ProjectMemberViewSet
from apps.reports.views import DashboardStatsView
from apps.dashboard.views import dashboard_stats

User = get_user_model()

def run_rbac_test():
    print("=================== STARTING TEAM_MEMBER RBAC TEST ===================")
    
    # 1. Setup roles and users
    member_role, _ = Role.objects.get_or_create(name='TEAM_MEMBER', defaults={'permissions': ['VIEW_DASHBOARD', 'VIEW_PROJECTS', 'VIEW_TASKS', 'MANAGE_TASKS']})
    pm_role, _ = Role.objects.get_or_create(name='PROJECT_MANAGER', defaults={'permissions': ['VIEW_DASHBOARD', 'VIEW_PROJECTS', 'VIEW_TASKS', 'MANAGE_PROJECTS', 'MANAGE_TASKS']})
    dept, _ = Department.objects.get_or_create(name='Engineering')
    
    # Generate unique suffix
    suffix = str(random.randint(1000, 9999))
    username_member = f'member_aud_{suffix}'
    username_other = f'other_aud_{suffix}'
    username_pm = f'pm_aud_{suffix}'
    
    email_member = f'member_aud_{suffix}@example.com'
    email_other = f'other_aud_{suffix}@example.com'
    email_pm = f'pm_aud_{suffix}@example.com'
    
    # Create test users
    member_user = User.objects.create_user(username=username_member, email=email_member, password='password', role=member_role, department=dept)
    other_member = User.objects.create_user(username=username_other, email=email_other, password='password', role=member_role, department=dept)
    pm_user = User.objects.create_user(username=username_pm, email=email_pm, password='password', role=pm_role, department=dept)
    
    # Create client & project
    client = Client.objects.create(name=f'Enterprise Corp {suffix}', email=f'client_{suffix}@enterprise.com')
    project = Project.objects.create(name=f'Enterprise Upgrade {suffix}', client=client, department=dept, project_manager=pm_user, created_by=pm_user, start_date='2026-01-01', end_date='2026-12-31')
    
    # Assign member_user and other_member to the project
    ProjectMember.objects.create(project=project, user=member_user, role_in_project='MEMBER')
    ProjectMember.objects.create(project=project, user=other_member, role_in_project='MEMBER')
    
    task_type, _ = TaskType.objects.get_or_create(name='DEVELOPMENT')
    
    # Create tasks
    my_task = Task.objects.create(project=project, title='Implement Auth', description='RBAC tasks', task_type=task_type, priority='high', status='todo', due_date='2026-06-30', created_by=pm_user)
    other_task = Task.objects.create(project=project, title='Write Tests', description='RBAC tests', task_type=task_type, priority='medium', status='todo', due_date='2026-06-30', created_by=pm_user)
    
    # Assign tasks
    TaskAssignment.objects.create(task=my_task, employee=member_user, assigned_by=pm_user)
    TaskAssignment.objects.create(task=other_task, employee=other_member, assigned_by=pm_user)
    
    factory = APIRequestFactory()
    
    try:
        # A. Verify TEAM_MEMBER can view tasks of projects they are members of
        print("A. Testing task list visibility...")
        view = TaskViewSet.as_view({'get': 'list'})
        request = factory.get(f'/api/v1/tasks/?project={project.id}')
        force_authenticate(request, user=member_user)
        response = view(request)
        task_ids = [t['id'] for t in response.data.get('results', response.data)]
        assert my_task.id in task_ids, "Should view own assigned task"
        assert other_task.id in task_ids, "Should view other tasks in their project"
        print("   [OK] TEAM_MEMBER can view all tasks in assigned projects.")

        # B. Verify TEAM_MEMBER can edit their own task (status, progress)
        print("B. Testing editing own task (status, progress_percentage)...")
        view = TaskViewSet.as_view({'patch': 'partial_update'})
        request = factory.patch(f'/api/v1/tasks/{my_task.id}/', {'status': 'in_progress', 'progress_percentage': 50}, format='json')
        force_authenticate(request, user=member_user)
        response = view(request, pk=my_task.id)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        my_task.refresh_from_db()
        assert my_task.status == 'in_progress', "Status should update"
        assert my_task.progress_history.filter(progress_percentage=50).exists(), "Progress history should be logged"
        print("   [OK] TEAM_MEMBER can update status and progress of own tasks.")

        # C. Verify duplicate progress logs are NOT created
        print("C. Testing duplicate progress log avoidance...")
        request = factory.patch(f'/api/v1/tasks/{my_task.id}/', {'progress_percentage': 50}, format='json')
        force_authenticate(request, user=member_user)
        response = view(request, pk=my_task.id)
        assert response.status_code == 200
        progress_count = my_task.progress_history.filter(progress_percentage=50).count()
        assert progress_count == 1, f"Expected 1 progress entry, got {progress_count}"
        print("   [OK] Duplicate progress history records avoided successfully.")

        # D. Verify TEAM_MEMBER cannot edit restricted task fields (e.g. title)
        print("D. Testing field-level restrictions on own task...")
        request = factory.patch(f'/api/v1/tasks/{my_task.id}/', {'title': 'Hacked Title'}, format='json')
        force_authenticate(request, user=member_user)
        try:
            response = view(request, pk=my_task.id)
            assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        except PermissionDenied:
            pass  # Expected behavior
        my_task.refresh_from_db()
        assert my_task.title == 'Implement Auth', "Title should remain unchanged"
        print("   [OK] Field-level task modifications rejected with 403.")

        # E. Verify TEAM_MEMBER cannot edit other users' tasks
        print("E. Testing editing other user's task...")
        request = factory.patch(f'/api/v1/tasks/{other_task.id}/', {'status': 'in_progress'}, format='json')
        force_authenticate(request, user=member_user)
        try:
            response = view(request, pk=other_task.id)
            assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        except PermissionDenied:
            pass  # Expected behavior
        other_task.refresh_from_db()
        assert other_task.status == 'todo', "Other task status should remain unchanged"
        print("   [OK] Editing other users' tasks rejected with 403.")

        # F. Verify TEAM_MEMBER cannot create tasks
        print("F. Testing task creation block...")
        view_create = TaskViewSet.as_view({'post': 'create'})
        request = factory.post('/api/v1/tasks/', {
            'project': project.id, 'title': 'Malicious Task', 'description': 'desc', 'task_type': task_type.id, 'priority': 'medium', 'due_date': '2026-06-30'
        }, format='json')
        force_authenticate(request, user=member_user)
        try:
            response = view_create(request)
            assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        except PermissionDenied:
            pass
        print("   [OK] Creating tasks rejected with 403.")

        # G. Verify TEAM_MEMBER cannot delete tasks
        print("G. Testing task deletion block...")
        view_delete = TaskViewSet.as_view({'delete': 'destroy'})
        request = factory.delete(f'/api/v1/tasks/{my_task.id}/')
        force_authenticate(request, user=member_user)
        try:
            response = view_delete(request, pk=my_task.id)
            assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        except PermissionDenied:
            pass
        print("   [OK] Deleting tasks rejected with 403.")

        # H. Verify TEAM_MEMBER cannot review/approve task files
        print("H. Testing file review block...")
        task_file = TaskFile.objects.create(task=my_task, file_path='deliverable.pdf', file_type='pdf', revision_no=1, uploaded_by=member_user)
        view_review = TaskReviewViewSet.as_view({'post': 'create'})
        request = factory.post('/api/v1/task-reviews/', {'task_file': task_file.id, 'comments': 'Approve!', 'status': 'approved'}, format='json')
        force_authenticate(request, user=member_user)
        try:
            response = view_review(request)
            assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        except PermissionDenied:
            pass
        print("   [OK] Reviewing deliverables rejected with 403.")

        # I. Verify TEAM_MEMBER cannot edit other comments
        print("I. Testing other user's comment modification block...")
        comment = TaskComment.objects.create(task=my_task, user=other_member, comment='Hello!')
        view_comment = TaskCommentViewSet.as_view({'patch': 'partial_update'})
        request = factory.patch(f'/api/v1/task-comments/{comment.id}/', {'comment': 'Edited!'}, format='json')
        force_authenticate(request, user=member_user)
        try:
            response = view_comment(request, pk=comment.id)
            assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        except PermissionDenied:
            pass
        print("   [OK] Modifying other users' comments rejected with 403.")

        # J. Verify Dashboard Stats filtering
        print("J. Testing dashboard stats filtering...")
        # Add another project that member_user is NOT a member of
        secret_project = Project.objects.create(name=f'Secret Initiative {suffix}', client=client, department=dept, project_manager=pm_user, created_by=pm_user, start_date='2026-01-01', end_date='2026-12-31')
        secret_task = Task.objects.create(project=secret_project, title='Secret Task', description='secret', task_type=task_type, priority='high', status='todo', due_date='2026-06-30', created_by=pm_user)
        TaskAssignment.objects.create(task=secret_task, employee=other_member, assigned_by=pm_user)
        
        # Test dashboard_stats function view
        request = factory.get('/api/v1/dashboard/stats/')
        force_authenticate(request, user=member_user)
        response = dashboard_stats(request)
        assert response.status_code == 200
        data = response.data
        assert data['projects']['total'] == 1, f"Should only see 1 project, saw {data['projects']['total']}"
        assert data['tasks']['pending'] == 1, f"Should only see 1 pending task, saw {data['tasks']['pending']}"
        assert data['clients']['active'] == 0, "Clients active count should be hidden (0) on dashboard stats"
        assert 'productivity' in data, "Productivity metric should be present"
        print("   [OK] Dashboard stats return filtered personal metrics.")

        # K. Test Reports DashboardStatsView filtering
        print("K. Testing reports dashboard stats filtering...")
        view_reports_stats = DashboardStatsView.as_view()
        request = factory.get('/api/v1/dashboard-stats/')
        force_authenticate(request, user=member_user)
        response = view_reports_stats(request)
        assert response.status_code == 200
        stats_data = response.data['stats']
        assert stats_data['total_projects'] == 1, f"Should only count 1 project, got {stats_data['total_projects']}"
        assert stats_data['active_tasks'] == 1, f"Should only count 1 active task, got {stats_data['active_tasks']}"
        assert stats_data['total_users'] == 0, "Total users count should be hidden (0)"
        assert stats_data['conversion_rate'] == 0, "Lead conversion rate should be hidden (0)"
        print("   [OK] Reports stats return filtered personal metrics.")

        print("\n[SUCCESS] ALL RBAC AUDIT CHECKS PASSED SUCCESSFULLY!")

    finally:
        print("Cleaning up database state...")
        # Hard delete test models
        if 'my_task' in locals(): my_task.hard_delete()
        if 'other_task' in locals(): other_task.hard_delete()
        if 'secret_task' in locals(): secret_task.hard_delete()
        if 'project' in locals(): project.hard_delete()
        if 'secret_project' in locals(): secret_project.hard_delete()
        if 'client' in locals(): client.hard_delete()
        if 'member_user' in locals(): member_user.delete()
        if 'other_member' in locals(): other_member.delete()
        if 'pm_user' in locals(): pm_user.delete()
        print("Cleanup completed.")

if __name__ == '__main__':
    run_rbac_test()

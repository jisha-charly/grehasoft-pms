import os
import django
import random
from django.core.files.uploadedfile import SimpleUploadedFile

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework.exceptions import PermissionDenied, NotAuthenticated
from apps.users.models import Role, Department
from apps.projects.models import Project, Client, ProjectMember
from apps.tasks.models import Task, TaskType, TaskAssignment, TaskFile, TaskReview
from apps.tasks.views import TaskFileViewSet, TaskReviewViewSet

User = get_user_model()

def run_workflow_test():
    print("=================== STARTING DELIVERABLE REVIEW WORKFLOW TEST ===================")
    
    # 1. Setup Roles and Users
    member_role, _ = Role.objects.get_or_create(name='TEAM_MEMBER', defaults={'permissions': ['VIEW_DASHBOARD', 'VIEW_PROJECTS', 'VIEW_TASKS', 'MANAGE_TASKS']})
    pm_role, _ = Role.objects.get_or_create(name='PROJECT_MANAGER', defaults={'permissions': ['VIEW_DASHBOARD', 'VIEW_PROJECTS', 'VIEW_TASKS', 'MANAGE_PROJECTS', 'MANAGE_TASKS']})
    dept, _ = Department.objects.get_or_create(name='Engineering')
    
    suffix = str(random.randint(1000, 9999))
    member_username = f'member_wf_{suffix}'
    pm_username = f'pm_wf_{suffix}'
    intruder_username = f'intruder_wf_{suffix}'
    
    member_user = User.objects.create_user(username=member_username, email=f'{member_username}@example.com', password='password', role=member_role, department=dept)
    pm_user = User.objects.create_user(username=pm_username, email=f'{pm_username}@example.com', password='password', role=pm_role, department=dept)
    intruder_user = User.objects.create_user(username=intruder_username, email=f'{intruder_username}@example.com', password='password', role=member_role, department=dept)
    
    # 2. Setup Project and Task
    client = Client.objects.create(name=f'Corp {suffix}', email=f'client_{suffix}@corp.com')
    project = Project.objects.create(name=f'Project {suffix}', client=client, department=dept, project_manager=pm_user, created_by=pm_user, start_date='2026-01-01', end_date='2026-12-31')
    
    ProjectMember.objects.create(project=project, user=member_user, role_in_project='MEMBER')
    # Intruder is NOT in the project!
    
    task_type, _ = TaskType.objects.get_or_create(name='DEVELOPMENT')
    task = Task.objects.create(project=project, title='Deliverable Task', description='Deliverable upload test', task_type=task_type, priority='medium', status='todo', due_date='2026-06-30', created_by=pm_user)
    
    factory = APIRequestFactory()
    
    # Simple mock file
    test_file = SimpleUploadedFile("mock_deliverable.pdf", b"pdf content", content_type="application/pdf")
    
    try:
        # A. TEAM_MEMBER uploads the file
        print("A. Testing TEAM_MEMBER file upload...")
        view_file = TaskFileViewSet.as_view({'post': 'create'})
        request = factory.post('/api/v1/task-files/', {
            'task': task.id,
            'file': test_file,
            'revision_no': 1,
            'uploaded_by': member_user.id
        }, format='multipart')
        force_authenticate(request, user=member_user)
        response = view_file(request)
        assert response.status_code == 201, f"Expected 201, got {response.status_code}"
        file_id = response.data['id']
        task_file = TaskFile.objects.get(id=file_id)
        assert task_file.revision_no == 1
        print("   [OK] TEAM_MEMBER uploaded file successfully.")

        # B. TEAM_MEMBER previews and downloads the file
        print("B. Testing TEAM_MEMBER preview and download...")
        view_actions = TaskFileViewSet.as_view({'get': 'preview'})
        request = factory.get(f'/api/v1/task-files/{file_id}/preview/')
        force_authenticate(request, user=member_user)
        response = view_actions(request, pk=file_id)
        assert response.status_code == 200
        assert response['Content-Disposition'] == 'inline; filename="mock_deliverable.pdf"'
        
        view_download = TaskFileViewSet.as_view({'get': 'download'})
        request = factory.get(f'/api/v1/task-files/{file_id}/download/')
        force_authenticate(request, user=member_user)
        response = view_download(request, pk=file_id)
        assert response.status_code == 200
        assert response['Content-Disposition'] == 'attachment; filename="mock_deliverable.pdf"'
        print("   [OK] TEAM_MEMBER preview and download endpoints work securely.")

        # C. PROJECT_MANAGER downloads and previews the file
        print("C. Testing PROJECT_MANAGER download and preview...")
        request = factory.get(f'/api/v1/task-files/{file_id}/preview/')
        force_authenticate(request, user=pm_user)
        response = view_actions(request, pk=file_id)
        assert response.status_code == 200
        
        request = factory.get(f'/api/v1/task-files/{file_id}/download/')
        force_authenticate(request, user=pm_user)
        response = view_download(request, pk=file_id)
        assert response.status_code == 200
        print("   [OK] PROJECT_MANAGER preview and download work successfully.")

        # D. INTRUDER (non-member) is blocked from download/preview
        print("D. Testing Intruder access block...")
        request = factory.get(f'/api/v1/task-files/{file_id}/preview/')
        force_authenticate(request, user=intruder_user)
        try:
            response = view_actions(request, pk=file_id)
            assert response.status_code in [403, 404], f"Expected 403 or 404, got {response.status_code}"
        except PermissionDenied:
            pass  # Expected behavior
            
        request = factory.get(f'/api/v1/task-files/{file_id}/download/')
        force_authenticate(request, user=intruder_user)
        try:
            response = view_download(request, pk=file_id)
            assert response.status_code in [403, 404], f"Expected 403 or 404, got {response.status_code}"
        except PermissionDenied:
            pass  # Expected behavior
        print("   [OK] Intruder blocked from accessing task files (HTTP 403).")

        # E. TEAM_MEMBER cannot review deliverables
        print("E. Testing TEAM_MEMBER review restriction...")
        view_review = TaskReviewViewSet.as_view({'post': 'create'})
        request = factory.post('/api/v1/task-reviews/', {
            'task_file': file_id,
            'comments': 'Unallowed approval comment',
            'status': 'approved'
        }, format='json')
        force_authenticate(request, user=member_user)
        try:
            response = view_review(request)
            assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        except PermissionDenied:
            pass  # Expected
        print("   [OK] TEAM_MEMBER blocked from performing reviews (HTTP 403).")

        # F. PROJECT_MANAGER creates a review (requests rework)
        print("F. Testing PROJECT_MANAGER review creation...")
        request = factory.post('/api/v1/task-reviews/', {
            'task_file': file_id,
            'comments': 'Please increase image margin and re-upload.',
            'status': 'rework'
        }, format='json')
        force_authenticate(request, user=pm_user)
        response = view_review(request)
        assert response.status_code == 201
        review_id = response.data['id']
        review = TaskReview.objects.get(id=review_id)
        assert review.status == 'rework'
        print("   [OK] PROJECT_MANAGER reviewed file and requested rework successfully.")

        # G. TEAM_MEMBER uploads a revision
        print("G. Testing revision versioning...")
        test_file_rev = SimpleUploadedFile("mock_deliverable.pdf", b"pdf content revised", content_type="application/pdf")
        request = factory.post('/api/v1/task-files/', {
            'task': task.id,
            'file': test_file_rev,
            'revision_no': 2,
            'uploaded_by': member_user.id
        }, format='multipart')
        force_authenticate(request, user=member_user)
        response = view_file(request)
        assert response.status_code == 201
        file_rev_id = response.data['id']
        task_file_rev = TaskFile.objects.get(id=file_rev_id)
        assert task_file_rev.revision_no == 2
        print("   [OK] TEAM_MEMBER uploaded revision (v2) successfully.")

        print("\n[SUCCESS] DELIVERABLE REVIEW WORKFLOW CHECKS PASSED SUCCESSFULLY!")

    finally:
        print("Cleaning up database state...")
        if 'task_file' in locals(): task_file.hard_delete()
        if 'task_file_rev' in locals(): task_file_rev.hard_delete()
        if 'task' in locals(): task.hard_delete()
        if 'project' in locals(): project.hard_delete()
        if 'client' in locals(): client.hard_delete()
        if 'member_user' in locals(): member_user.delete()
        if 'pm_user' in locals(): pm_user.delete()
        if 'intruder_user' in locals(): intruder_user.delete()
        print("Cleanup completed.")

if __name__ == '__main__':
    run_workflow_test()

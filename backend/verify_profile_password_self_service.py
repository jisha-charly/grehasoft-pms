import os
import sys
import django
import random

sys.path.append(r'D:\grehasoft pms 28_3_26\jisha\grehasoftnew\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from apps.users.models import Role, Department

User = get_user_model()

def run_comprehensive_test():
    print("=================== STARTING PROFILE & PASSWORD REGRESSION TEST ===================")
    
    # 1. Define roles list
    roles_to_test = [
        'SUPER_ADMIN',
        'ADMIN',
        'PROJECT_MANAGER',
        'TEAM_MEMBER',
        'SALES_MANAGER',
        'SALES_EXECUTIVE',
        'SEO_MANAGER',
        'SEO_EXECUTIVE',
        'CLIENT'
    ]
    
    dept, _ = Department.objects.get_or_create(name='Engineering')
    client = APIClient()
    
    users_created = []
    
    try:
        # Create a user for each role
        user_map = {}
        for role_name in roles_to_test:
            if role_name == 'SUPER_ADMIN':
                role_obj, _ = Role.objects.get_or_create(name=role_name, defaults={'permissions': ['MANAGE_USERS', 'MANAGE_SETTINGS']})
            else:
                role_obj, _ = Role.objects.get_or_create(name=role_name, defaults={'permissions': []})
                
            suffix = str(random.randint(1000, 9999))
            username = f'user_{role_name.lower()}_{suffix}'
            email = f'{username}@example.com'
            
            is_super = (role_name == 'SUPER_ADMIN')
            user = User.objects.create_user(
                username=username,
                email=email,
                password='old_password123',
                role=role_obj,
                department=dept,
                name=f'Name {role_name}',
                is_superuser=is_super,
                is_staff=is_super
            )
            users_created.append(user)
            user_map[role_name] = user
            
        # Run test cases
        for role_name, user in user_map.items():
            print(f"\n--- Testing role: {role_name} ---")
            client.force_authenticate(user=user)
            
            # A. Test profile update (allowed fields)
            print(f"  A. Updating own profile...")
            # For CLIENT, only profile_photo is allowed, otherwise returns 403.
            if role_name == 'CLIENT':
                from PIL import Image
                import io
                from django.core.files.uploadedfile import SimpleUploadedFile
                
                img = Image.new('RGB', (1, 1), color='red')
                buf = io.BytesIO()
                img.save(buf, format='PNG')
                test_photo = SimpleUploadedFile("avatar.png", buf.getvalue(), content_type="image/png")
                payload = {'profile_photo': test_photo}
            else:
                payload = {
                    'name': f'New Name {role_name}',
                    'address': 'New Address 123'
                }
                
            if role_name == 'CLIENT':
                response = client.patch('/api/v1/users/profile/', payload, format='multipart')
            else:
                response = client.patch('/api/v1/users/profile/', payload, format='json')
            assert response.status_code == 200, f"Expected 200, got {response.status_code}. Data: {response.data}"
            if role_name != 'CLIENT':
                assert response.data['name'] == f'New Name {role_name}'
                assert response.data['address'] == 'New Address 123'
            print(f"     [OK] Profile updated successfully.")
            
            # B. Test forbidden profile fields (e.g. role, salary)
            if role_name != 'CLIENT':
                print(f"  B. Testing forbidden fields rejection...")
                for forbidden_field in ['role', 'salary_monthly', 'is_superuser', 'is_staff', 'permissions']:
                    response = client.patch('/api/v1/users/profile/', {forbidden_field: 'any_value'}, format='json')
                    assert response.status_code == 400, f"Expected 400 validation error for field {forbidden_field}, got {response.status_code}"
                print(f"     [OK] Forbidden fields correctly blocked.")
            
            # C. Test password change
            print(f"  C. Changing own password...")
            response = client.post('/api/v1/users/change-password/', {
                'currentPassword': 'old_password123',
                'newPassword': 'SecurePassword123!'
            }, format='json')
            assert response.status_code == 200, f"Expected 200, got {response.status_code}. Data: {response.data}"
            print(f"     [OK] Password changed successfully.")
            
        # D. Test cross-user modification protection (User A trying to update User B's profile or password)
        print("\n--- Testing cross-user boundaries ---")
        user_a = user_map['TEAM_MEMBER']
        user_b = user_map['PROJECT_MANAGER']
        
        # User A authenticates
        client.force_authenticate(user=user_a)
        
        # User A attempts to edit User B's profile directly via UserViewSet (not profile endpoint)
        print("  D1. Team Member attempting to update Project Manager profile via viewset...")
        response = client.patch(f'/api/v1/users/{user_b.id}/', {'name': 'Hack Name'}, format='json')
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("      [OK] Correctly blocked cross-user profile update (HTTP 403).")
        
        # E. Verify SUPER_ADMIN administrative CRUD remains fully functional
        print("\n--- Testing SUPER_ADMIN administrative privileges ---")
        super_admin = user_map['SUPER_ADMIN']
        client.force_authenticate(user=super_admin)
        
        # Super admin updates User B's profile details via UserViewSet
        print("  E1. Super Admin updating Project Manager profile details via viewset...")
        response = client.patch(f'/api/v1/users/{user_b.id}/', {'name': 'PM Name Updated By Super'}, format='json')
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert response.data['name'] == 'PM Name Updated By Super'
        print("      [OK] Super Admin successfully performed administrative profile update.")
        
        print("\n[SUCCESS] ALL SELF-SERVICE REGRESSION CHECKS PASSED SUCCESSFULLY!")
        
    finally:
        print("\nCleaning up database state...")
        for u in users_created:
            u.delete()
        print("Cleanup completed.")

if __name__ == '__main__':
    run_comprehensive_test()

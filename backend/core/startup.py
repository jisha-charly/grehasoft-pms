import os
from django.contrib.auth import get_user_model
# pyrefly: ignore [missing-import]
from apps.users.models import Role


def create_super_admin():
    try:
        username = os.getenv("SUPERADMIN_USERNAME", "admin")
        email = os.getenv("SUPERADMIN_EMAIL", "admin@gmail.com")
        password = os.getenv("SUPERADMIN_PASSWORD", "Admin@123")

        User = get_user_model()

        # check if user already exists
        user = User.objects.filter(email=email).first()

        if not user:
            user = User.objects.create_superuser(
                username=username,
                email=email,
                password=password
            )

            role, created = Role.objects.get_or_create(name="SUPER_ADMIN")
            user.role = role
            user.save()

            print("Super Admin created")

        else:
            print("Super Admin already exists")
            
        seed_infrastructure_permissions()
    except Exception as e:
        print("Startup warning (migrations may not be applied yet):", e)

def seed_infrastructure_permissions():
    try:
        # pyrefly: ignore [missing-import]
        from apps.users.models import Role
        for role_name in ["SUPER_ADMIN", "ADMIN", "INFRASTRUCTURE_MANAGER"]:
            role, created = Role.objects.get_or_create(name=role_name)
            if role.permissions is None:
                role.permissions = []
            if not isinstance(role.permissions, list):
                role.permissions = list(role.permissions)
            if "MANAGE_INFRASTRUCTURE" not in role.permissions:
                role.permissions.append("MANAGE_INFRASTRUCTURE")
                role.save()
                print(f"Added MANAGE_INFRASTRUCTURE permission to role: {role_name}")
    except Exception as e:
        print("Startup warning (seeding permissions failed):", e)

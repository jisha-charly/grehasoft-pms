import os
from django.contrib.auth import get_user_model
from apps.users.models import Role


def create_super_admin():
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
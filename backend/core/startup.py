import os
from django.contrib.auth import get_user_model
from apps.users.models import UserRole

def create_super_admin():
    username = os.getenv("SUPERADMIN_USERNAME")
    email = os.getenv("SUPERADMIN_EMAIL")
    password = os.getenv("SUPERADMIN_PASSWORD")

    if not username or not password:
        return

    User = get_user_model()

    if not User.objects.filter(username=username).exists():
        user = User.objects.create_superuser(
            username=username,
            email=email,
            password=password
        )

        role, created = UserRole.objects.get_or_create(name="SUPER_ADMIN")
        user.role = role
        user.save()

        print("Super Admin created")
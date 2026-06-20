from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.users.models import Role
from apps.seo.models import SEOActivityType

User = get_user_model()

class Command(BaseCommand):
    help = "Seed SEO Manager and Executive roles, permissions, configurable activity types, and test users"

    def add_arguments(self, parser):
        parser.add_argument(
            "--demo",
            action="store_true",
            help="Create demo/test accounts for SEO Manager and SEO Executives"
        )

    def handle(self, *args, **options):
        self.stdout.write("Seeding SEO Activity Types...")
        default_activities = [
            "Blog Submission",
            "Bookmarking",
            "Profile Creation",
            "Directory Submission",
            "Article Submission",
            "Web 2.0",
            "Image Submission",
            "PDF Submission",
            "PPT Submission",
            "Forum Submission",
            "Guest Posting",
            "Social Bookmarking",
            "Local Citation",
            "Classified Submission"
        ]

        for name in default_activities:
            obj, created = SEOActivityType.objects.get_or_create(name=name)
            if created:
                self.stdout.write(f"Created Activity Type: {name}")

        self.stdout.write("Seeding SEO Roles and Permissions...")
        # SEO Manager permissions
        manager_perms = [
            "VIEW_DASHBOARD",
            "VIEW_PROJECTS",
            "VIEW_TASKS",
            "VIEW_CLIENTS",
            "VIEW_REMINDERS",
            "MANAGE_REMINDERS",
            "VIEW_SEO_DASHBOARD",
            "MANAGE_SEO_WEBSITES",
            "VIEW_SEO_WEBSITES",
            "MANAGE_SEO_ACTIVITIES",
            "VIEW_SEO_ACTIVITIES",
            "MANAGE_SEO_TARGETS",
            "MANAGE_SEO_TASKS",
            "VIEW_SEO_TASKS",
            "MANAGE_SEO_REMINDERS",
            "VIEW_SEO_REMINDERS",
            "IMPORT_SEO_ACTIVITIES",
            "EXPORT_SEO_REPORTS"
        ]

        manager_role, created = Role.objects.get_or_create(name="SEO_MANAGER")
        manager_role.description = "SEO Manager role with full target setting and review access"
        manager_role.permissions = manager_perms
        manager_role.save()
        self.stdout.write(f"Configured SEO_MANAGER role (Created: {created})")

        # SEO Executive permissions
        exec_perms = [
            "VIEW_DASHBOARD",
            "VIEW_PROJECTS",
            "VIEW_TASKS",
            "VIEW_CLIENTS",
            "VIEW_REMINDERS",
            "VIEW_SEO_DASHBOARD",
            "VIEW_SEO_WEBSITES",
            "MANAGE_SEO_ACTIVITIES",
            "VIEW_SEO_ACTIVITIES",
            "VIEW_SEO_TASKS",
            "VIEW_SEO_REMINDERS",
            "EXPORT_SEO_REPORTS"
        ]

        exec_role, created = Role.objects.get_or_create(name="SEO_EXECUTIVE")
        exec_role.description = "SEO Executive role for logging daily work and tracking tasks"
        exec_role.permissions = exec_perms
        exec_role.save()
        self.stdout.write(f"Configured SEO_EXECUTIVE role (Created: {created})")

        if options["demo"]:
            self.stdout.write("Seeding SEO Demo Users...")
            # Create SEO Manager User
            manager_user, created = User.objects.get_or_create(
                username="seomanager",
                defaults={
                    "email": "seomanager@grehasoft.com",
                    "name": "SEO Manager",
                    "role": manager_role,
                    "status": "active"
                }
            )
            if created:
                manager_user.set_password("Manager@123")
                manager_user.save()
                self.stdout.write("Created test user: seomanager / Manager@123")
            else:
                manager_user.role = manager_role
                manager_user.save()

            # Create 4 SEO Executives
            for i in range(1, 5):
                exec_user, created = User.objects.get_or_create(
                    username=f"exec{i}",
                    defaults={
                        "email": f"exec{i}@grehasoft.com",
                        "name": f"SEO Executive {i}",
                        "role": exec_role,
                        "status": "active"
                    }
                )
                if created:
                    exec_user.set_password("Executive@123")
                    exec_user.save()
                    self.stdout.write(f"Created test user: exec{i} / Executive@123")
                else:
                    exec_user.role = exec_role
                    exec_user.save()

        self.stdout.write("Successfully seeded all SEO roles, permissions, and default activity types.")

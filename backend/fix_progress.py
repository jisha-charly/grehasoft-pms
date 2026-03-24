import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.projects.models import Project, Milestone, update_milestone_progress, update_project_progress

for m in Milestone.objects.all():
    update_milestone_progress(m)

for p in Project.objects.all():
    update_project_progress(p)

print("Progress recalculated safely for all milestones and projects.")

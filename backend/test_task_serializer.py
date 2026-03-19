import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
django.setup()

from apps.tasks.serializers import TaskSerializer
from apps.users.models import CustomUser

# Create dummy payload simulating the frontend
payload = {
  "project": 48, # From the screenshot URL /projects/48
  "milestone": None, # Could be 1
  "title": "facebook one",
  "description": "test",
  "priority": "low",
  "status": "todo",
  "due_date": "2026-03-23",
  "task_type": 1, # ID of SEO task type
  "assignees": [1] # ID of assigne
}

# Add user to avoid created_by missing
user = CustomUser.objects.order_by('id').first()
serializer = TaskSerializer(data=payload)

if serializer.is_valid():
    print("Serializer is VALID")
    print(serializer.validated_data)
else:
    print("Serializer is INVALID. 400 Bad Request.")
    print("Errors:", serializer.errors)

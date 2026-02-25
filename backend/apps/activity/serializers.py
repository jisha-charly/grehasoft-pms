from rest_framework import serializers
from .models import ActivityLog
from apps.users.serializers import UserSerializer

class ActivityLogSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    task_name = serializers.CharField(source='task.title', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)

    class Meta:
        model = ActivityLog
        fields = [
            'id', 'user', 'user_details', 'project', 'project_name', 
            'task', 'task_name', 'action', 'created_at'
        ]
        read_only_fields = ['created_at']

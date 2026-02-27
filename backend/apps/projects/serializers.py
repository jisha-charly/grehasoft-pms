from rest_framework import serializers
from .models import Project, Client, Milestone, ProjectMember,ActivityLog
from apps.users.serializers import UserSerializer  # adjust import if needed

class ProjectMemberSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source="user", read_only=True)

    class Meta:
        model = ProjectMember
        fields = "__all__"
class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = '__all__'

class MilestoneSerializer(serializers.ModelSerializer):
    progress_percentage = serializers.SerializerMethodField()

    class Meta:
        model = Milestone
        fields = "__all__"  # this will automatically include progress_percentage

    def get_progress_percentage(self, obj):
     tasks = obj.tasks.filter(deleted_at__isnull=True)

     total = tasks.count()
     if total == 0:
        return 0

     completed = tasks.filter(status='done').count()
     return int((completed / total) * 100)

class ProjectSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.company_name', read_only=True)
    milestones = MilestoneSerializer(many=True, read_only=True)
    progress_percentage = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = '__all__'

    def get_progress_percentage(self, obj):
        tasks = obj.tasks.filter(deleted_at__isnull=True)

        total = tasks.count()
        if total == 0:
            return 0

        completed = tasks.filter(status='done').count()
        return int((completed / total) * 100)





class ProjectMemberSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source="user", read_only=True)

    class Meta:
        model = ProjectMember
        fields = "__all__"


class ActivityLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityLog
        fields = "__all__"
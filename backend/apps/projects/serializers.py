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
    progress_percentage = serializers.IntegerField(source='progress', read_only=True)

    class Meta:
        model = Milestone
        fields = "__all__"

class ProjectSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.company_name', read_only=True)
    milestones = MilestoneSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = '__all__'



class ProjectMemberSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source="user", read_only=True)

    class Meta:
        model = ProjectMember
        fields = "__all__"


class ActivityLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.name', read_only=True)
    description = serializers.CharField(source='action', read_only=True)

    class Meta:
        model = ActivityLog
        fields = "__all__"
from rest_framework import serializers
from .models import Project, Client, ProjectMilestone, ProjectMember

class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = '__all__'

class ProjectMilestoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectMilestone
        fields = '__all__'

class ProjectSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.company_name', read_only=True)
    milestones = ProjectMilestoneSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = '__all__'

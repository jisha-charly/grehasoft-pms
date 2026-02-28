from rest_framework import serializers
from .models import Lead, LeadAssignment, LeadFollowup
from apps.users.serializers import UserSerializer
from apps.projects.models import Client
from apps.projects.serializers import ClientSerializer
class LeadFollowupSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)

    class Meta:
        model = LeadFollowup
        fields = '__all__'
        read_only_fields = ['created_by']

class LeadAssignmentSerializer(serializers.ModelSerializer):
    sales_exec_details = UserSerializer(source='sales_exec', read_only=True)

    class Meta:
        model = LeadAssignment
        fields = '__all__'

class LeadSerializer(serializers.ModelSerializer):
    followups = LeadFollowupSerializer(many=True, read_only=True)
    assignments = LeadAssignmentSerializer(many=True, read_only=True)

    # 🔥 Show project name
    converted_project_name = serializers.CharField(
        source='converted_project.name',
        read_only=True
    )

    # 🔥 Show client name (readable)
    client_name = serializers.CharField(
        source='client.name',
        read_only=True
    )

    # 🔥 Accept client_id when creating/updating
    client = serializers.PrimaryKeyRelatedField(
        queryset=Client.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = Lead
        fields = [
            'id',
            'name',
            'email',
            'phone',
            'source',
            'status',

            # 🔥 NEW
            'client',
            'client_name',

            'converted_project',
            'converted_project_name',

            'followups',
            'assignments',

            'created_at',
            'updated_at'
        ]

        read_only_fields = ['converted_project']
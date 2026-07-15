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
    company_name = serializers.CharField(required=True, allow_blank=False)
    name = serializers.CharField(required=False, allow_blank=True, default="")
    email = serializers.EmailField(required=False, allow_blank=True, default="")
    phone = serializers.CharField(required=False, allow_blank=True, default="")
    source = serializers.CharField(required=False, allow_blank=True, default="Website")
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

    # ✨ Array fields - validate as lists
    service_required = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_empty=True
    )
    documents_given = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_empty=True
    )
    login_credentials = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_empty=True
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

            # 🔥 Existing
            'client',
            'client_name',
            'converted_project',
            'converted_project_name',

            # ✨ NEW - Lead Source
            'enquiry_from',
            'how_contacted',
            'contacted_person',
            'reference_person',

            # ✨ NEW - Company
            'company_name',

            # ✨ NEW - Services
            'service_required',

            # ✨ NEW - Project Details
            'client_requirements',
            'details_given',
            'competitor_websites',

            # ✨ NEW - Assets
            'documents_given',
            'login_credentials',

            'followups',
            'assignments',

            'created_at',
            'updated_at'
        ]

        read_only_fields = ['converted_project']

    def validate_service_required(self, value):
        """Ensure service_required is a list"""
        if not isinstance(value, list):
            raise serializers.ValidationError("service_required must be a list of strings")
        return value

    def validate_documents_given(self, value):
        """Ensure documents_given is a list"""
        if not isinstance(value, list):
            raise serializers.ValidationError("documents_given must be a list of strings")
        return value

    def validate_login_credentials(self, value):
        """Ensure login_credentials is a list"""
        if not isinstance(value, list):
            raise serializers.ValidationError("login_credentials must be a list of strings")
        return value
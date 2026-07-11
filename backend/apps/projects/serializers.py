from rest_framework import serializers
from .models import Project, Client, Milestone, ProjectMember,ActivityLog
from apps.users.serializers import UserSerializer  # adjust import if needed

class ProjectMemberSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source="user", read_only=True)

    class Meta:
        model = ProjectMember
        fields = "__all__"
class ClientSerializer(serializers.ModelSerializer):
    gst_number = serializers.CharField(
        source="gst_no",
        allow_blank=True,
        allow_null=True,
        required=False
    )

    class Meta:
        model = Client
        fields = [
            'id',
            'name',
            'email',
            'phone',
            'company_name',
            'gst_number',
            'address',
            'created_at',
            'updated_at'
        ]

    def validate_email(self, value):
        qs = Client.objects.filter(email=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A client with this email address already exists.")
        return value


class MilestoneSerializer(serializers.ModelSerializer):
    progress_percentage = serializers.IntegerField(source='progress', read_only=True)

    class Meta:
        model = Milestone
        fields = "__all__"

class ClientSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = ["id", "company_name", "name", "email"]

class ProjectSerializer(serializers.ModelSerializer):
    client = ClientSummarySerializer(read_only=True)
    client_id = serializers.PrimaryKeyRelatedField(
        source="client",
        queryset=Client.objects.all(),
        write_only=True,
        required=False,
    )
    client_name = serializers.CharField(source='client.name', read_only=True)
    client_company = serializers.CharField(source='client.company_name', read_only=True)
    client_email = serializers.EmailField(source='client.email', read_only=True)
    milestones = MilestoneSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = '__all__'

    def to_internal_value(self, data):
        # Backward compatibility for frontend when it passes client as ID instead of client_id
        if 'client' in data:
            val = data['client']
            if isinstance(val, list) and val:
                val = val[0]
            if isinstance(val, (int, str, float)):
                data = data.copy()
                data['client_id'] = val
                data.pop('client', None)
        return super().to_internal_value(data)



class ProjectMemberSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source="user", read_only=True)

    class Meta:
        model = ProjectMember
        fields = "__all__"
        validators = []

    def validate(self, attrs):
        project = attrs.get('project')
        user = attrs.get('user')
        
        if not self.instance and project and user:
            if ProjectMember.objects.filter(project=project, user=user).exists():
                raise serializers.ValidationError("This user is already assigned to this project.")
        return attrs


class ActivityLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.name', read_only=True)
    description = serializers.CharField(source='action', read_only=True)

    class Meta:
        model = ActivityLog
        fields = "__all__"
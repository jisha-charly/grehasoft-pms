from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, WorkSession, ActivityLog


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for UserProfile."""
    class Meta:
        model = UserProfile
        fields = ['id', 'user_id', 'is_tracking_enabled', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class WorkSessionSerializer(serializers.ModelSerializer):
    """Serializer for WorkSession."""
    total_duration_seconds = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    class Meta:
        model = WorkSession
        fields = [
            'id', 'user_id', 'login_time', 'last_ping', 'logout_time',
            'is_active_session', 'total_duration_seconds', 'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_total_duration_seconds(self, obj):
        """Get duration in seconds."""
        duration = obj.calculate_duration()
        return int(duration.total_seconds())

    def get_status(self, obj):
        """Get current status."""
        return obj.get_status()


class EmployeeStatusSerializer(serializers.Serializer):
    """Serializer for employee status overview."""
    user_id = serializers.IntegerField()
    username = serializers.CharField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    email = serializers.EmailField()
    is_tracking_enabled = serializers.BooleanField()
    status = serializers.CharField()
    login_time = serializers.DateTimeField()
    first_login_time = serializers.DateTimeField(allow_null=True, required=False)
    last_ping = serializers.DateTimeField()
    total_work_time = serializers.CharField()  # HH:MM:SS format
    session_id = serializers.IntegerField(allow_null=True)


class ActivityLogSerializer(serializers.ModelSerializer):
    """Serializer for ActivityLog."""
    class Meta:
        model = ActivityLog
        fields = ['id', 'user_id', 'session_id', 'activity_type', 'timestamp']
        read_only_fields = ['id', 'timestamp']


class HeartbeatRequestSerializer(serializers.Serializer):
    """Serializer for heartbeat API request."""
    user_id = serializers.IntegerField()
    timestamp = serializers.DateTimeField(required=False)


class HeartbeatResponseSerializer(serializers.Serializer):
    """Serializer for heartbeat API response."""
    success = serializers.BooleanField()
    message = serializers.CharField()
    session_id = serializers.IntegerField(allow_null=True)
    status = serializers.CharField()

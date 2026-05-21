from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, WorkSession, ActivityLog, AppActivity


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for UserProfile."""
    class Meta:
        model = UserProfile
        fields = ['id', 'user_id', 'is_tracking_enabled', 'screenshots_enabled', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class WorkSessionSerializer(serializers.ModelSerializer):
    """Serializer for WorkSession."""
    total_duration_seconds = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    class Meta:
        model = WorkSession
        fields = [
            'id', 'user_id', 'login_time', 'last_ping', 'logout_time',
            'is_active_session', 'total_duration_seconds', 'status',
            'mouse_moves', 'key_presses', 'clicks', 'productive_seconds', 'idle_seconds',
            'tracked_seconds', 'break_count', 'activity_percentage',
            'created_at', 'updated_at'
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
    first_name = serializers.CharField(allow_blank=True, required=False)
    last_name = serializers.CharField(allow_blank=True, required=False)
    full_name = serializers.CharField(allow_blank=True, required=False)
    email = serializers.EmailField()
    employee_code = serializers.CharField(allow_blank=True, required=False)
    is_tracking_enabled = serializers.BooleanField()
    screenshots_enabled = serializers.BooleanField()
    status = serializers.CharField()
    login_time = serializers.DateTimeField(allow_null=True, required=False)
    first_login_time = serializers.DateTimeField(allow_null=True, required=False)
    last_ping = serializers.DateTimeField(allow_null=True, required=False)
    total_work_time = serializers.CharField()  # HH:MM:SS format
    idle_time = serializers.CharField(allow_blank=True, required=False)
    activity_percentage = serializers.FloatField(required=False)
    productive_time = serializers.CharField(allow_blank=True, required=False)
    non_productive_time = serializers.CharField(allow_blank=True, required=False)
    total_tracked_time = serializers.CharField(allow_blank=True, required=False)
    session_id = serializers.IntegerField(allow_null=True)
    current_app = serializers.CharField(allow_blank=True, required=False, allow_null=True)
    current_window = serializers.CharField(allow_blank=True, required=False, allow_null=True)
    mouse_moves = serializers.IntegerField(required=False)
    key_presses = serializers.IntegerField(required=False)
    clicks = serializers.IntegerField(required=False)
    productive_seconds = serializers.IntegerField(required=False)
    idle_seconds = serializers.IntegerField(required=False)



class ActivityLogSerializer(serializers.ModelSerializer):
    """Serializer for ActivityLog."""
    class Meta:
        model = ActivityLog
        fields = ['id', 'user_id', 'session_id', 'activity_type', 'timestamp']
        read_only_fields = ['id', 'timestamp']


class AppActivitySerializer(serializers.ModelSerializer):
    """Serializer for AppActivity."""
    class Meta:
        model = AppActivity
        fields = [
            'id', 'user_id', 'session_id', 'app_name', 'window_title',
            'duration_seconds', 'mouse_moves', 'key_presses', 'clicks', 'productive_seconds',
            'timestamp', 'is_productive'
        ]
        read_only_fields = ['id', 'timestamp']


class EmployeeDetailedStatusSerializer(EmployeeStatusSerializer):
    """Serializer for employee detailed status for drawer."""
    app_activities = AppActivitySerializer(many=True, required=False)
    timeline_data = serializers.ListField(child=serializers.DictField(), required=False)



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

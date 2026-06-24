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
            'is_active_session', 'session_type', 'total_duration_seconds', 'status',
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
    desktop_work_time = serializers.CharField(allow_blank=True, required=False)
    portal_active_time = serializers.CharField(allow_blank=True, required=False)
    break_time = serializers.CharField(allow_blank=True, required=False)
    unaccounted_time = serializers.CharField(allow_blank=True, required=False)
    total_engagement_time = serializers.CharField(allow_blank=True, required=False)
    session_id = serializers.IntegerField(allow_null=True)
    session_type = serializers.CharField(allow_blank=True, required=False, allow_null=True)
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
    app_name = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    current_app = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    window_title = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    current_window = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    duration_seconds = serializers.IntegerField(required=False, default=10)
    is_idle = serializers.BooleanField(required=False, default=False)
    mouse_moves = serializers.IntegerField(required=False, default=0)
    key_presses = serializers.IntegerField(required=False, default=0)
    clicks = serializers.IntegerField(required=False, default=0)
    productive_seconds = serializers.IntegerField(required=False, default=0)
    idle_seconds = serializers.IntegerField(required=False, default=0)
    timestamp = serializers.DateTimeField(required=False)
    user_id = serializers.IntegerField(required=False)
    username = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    device_id = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    installation_uuid = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    tracker_id = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    machine_fingerprint = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    def save(self, user):
        from django.utils import timezone
        from .utils import get_or_create_active_session, update_session_ping
        from .models import AppActivity

        validated_data = self.validated_data
        
        device_id = validated_data.get('device_id') or 'default'
        installation_uuid = validated_data.get('installation_uuid')
        tracker_id = validated_data.get('tracker_id')
        machine_fingerprint = validated_data.get('machine_fingerprint')

        # Get or create active session isolated by device_id
        session, created = get_or_create_active_session(user, device_id=device_id)

        # Save unique identifiers to session
        if created or not session.installation_uuid:
            session.installation_uuid = installation_uuid
            session.tracker_id = tracker_id
            session.machine_fingerprint = machine_fingerprint
            session.save(update_fields=['installation_uuid', 'tracker_id', 'machine_fingerprint'])
        
        # Extract telemetry fields with clean fallbacks
        app_name = validated_data.get('app_name') or validated_data.get('current_app')
        window_title = validated_data.get('window_title') or validated_data.get('current_window') or ''
        duration_seconds = validated_data.get('duration_seconds', 10)
        
        # Update login_time and last_ping based on timestamp and duration
        timestamp = validated_data.get('timestamp') or timezone.now()
        from datetime import timedelta
        
        if created:
            session.login_time = timestamp - timedelta(seconds=duration_seconds)
            session.last_ping = timestamp
            session.save(update_fields=['login_time', 'last_ping'])
        else:
            session.refresh_from_db()
            if timestamp < session.login_time:
                session.login_time = timestamp - timedelta(seconds=duration_seconds)
            if timestamp > session.last_ping:
                session.last_ping = timestamp
            session.save(update_fields=['login_time', 'last_ping'])
        is_idle = validated_data.get('is_idle', False)
        mouse_moves = validated_data.get('mouse_moves', 0)
        key_presses = validated_data.get('key_presses', 0)
        clicks = validated_data.get('clicks', 0)

        # Log details inside DB update context
        print("DATABASE SAVE - Telemetry:", {
            "app_name": app_name,
            "window_title": window_title,
            "mouse_moves": mouse_moves,
            "key_presses": key_presses,
            "clicks": clicks,
            "is_idle": is_idle
        })

        is_desktop = (device_id != 'default') or (app_name is not None) or (mouse_moves > 0 or key_presses > 0 or clicks > 0)
        
        if is_desktop:
            # Refresh session from database before incrementing fields to prevent race conditions
            session.refresh_from_db()
            
            from .reports import classify_app_activity
            category = classify_app_activity(app_name or "", window_title or "")
            is_productive_app = (category != 'non_productive')
            
            is_productive_tick = (not is_idle) and (mouse_moves > 0 or key_presses > 0 or clicks > 0)
            if is_productive_tick:
                tick_productive_seconds = duration_seconds
                tick_idle_seconds = 0
            else:
                tick_productive_seconds = 0
                tick_idle_seconds = duration_seconds
            
            session.last_desktop_ping = timezone.now()
            session.is_desktop_idle = is_idle
            session.mouse_moves += mouse_moves
            session.key_presses += key_presses
            session.clicks += clicks
            session.productive_seconds += tick_productive_seconds
            session.idle_seconds += tick_idle_seconds
            session.tracked_seconds = session.productive_seconds + session.idle_seconds
            
            if session.tracked_seconds > 0:
                session.activity_percentage = min(100.0, (session.productive_seconds / session.tracked_seconds) * 100.0)
            else:
                session.activity_percentage = 0.0
                
            from .reports import detect_breaks_and_gaps
            today = timezone.now().date()
            break_analysis = detect_breaks_and_gaps(user, today, today, sessions_list=[session])
            session.break_count = break_analysis['break_count']
                
            session.save(update_fields=[
                'last_desktop_ping', 'is_desktop_idle', 'mouse_moves', 
                'key_presses', 'clicks', 'productive_seconds', 'idle_seconds', 
                'tracked_seconds', 'break_count', 'activity_percentage', 'updated_at'
            ])
            
            # --- START TELEMETRY LOGGING ---
            print(f"[HEARTBEAT TELEMETRY LOG] Session ID: {session.id}")
            print(f"  - productive_seconds: {session.productive_seconds}")
            print(f"  - idle_seconds: {session.idle_seconds}")
            print(f"  - activity_percentage: {session.activity_percentage}")
            # --- END TELEMETRY LOGGING ---
  
            session.refresh_from_db()

            if app_name:
                # Aggregate duration if the active app/window has not changed
                last_activity = AppActivity.objects.filter(session=session).order_by('-timestamp').first()
                if last_activity and last_activity.app_name == app_name and last_activity.window_title == window_title:
                    last_activity.duration_seconds += duration_seconds
                    last_activity.mouse_moves += mouse_moves
                    last_activity.key_presses += key_presses
                    last_activity.clicks += clicks
                    last_activity.productive_seconds += tick_productive_seconds
                    last_activity.productive_duration += tick_productive_seconds
                    last_activity.timestamp = timezone.now()
                    last_activity.save(update_fields=['duration_seconds', 'mouse_moves', 'key_presses', 'clicks', 'productive_seconds', 'productive_duration', 'timestamp'])
                else:
                    AppActivity.objects.create(
                        user=user,
                        session=session,
                        app_name=app_name,
                        window_title=window_title,
                        duration_seconds=duration_seconds,
                        mouse_moves=mouse_moves,
                        key_presses=key_presses,
                        clicks=clicks,
                        productive_seconds=tick_productive_seconds,
                        productive_duration=tick_productive_seconds,
                        timestamp=timezone.now()
                    )
        
        return session, created


class HeartbeatResponseSerializer(serializers.Serializer):
    """Serializer for heartbeat API response."""
    success = serializers.BooleanField()
    message = serializers.CharField()
    session_id = serializers.IntegerField(allow_null=True)
    status = serializers.CharField()

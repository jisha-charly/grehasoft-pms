from django.db import models
from django.conf import settings
from django.utils import timezone


class UserProfile(models.Model):
    """Extended user profile with tracking configuration."""
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='tracking_profile')
    is_tracking_enabled = models.BooleanField(default=False)
    screenshots_enabled = models.BooleanField(default=True)  # Admin option to disable screenshots
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tracking_user_profile'
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['is_tracking_enabled']),
        ]

    def __str__(self):
        return f"{self.user.username} - Tracking: {self.is_tracking_enabled} (Screenshots: {self.screenshots_enabled})"


class WorkSession(models.Model):
    """Track user work sessions with activity status."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='work_sessions')
    login_time = models.DateTimeField(auto_now_add=True)
    last_ping = models.DateTimeField(default=timezone.now)
    logout_time = models.DateTimeField(null=True, blank=True)
    is_active_session = models.BooleanField(default=True)
    
    # Additional tracking fields
    total_duration = models.DurationField(null=True, blank=True)  # Cached duration
    last_desktop_ping = models.DateTimeField(null=True, blank=True)
    is_desktop_idle = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tracking_work_session'
        indexes = [
            models.Index(fields=['user', 'is_active_session']),
            models.Index(fields=['user', 'login_time']),
            models.Index(fields=['last_ping']),
            models.Index(fields=['last_desktop_ping']),
            models.Index(fields=['login_time']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['user'],
                condition=models.Q(is_active_session=True),
                name='only_one_active_session_per_user'
            )
        ]

    def __str__(self):
        status = "Active" if self.is_active_session else "Inactive"
        return f"{self.user.username} - {self.login_time.date()} ({status})"

    def calculate_duration(self):
        """Calculate session duration."""
        if self.logout_time:
            duration = self.logout_time - self.login_time
        else:
            duration = timezone.now() - self.login_time
        
        # Prevent negative durations
        return max(duration, timezone.timedelta(0))

    def get_status(self):
        """
        Get current activity status.
        Prioritizes Desktop Tracker pings if the desktop tracker is active.
        Falls back to web browser pings if the desktop tracker is not active.
        """
        if not self.is_active_session:
            return 'Offline'
            
        now = timezone.now()
        
        # 1. Prioritize Desktop Tracker if it has been active recently (within 5 minutes)
        if self.last_desktop_ping:
            time_since_desktop = now - self.last_desktop_ping
            seconds_desktop = time_since_desktop.total_seconds()
            
            if seconds_desktop <= 300:
                # Desktop is active: check if desktop reports idle or has missed a ping for 2+ minutes
                if self.is_desktop_idle or seconds_desktop > 120:
                    return 'Idle'
                return 'Active'
                
        # 2. Fallback to general/browser ping if desktop is not active
        if self.last_ping:
            time_since_ping = now - self.last_ping
            seconds_ping = time_since_ping.total_seconds()
            
            if seconds_ping <= 300:
                return 'Active'
            
        return 'Offline'


class ActivityLog(models.Model):
    """Optional: Detailed activity logging for advanced analytics."""
    ACTIVITY_CHOICES = [
        ('active', 'Active'),
        ('idle', 'Idle'),
        ('offline', 'Offline'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='activity_logs')
    session = models.ForeignKey(WorkSession, on_delete=models.CASCADE, related_name='activity_logs')
    activity_type = models.CharField(max_length=10, choices=ACTIVITY_CHOICES)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tracking_activity_log'
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['session', 'timestamp']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.activity_type} at {self.timestamp}"


class AppActivity(models.Model):
    """Track active applications and their durations."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='app_activities')
    session = models.ForeignKey(WorkSession, on_delete=models.CASCADE, related_name='app_activities')
    app_name = models.CharField(max_length=255)
    window_title = models.CharField(max_length=500, blank=True)
    duration_seconds = models.IntegerField(default=0)  # active tracking duration in seconds
    timestamp = models.DateTimeField(default=timezone.now)
    is_productive = models.BooleanField(default=True)  # Can be categorized by admin later

    class Meta:
        db_table = 'tracking_app_activity'
        verbose_name_plural = 'App Activities'
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['session', 'timestamp']),
            models.Index(fields=['app_name']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.app_name} for {self.duration_seconds}s"


class Screenshot(models.Model):
    """Store screenshot records captured from employee desktops."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='screenshots')
    session = models.ForeignKey(WorkSession, on_delete=models.CASCADE, related_name='screenshots')
    image = models.ImageField(upload_to='tracking/screenshots/%Y/%m/%d/')
    timestamp = models.DateTimeField(default=timezone.now)
    is_idle = models.BooleanField(default=False)

    class Meta:
        db_table = 'tracking_screenshot'
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['session', 'timestamp']),
        ]

    def __str__(self):
        return f"{self.user.username} - Screenshot at {self.timestamp}"

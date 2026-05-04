from django.db import models
from django.conf import settings
from django.utils import timezone


class UserProfile(models.Model):
    """Extended user profile with tracking configuration."""
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='tracking_profile')
    is_tracking_enabled = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tracking_user_profile'
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['is_tracking_enabled']),
        ]

    def __str__(self):
        return f"{self.user.username} - Tracking: {self.is_tracking_enabled}"


class WorkSession(models.Model):
    """Track user work sessions with activity status."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='work_sessions')
    login_time = models.DateTimeField(auto_now_add=True)
    last_ping = models.DateTimeField(default=timezone.now)
    logout_time = models.DateTimeField(null=True, blank=True)
    is_active_session = models.BooleanField(default=True)
    
    # Additional tracking fields
    total_duration = models.DurationField(null=True, blank=True)  # Cached duration
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tracking_work_session'
        indexes = [
            models.Index(fields=['user', 'is_active_session']),
            models.Index(fields=['user', 'login_time']),
            models.Index(fields=['last_ping']),
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
        """Get current activity status: Active / Idle / Offline."""
        if not self.is_active_session:
            return 'Offline'
        
        time_since_ping = timezone.now() - self.last_ping
        minutes = time_since_ping.total_seconds() / 60

        if minutes < 5:
            return 'Active'
        elif minutes < 15:
            return 'Idle'
        else:
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

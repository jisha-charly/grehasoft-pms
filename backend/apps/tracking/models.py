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
    
    # Device isolation fields
    device_id = models.CharField(max_length=255, default='default')
    installation_uuid = models.CharField(max_length=255, null=True, blank=True)
    tracker_id = models.CharField(max_length=255, null=True, blank=True)
    machine_fingerprint = models.CharField(max_length=255, null=True, blank=True)
    
    # Additional tracking fields
    total_duration = models.DurationField(null=True, blank=True)  # Cached duration
    last_desktop_ping = models.DateTimeField(null=True, blank=True)
    is_desktop_idle = models.BooleanField(default=False)
    mouse_moves = models.IntegerField(default=0)
    key_presses = models.IntegerField(default=0)
    clicks = models.IntegerField(default=0)
    productive_seconds = models.IntegerField(default=0)
    idle_seconds = models.IntegerField(default=0)
    tracked_seconds = models.IntegerField(default=0)
    break_count = models.IntegerField(default=0)
    activity_percentage = models.FloatField(default=0.0)
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
                fields=['user', 'device_id'],
                condition=models.Q(is_active_session=True),
                name='only_one_active_session_per_user_device'
            )
        ]

    def __str__(self):
        status = "Active" if self.is_active_session else "Inactive"
        return f"{self.user.username} - {self.login_time.date()} ({status})"

    @property
    def session_type(self):
        """Computed field distinguishing browser pings from desktop tracking."""
        return 'browser' if self.device_id == 'default' else 'desktop'

    def save(self, *args, **kwargs):
        """Save and validate/cap session tracked times."""
        if self.device_id == 'default':
            self.productive_seconds = 0
            self.idle_seconds = 0
            self.tracked_seconds = 0
            self.activity_percentage = 0.0
        elif self.login_time:
            now = timezone.now()
            last_active = self.logout_time or self.last_ping or now
            elapsed = (last_active - self.login_time).total_seconds()
            elapsed = max(0, int(elapsed))
            
            # --- START DIAGNOSTIC LOGGING ---
            print(f"[DIAGNOSTIC SAVE LOG] Session ID: {self.id}, User: {self.user.username}, Device: {self.device_id}")
            print(f"  - login_time: {self.login_time}")
            print(f"  - last_active: {last_active}")
            print(f"  - elapsed: {elapsed} seconds")
            print(f"  - productive_seconds before capping: {self.productive_seconds}")
            print(f"  - idle_seconds before capping: {self.idle_seconds}")
            # --- END DIAGNOSTIC LOGGING ---
            
            # Ensure none of these are negative
            if self.productive_seconds < 0:
                self.productive_seconds = 0
            if self.idle_seconds < 0:
                self.idle_seconds = 0
                
            total = self.productive_seconds + self.idle_seconds
            if total > elapsed:
                # Structured capping event log for production monitoring
                print(f"[CAPPING TRIGGERED EVENT]")
                print(f"  - session_id: {self.id}")
                print(f"  - username: {self.user.username}")
                print(f"  - device_id: {self.device_id}")
                print(f"  - login_time: {self.login_time}")
                print(f"  - last_active: {last_active}")
                print(f"  - elapsed: {elapsed}")
                print(f"  - productive_seconds: {self.productive_seconds}")
                print(f"  - idle_seconds: {self.idle_seconds}")
                print(f"  - total: {total}")
                print(f"=========================")
                
                if self.productive_seconds > elapsed:
                    print(f"    - Wiping/Capping: productive_seconds = {elapsed}, idle_seconds = 0 (previously {self.idle_seconds})")
                    self.productive_seconds = elapsed
                    self.idle_seconds = 0
                else:
                    new_idle = elapsed - self.productive_seconds
                    print(f"    - Capping: idle_seconds = {new_idle} (previously {self.idle_seconds})")
                    self.idle_seconds = new_idle
            
            self.tracked_seconds = self.productive_seconds + self.idle_seconds
            if self.tracked_seconds > 0:
                self.activity_percentage = min(100.0, max(0.0, (self.productive_seconds / self.tracked_seconds) * 100.0))
            else:
                self.activity_percentage = 0.0
                
        update_fields = kwargs.get('update_fields')
        if update_fields is not None:
            update_fields = set(update_fields)
            update_fields.update(['productive_seconds', 'idle_seconds', 'tracked_seconds', 'activity_percentage'])
            kwargs['update_fields'] = list(update_fields)
                
        super().save(*args, **kwargs)

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
    mouse_moves = models.IntegerField(default=0)
    key_presses = models.IntegerField(default=0)
    clicks = models.IntegerField(default=0)
    productive_seconds = models.IntegerField(default=0)
    productive_duration = models.IntegerField(default=0)
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

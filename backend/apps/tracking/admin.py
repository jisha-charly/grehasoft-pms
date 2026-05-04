from django.contrib import admin
from django.utils.html import format_html
from .models import UserProfile, WorkSession, ActivityLog


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'is_tracking_enabled', 'updated_at']
    list_filter = ['is_tracking_enabled', 'created_at']
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('User', {
            'fields': ('user',)
        }),
        ('Tracking Configuration', {
            'fields': ('is_tracking_enabled',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(WorkSession)
class WorkSessionAdmin(admin.ModelAdmin):
    list_display = ['user', 'status_badge', 'login_time', 'last_ping', 'logout_time', 'duration']
    list_filter = ['is_active_session', 'login_time']
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['created_at', 'updated_at', 'duration_display']
    
    fieldsets = (
        ('User & Session', {
            'fields': ('user', 'is_active_session')
        }),
        ('Timing', {
            'fields': ('login_time', 'last_ping', 'logout_time')
        }),
        ('Duration', {
            'fields': ('total_duration', 'duration_display'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def status_badge(self, obj):
        """Display status with color coding."""
        status = obj.get_status()
        colors = {
            'Active': '#00cc00',
            'Idle': '#ffcc00',
            'Offline': '#ff0000',
        }
        color = colors.get(status, '#999999')
        return format_html(
            '<span style="color: white; background-color: {}; padding: 3px 8px; border-radius: 3px;">{}</span>',
            color,
            status
        )
    status_badge.short_description = 'Status'
    
    def duration(self, obj):
        """Display formatted duration."""
        from .utils import format_duration
        return format_duration(obj.calculate_duration())
    duration.short_description = 'Duration'
    
    def duration_display(self, obj):
        """Detailed duration display for fieldset."""
        from .utils import format_duration
        return format_duration(obj.calculate_duration())
    duration_display.short_description = 'Calculated Duration'


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'activity_badge', 'timestamp']
    list_filter = ['activity_type', 'timestamp']
    search_fields = ['user__username', 'session__id']
    readonly_fields = ['timestamp']
    
    def activity_badge(self, obj):
        """Display activity type with color coding."""
        colors = {
            'active': '#00cc00',
            'idle': '#ffcc00',
            'offline': '#ff0000',
        }
        color = colors.get(obj.activity_type, '#999999')
        return format_html(
            '<span style="color: white; background-color: {}; padding: 3px 8px; border-radius: 3px;">{}</span>',
            color,
            obj.get_activity_type_display()
        )
    activity_badge.short_description = 'Activity'

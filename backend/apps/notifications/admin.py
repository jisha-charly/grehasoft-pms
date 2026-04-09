from django.contrib import admin
from .models import Notification

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("title", "module", "type", "email_sent", "created_at")
    list_filter = ("module", "type", "email_sent")
    search_fields = ("title", "message")

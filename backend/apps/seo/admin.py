from django.contrib import admin
from .models import (
    SEOActivityType, Website, Keyword, SEODailyWorkLog, SEODailyWorkLogItem, SEOMonthlyTarget, SEOTask, SEOReminder, SEOCredential, SEODailyWorkProof
)


@admin.register(SEOActivityType)
class SEOActivityTypeAdmin(admin.ModelAdmin):
    list_display = ("name", "is_active", "created_at")
    search_fields = ("name",)


@admin.register(Website)
class WebsiteAdmin(admin.ModelAdmin):
    list_display = ("website_name", "domain_url", "client", "assigned_executive", "status", "package_plan")
    search_fields = ("website_name", "domain_url", "client__company_name")
    list_filter = ("status", "package_plan")


@admin.register(Keyword)
class KeywordAdmin(admin.ModelAdmin):
    list_display = ("keyword", "website", "search_volume", "difficulty_score", "priority", "current_rank")
    search_fields = ("keyword", "website__website_name")
    list_filter = ("priority",)


class SEODailyWorkLogItemInline(admin.TabularInline):
    model = SEODailyWorkLogItem
    extra = 1


class SEODailyWorkProofInline(admin.TabularInline):
    model = SEODailyWorkProof
    extra = 1


@admin.register(SEODailyWorkLog)
class SEODailyWorkLogAdmin(admin.ModelAdmin):
    list_display = ("executive", "website", "log_date", "total_count", "status", "created_at")
    search_fields = ("executive__username", "website__website_name", "remarks")
    list_filter = ("status", "log_date")
    inlines = [SEODailyWorkLogItemInline, SEODailyWorkProofInline]



@admin.register(SEOMonthlyTarget)
class SEOMonthlyTargetAdmin(admin.ModelAdmin):
    list_display = ("executive", "website", "month", "activity_type", "target_count")
    search_fields = ("executive__username", "website__website_name", "month")
    list_filter = ("month", "activity_type")


@admin.register(SEOTask)
class SEOTaskAdmin(admin.ModelAdmin):
    list_display = ("title", "website", "assigned_executive", "due_date", "priority", "status")
    search_fields = ("title", "website__website_name", "assigned_executive__username")
    list_filter = ("status", "priority", "due_date")


@admin.register(SEOReminder)
class SEOReminderAdmin(admin.ModelAdmin):
    list_display = ("title", "website", "assigned_executive", "due_date", "priority", "status")
    search_fields = ("title", "website__website_name", "assigned_executive__username")
    list_filter = ("status", "priority", "due_date")


@admin.register(SEOCredential)
class SEOCredentialAdmin(admin.ModelAdmin):
    list_display = ("website", "platform", "username", "created_at", "updated_at")
    search_fields = ("website__website_name", "platform", "username")
    list_filter = ("platform",)


@admin.register(SEODailyWorkProof)
class SEODailyWorkProofAdmin(admin.ModelAdmin):
    list_display = ("work_log", "proof_file", "uploaded_at")
    search_fields = ("work_log__website__website_name", "work_log__executive__username")
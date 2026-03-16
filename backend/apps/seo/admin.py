from django.contrib import admin
from .models import Website


@admin.register(Website)
class WebsiteAdmin(admin.ModelAdmin):

    list_display = (
        "domain",
        "client",
        "google_search_console_id",
        "google_analytics_id",
        "sitemap_url",
    )

    search_fields = ("domain", "client__company_name")
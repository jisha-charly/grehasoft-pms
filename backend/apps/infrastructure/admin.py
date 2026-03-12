from django.contrib import admin

from .models import Server, Domain, WebsiteCredential


@admin.register(Server)
class ServerAdmin(admin.ModelAdmin):
    list_display = ("name", "provider", "server_ip", "ip_address")
    search_fields = ("name", "provider", "owner", "server_ip", "ip_address")


@admin.register(Domain)
class DomainAdmin(admin.ModelAdmin):
    list_display = ("domain_name", "project", "server", "expiry_date")
    list_filter = ("provider", "server", "expiry_date")
    search_fields = ("domain_name", "project__name", "provider")


@admin.register(WebsiteCredential)
class WebsiteCredentialAdmin(admin.ModelAdmin):
    list_display = ("domain", "project", "admin_url", "cpanel_url", "ftp_host")
    search_fields = (
        "domain__domain_name",
        "project__name",
        "admin_url",
        "cpanel_url",
        "ftp_host",
        "contact_form_email",
        "client_email",
    )

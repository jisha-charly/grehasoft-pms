from django.apps import AppConfig


class TrackingConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.tracking'
    verbose_name = 'Work Tracking'
    
    def ready(self):
        """Initialize app signals."""
        import apps.tracking.signals  # noqa

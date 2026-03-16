from django.db import models
from core.models import SoftDeleteModel


from apps.projects.models import Client


class Website(models.Model):

    client = models.ForeignKey(
        Client,
        on_delete=models.CASCADE,
        related_name="seo_websites"
    )

    domain = models.CharField(max_length=255)

    google_search_console_id = models.CharField(
        max_length=255,
        blank=True,
        null=True
    )

    google_analytics_id = models.CharField(
        max_length=255,
        blank=True,
        null=True
    )

    sitemap_url = models.URLField(
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.domain


class SEOTask(models.Model):

    TASK_TYPES = [
        ("ON_PAGE", "On Page"),
        ("KEYWORD", "Keyword"),
        ("TECHNICAL", "Technical"),
        ("BACKLINK", "Backlink"),
    ]

    STATUS = [
        ("ACTIVE", "Active"),
        ("COMPLETED", "Completed"),
    ]

    client = models.ForeignKey(Client, on_delete=models.CASCADE)

    website = models.ForeignKey(
        Website,
        on_delete=models.CASCADE,
        related_name="seo_tasks"
    )

    task_type = models.CharField(max_length=50, choices=TASK_TYPES)

    description = models.TextField()

    status = models.CharField(
        max_length=20,
        choices=STATUS,
        default="ACTIVE"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.client.company_name} - {self.task_type}"
class Keyword(models.Model):

    website = models.ForeignKey(Website, on_delete=models.CASCADE)

    keyword = models.CharField(max_length=255)
    search_volume = models.IntegerField()
    difficulty = models.FloatField()

    rank = models.IntegerField()

    def __str__(self):
        return self.keyword
class Backlink(models.Model):

    website = models.ForeignKey(Website, on_delete=models.CASCADE)

    link_type = models.CharField(max_length=100)
    url = models.URLField()

    domain_authority = models.IntegerField()

    status = models.CharField(
        max_length=20,
        choices=[
            ("LIVE", "Live"),
            ("REMOVED", "Removed")
        ]
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.url
class TechnicalSEO(models.Model):

    website = models.OneToOneField(Website, on_delete=models.CASCADE)

    broken_links = models.IntegerField(default=0)

    sitemap_updated = models.BooleanField(default=True)

    lcp = models.FloatField()

    cls = models.FloatField()

    def __str__(self):
        return self.website.url
class SEOAnalytics(models.Model):

    website = models.ForeignKey(Website, on_delete=models.CASCADE)

    month = models.CharField(max_length=20)

    traffic = models.IntegerField()

    def __str__(self):
        return f"{self.month} - {self.website.url}"
class SocialMedia(models.Model):

    website = models.ForeignKey(Website, on_delete=models.CASCADE)

    platform = models.CharField(max_length=100)

    likes = models.IntegerField()

    reach = models.IntegerField()

    last_update = models.DateField()

    def __str__(self):
        return self.platform
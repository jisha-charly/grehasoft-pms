from django.db import models
from django.conf import settings
from apps.projects.models import Client


class SEOActivityType(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = "seo_activity_type"
        ordering = ["name"]


class Website(models.Model):
    PACKAGE_PLANS = [
        ("basic", "Basic"),
        ("standard", "Standard"),
        ("premium", "Premium"),
        ("custom", "Custom"),
    ]

    client = models.ForeignKey(
        Client,
        on_delete=models.CASCADE,
        related_name="seo_websites"
    )
    website_name = models.CharField(max_length=255)
    domain_url = models.CharField(max_length=255)
    start_date = models.DateField(null=True, blank=True)
    package_plan = models.CharField(max_length=50, choices=PACKAGE_PLANS, default="basic")

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
    target_country = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    assigned_executive = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_seo_websites"
    )
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_seo_websites_by"
    )
    assigned_date = models.DateTimeField(null=True, blank=True)

    status = models.CharField(
        max_length=20,
        choices=[("active", "Active"), ("inactive", "Inactive")],
        default="active"
    )
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.website_name

    class Meta:
        db_table = "seo_website"
        ordering = ["-created_at"]


class Keyword(models.Model):
    PRIORITY_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
    ]

    website = models.ForeignKey(
        Website,
        on_delete=models.CASCADE,
        related_name="target_keywords"
    )
    keyword = models.CharField(max_length=255)
    search_volume = models.IntegerField(default=0)
    difficulty_score = models.FloatField(default=0.0)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default="medium")
    target_rank = models.IntegerField(null=True, blank=True)
    current_rank = models.IntegerField(null=True, blank=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.keyword

    class Meta:
        db_table = "seo_keyword"
        ordering = ["keyword"]


class SEODailyWorkLog(models.Model):
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("submitted", "Submitted"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]

    website = models.ForeignKey(
        Website,
        on_delete=models.CASCADE,
        related_name="daily_logs"
    )
    log_date = models.DateField()
    executive = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="seo_daily_logs"
    )
    proof_file = models.FileField(upload_to="seo_proofs/", null=True, blank=True)
    remarks = models.TextField(blank=True, null=True)
    total_count = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    remarks_by_manager = models.TextField(blank=True, null=True)

    # Audit Trail
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_seo_logs"
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_seo_logs"
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_seo_logs"
    )
    approved_date = models.DateTimeField(null=True, blank=True)
    rejected_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="rejected_seo_logs"
    )
    rejected_date = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.executive.username} - {self.website.website_name} - {self.log_date}"

    class Meta:
        db_table = "seo_daily_work_log"
        unique_together = ("executive", "website", "log_date")
        ordering = ["-log_date", "-created_at"]

    def calculate_total_count(self):
        self.total_count = sum(item.count for item in self.items.all())


class SEODailyWorkProof(models.Model):
    work_log = models.ForeignKey(
        SEODailyWorkLog,
        on_delete=models.CASCADE,
        related_name="proof_files"
    )
    proof_file = models.FileField(upload_to="seo_proofs/")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "seo_daily_work_proof"
        ordering = ["-uploaded_at"]



class SEODailyWorkLogItem(models.Model):
    work_log = models.ForeignKey(
        SEODailyWorkLog,
        on_delete=models.CASCADE,
        related_name="items"
    )
    activity_type = models.ForeignKey(
        SEOActivityType,
        on_delete=models.PROTECT,
        related_name="log_items"
    )
    count = models.IntegerField(default=1)
    keyword = models.CharField(max_length=255, blank=True, null=True)
    submission_url = models.TextField(blank=True, null=True)
    domain_authority = models.IntegerField(blank=True, null=True)
    spam_score = models.IntegerField(blank=True, null=True)
    time_spent_minutes = models.IntegerField(blank=True, null=True)
    username = models.CharField(max_length=255, blank=True, null=True)
    password = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.activity_type.name} ({self.count})"

    class Meta:
        db_table = "seo_daily_work_log_item"


class SEOMonthlyTarget(models.Model):
    executive = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="seo_targets"
    )
    website = models.ForeignKey(
        Website,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="seo_targets"
    )
    month = models.CharField(max_length=7)  # Format: YYYY-MM
    activity_type = models.ForeignKey(
        SEOActivityType,
        on_delete=models.CASCADE,
        related_name="monthly_targets"
    )
    target_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        web_str = f" - {self.website.website_name}" if self.website else " - Overall"
        return f"{self.executive.username} - {self.month} - {self.activity_type.name}{web_str}"

    class Meta:
        db_table = "seo_monthly_target"
        ordering = ["-month", "executive"]


class SEOTask(models.Model):
    PRIORITY_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
    ]
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("completed", "Completed"),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField()
    website = models.ForeignKey(
        Website,
        on_delete=models.CASCADE,
        related_name="seo_tasks"
    )
    assigned_executive = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="assigned_seo_tasks"
    )
    due_date = models.DateField()
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default="medium")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_seo_tasks"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    class Meta:
        db_table = "seo_task"
        ordering = ["due_date", "-created_at"]


class SEOReminder(models.Model):
    PRIORITY_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
    ]
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("completed", "Completed"),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    website = models.ForeignKey(
        Website,
        on_delete=models.CASCADE,
        related_name="seo_reminders"
    )
    assigned_executive = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="assigned_seo_reminders"
    )
    due_date = models.DateField()
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default="medium")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_seo_reminders"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    class Meta:
        db_table = "seo_reminder"
        ordering = ["due_date", "-created_at"]


class SEOCredential(models.Model):
    website = models.ForeignKey(
        Website,
        on_delete=models.CASCADE,
        related_name="seo_credentials"
    )
    platform = models.CharField(max_length=100)
    username = models.CharField(max_length=255)
    password = models.TextField()  # Encrypted Fernet string
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.website.website_name} - {self.platform} ({self.username})"

    class Meta:
        db_table = "seo_credential"
        ordering = ["website", "platform"]
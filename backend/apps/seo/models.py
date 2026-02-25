from django.db import models
from core.models import SoftDeleteModel

class SEOTask(SoftDeleteModel):
    TYPE_CHOICES = [
        ('on_page','On Page'), 
        ('off_page','Off Page'), 
        ('technical','Technical'), 
        ('content','Content'), 
        ('keyword','Keyword')
    ]
    task = models.ForeignKey('tasks.Task', on_delete=models.CASCADE, related_name='seo_details')
    seo_type = models.CharField(max_length=20, choices=TYPE_CHOICES)

    def __str__(self):
        return f"{self.seo_type} - {self.task.title}"

class SEOOnPage(SoftDeleteModel):
    seo_task = models.ForeignKey(SEOTask, on_delete=models.CASCADE, related_name='onpage_metrics')
    page_url = models.URLField(max_length=255)
    title_optimized = models.BooleanField(default=False)
    meta_optimized = models.BooleanField(default=False)
    keyword_density = models.DecimalField(max_digits=5, decimal_places=2)
    mobile_friendly = models.BooleanField(default=True)
    page_speed_status = models.CharField(max_length=50)

class SEOOffPage(SoftDeleteModel):
    seo_task = models.ForeignKey(SEOTask, on_delete=models.CASCADE, related_name='offpage_activities')
    activity_type = models.CharField(max_length=100)
    submission_url = models.URLField(max_length=255)
    anchor_text = models.CharField(max_length=150)
    da = models.IntegerField() # Domain Authority
    spam_score = models.DecimalField(max_digits=4, decimal_places=2)
    live_status = models.CharField(max_length=10, choices=[('live','Live'), ('pending','Pending'), ('rejected','Rejected')])

class SEOTechnical(SoftDeleteModel):
    STATUS_CHOICES = [('updated', 'Updated'), ('submitted', 'Submitted')]
    seo_task = models.ForeignKey(SEOTask, on_delete=models.CASCADE, related_name='technical_audits')
    broken_links = models.IntegerField(default=0)
    sitemap_status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    core_web_vitals_lcp = models.DecimalField(max_digits=5, decimal_places=2)
    core_web_vitals_cls = models.DecimalField(max_digits=5, decimal_places=2)

class SEOKeywords(SoftDeleteModel):
    seo_task = models.ForeignKey(SEOTask, on_delete=models.CASCADE, related_name='keyword_tracking')
    keyword = models.CharField(max_length=200)
    search_volume = models.IntegerField()
    difficulty = models.IntegerField()
    current_rank = models.IntegerField()
    target_rank = models.IntegerField()

class GMBProfile(SoftDeleteModel):
    project = models.ForeignKey('projects.Project', on_delete=models.CASCADE, related_name='gmb_profiles')
    business_name = models.CharField(max_length=200)
    category = models.CharField(max_length=150)
    rating = models.DecimalField(max_digits=2, decimal_places=1)
    total_reviews = models.IntegerField(default=0)

class SocialMediaPost(SoftDeleteModel):
    project = models.ForeignKey('projects.Project', on_delete=models.CASCADE, related_name='social_posts')
    platform = models.CharField(max_length=50)
    post_type = models.CharField(max_length=50)
    language = models.CharField(max_length=50, blank=True)
    post_url = models.URLField(max_length=255)
    posting_date = models.DateField()

class SocialMetrics(SoftDeleteModel):
    post = models.ForeignKey(SocialMediaPost, on_delete=models.CASCADE, related_name='metrics')
    likes = models.IntegerField(default=0)
    comments = models.IntegerField(default=0)
    shares = models.IntegerField(default=0)
    reach = models.IntegerField(default=0)

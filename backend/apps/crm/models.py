from django.db import models
from core.models import SoftDeleteModel
from django.conf import settings
from apps.projects.models import Client

class Lead(SoftDeleteModel):
    STATUS_CHOICES = [
        ('new', 'New'),
        ('contacted', 'Contacted'),
        ('qualified', 'Qualified'),
        ('converted', 'Converted'),
        ('lost', 'Lost'),
    ]

    ENQUIRY_CHOICES = [
        ('WhatsApp', 'WhatsApp'),
        ('Call', 'Call'),
        ('Facebook', 'Facebook'),
        ('Instagram', 'Instagram'),
        ('LinkedIn', 'LinkedIn'),
    ]

    CONTACT_CHOICES = [
        ('Direct', 'Direct'),
        ('Reference', 'Reference'),
        ('Friend', 'Friend'),
    ]

    # Existing fields
    name = models.CharField(max_length=150)
    email = models.EmailField(max_length=150)
    phone = models.CharField(max_length=20)
    source = models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    client = models.ForeignKey(
      'projects.Client',
        on_delete=models.CASCADE,
        related_name="leads",
        null=True,
        blank=True
    )
    converted_project = models.ForeignKey('projects.Project', on_delete=models.SET_NULL, null=True, blank=True)

    # ✨ NEW FIELDS - Lead Source
    enquiry_from = models.CharField(max_length=50, choices=ENQUIRY_CHOICES, blank=True, null=True)
    how_contacted = models.CharField(max_length=50, choices=CONTACT_CHOICES, blank=True, null=True)
    contacted_person = models.CharField(max_length=150, blank=True, null=True)
    reference_person = models.CharField(max_length=150, blank=True, null=True)

    # ✨ NEW FIELDS - Company
    company_name = models.CharField(max_length=200, blank=True, null=True)

    # ✨ NEW FIELDS - Services (multi-select as JSON)
    service_required = models.JSONField(default=list, blank=True)

    # ✨ NEW FIELDS - Project Details
    client_requirements = models.TextField(blank=True, null=True)
    details_given = models.TextField(blank=True, null=True)
    competitor_websites = models.TextField(blank=True, null=True)

    # ✨ NEW FIELDS - Assets
    documents_given = models.JSONField(default=list, blank=True)
    login_credentials = models.JSONField(default=list, blank=True)

    class Meta:
        ordering = ['-id']
        indexes = [
            models.Index(fields=['status', 'created_at']),
        ]

class LeadAssignment(models.Model):
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='assignments')
    sales_exec = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    assigned_at = models.DateTimeField(auto_now_add=True)

class LeadFollowup(models.Model):
    TYPE_CHOICES = [('call', 'Call'), ('whatsapp', 'WhatsApp'), ('meeting', 'Meeting'), ('email', 'Email')]
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='followups')
    followup_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    notes = models.TextField()
    next_followup = models.DateField()
    status = models.CharField(max_length=10, choices=[('done', 'Done'), ('pending', 'Pending')], default='pending')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)

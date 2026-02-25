from django.db import models
from core.models import SoftDeleteModel
from django.conf import settings

class Lead(SoftDeleteModel):
    STATUS_CHOICES = [
        ('new', 'New'),
        ('contacted', 'Contacted'),
        ('qualified', 'Qualified'),
        ('converted', 'Converted'),
        ('lost', 'Lost'),
    ]
    name = models.CharField(max_length=150)
    email = models.EmailField(max_length=150)
    phone = models.CharField(max_length=20)
    source = models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    converted_project = models.ForeignKey('projects.Project', on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
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

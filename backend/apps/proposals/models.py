from django.db import models
from apps.crm.models import Lead
from apps.projects.models import Client, Project



class Proposal(models.Model):

    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('sent', 'Sent'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]

    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name="proposals")
    title = models.CharField(max_length=255)

    description = models.TextField(blank=True)
    project_overview = models.TextField(blank=True)
    client = models.ForeignKey(Client, on_delete=models.CASCADE, null=True, blank=True)
    # ⭐ ADD THIS
    project = models.ForeignKey(
        Project,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="proposal_projects"
    )


    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    amount = models.DecimalField(max_digits=12, decimal_places=2)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")

    created_at = models.DateTimeField(auto_now_add=True)
    last_sent_at = models.DateTimeField(null=True, blank=True)
    is_converted = models.BooleanField(default=False)

    def __str__(self):
        return self.title


class ProposalItem(models.Model):

    proposal = models.ForeignKey(Proposal, on_delete=models.CASCADE, related_name="items")

    service = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    cost = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return self.service
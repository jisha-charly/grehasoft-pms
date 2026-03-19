import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings') # Adjust backend.settings if needed
django.setup()

from apps.crm.models import Lead
from apps.proposals.models import Proposal

print("--- LEADS ---")
for lead in Lead.objects.all():
    print(f"Lead ID {lead.id}: {lead.name} | Status: {lead.status} | Client: {lead.client_id} | Project: {lead.converted_project_id}")

print("\n--- PROPOSALS ---")
for prop in Proposal.objects.all():
    print(f"Prop ID {prop.id}: {prop.title} | Lead ID: {prop.lead_id} | Converted: {prop.is_converted}")

import os
import sys
import django

# Add app directory to path
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings') # Changed to config.settings based on normal Django setups, let's try
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
django.setup()

from apps.crm.models import Lead
from apps.proposals.models import Proposal

print("Starting fix...")
proposals = Proposal.objects.filter(is_converted=True)
count = 0
for prop in proposals:
    lead = prop.lead
    if lead and lead.status != 'converted':
        lead.status = 'converted'
        # If the proposal has a project, link it to the lead too
        if hasattr(prop, 'project') and prop.project:
            lead.converted_project = prop.project
        lead.save()
        count += 1
        print(f"Fixed Lead ID {lead.id} ({lead.name}) associated with Proposal ID {prop.id}")

print(f"Fixed {count} leads.")

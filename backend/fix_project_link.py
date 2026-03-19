import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
django.setup()

from apps.crm.models import Lead
from apps.proposals.models import Proposal
from apps.projects.models import Project

print("Starting project link fix...")
proposals = Proposal.objects.filter(is_converted=True)
count = 0
for prop in proposals:
    lead = prop.lead
    if lead and lead.status == 'converted' and not lead.converted_project:
        # Try to find the exact project we created previously
        project = Project.objects.filter(name=prop.title, client=lead.client).first()
        if project:
            lead.converted_project = project
            lead.save()
            
            prop.project = project
            prop.save()
            print(f"Linked Project ID {project.id} to Lead {lead.id} and Proposal {prop.id}")
            count += 1
        else:
            print(f"Could not find project for Proposal {prop.id} - '{prop.title}'")

print(f"Fixed {count} project links.")

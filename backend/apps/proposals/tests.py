from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from apps.users.models import Role
from apps.projects.models import Client, Project
from apps.crm.models import Lead
from apps.proposals.models import Proposal, ProposalItem

User = get_user_model()

class ProposalPermissionsTestCase(APITestCase):

    def setUp(self):
        # Create Roles
        self.super_admin_role, _ = Role.objects.get_or_create(name='SUPER_ADMIN', defaults={'permissions': []})
        self.sales_manager_role, _ = Role.objects.get_or_create(name='SALES_MANAGER', defaults={'permissions': []})
        self.client_role, _ = Role.objects.get_or_create(name='CLIENT', defaults={'permissions': []})

        # Create Client profiles
        self.client_a = Client.objects.create(name="Client A", email="clienta@example.com", company_name="Company A")
        self.client_b = Client.objects.create(name="Client B", email="clientb@example.com", company_name="Company B")

        # Create Users
        self.admin_user = User.objects.create_user(
            username='admin_user_test', email='admin_test@example.com', password='adminpass123', role=self.super_admin_role
        )
        self.sales_manager_user = User.objects.create_user(
            username='sales_manager_test', email='sales_test@example.com', password='salespass123', role=self.sales_manager_role
        )
        self.client_a_user = User.objects.create_user(
            username='client_a_user_test', email='clienta@example.com', password='clientpass123', role=self.client_role, client=self.client_a
        )
        self.client_b_user = User.objects.create_user(
            username='client_b_user_test', email='clientb@example.com', password='clientpass123', role=self.client_role, client=self.client_b
        )

        # Create Leads
        self.lead_a = Lead.objects.create(name="Client A", email="clienta@example.com", phone="1234567890", source="Google")
        self.lead_b = Lead.objects.create(name="Client B", email="clientb@example.com", phone="0987654321", source="Facebook")

        # Create Proposals
        self.proposal_a = Proposal.objects.create(
            lead=self.lead_a,
            title="Website Proposal for Client A",
            description="Detailed description A",
            client=self.client_a,
            subtotal=1000.00,
            discount=100.00,
            amount=900.00,
            status="sent"
        )
        self.proposal_item_a = ProposalItem.objects.create(
            proposal=self.proposal_a,
            service="Service A",
            description="Desc A",
            cost=1000.00
        )

        self.proposal_b = Proposal.objects.create(
            lead=self.lead_b,
            title="SEO Proposal for Client B",
            description="Detailed description B",
            client=self.client_b,
            subtotal=500.00,
            discount=0.00,
            amount=500.00,
            status="draft"
        )
        self.proposal_item_b = ProposalItem.objects.create(
            proposal=self.proposal_b,
            service="Service B",
            description="Desc B",
            cost=500.00
        )

    def set_auth(self, user):
        refresh = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

    def test_client_access_own_proposal(self):
        """Client can successfully retrieve their own proposal with only client-appropriate fields."""
        self.set_auth(self.client_a_user)
        response = self.client.get(f'/api/v1/proposals/{self.proposal_a.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], self.proposal_a.title)
        self.assertEqual(response.data['proposal_number'], f"PROP-{self.proposal_a.id:04d}")
        # Verify nested client_details
        self.assertIn('client_details', response.data)
        self.assertEqual(response.data['client_details']['name'], self.client_a.name)
        # Verify internal remark / sales details do not exist (none present in serializer fields)
        self.assertNotIn('sales_notes', response.data)
        self.assertNotIn('internal_remarks', response.data)

    def test_client_access_other_client_proposal_forbidden(self):
        """Client trying to access another client's proposal gets 403 Forbidden."""
        self.set_auth(self.client_a_user)
        response = self.client.get(f'/api/v1/proposals/{self.proposal_b.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_client_access_non_existent_proposal_not_found(self):
        """Client trying to access non-existent proposal gets 404 Not Found."""
        self.set_auth(self.client_a_user)
        response = self.client.get('/api/v1/proposals/9999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_admin_access_all_proposals(self):
        """Admin can access all proposals and sees full serializer."""
        self.set_auth(self.admin_user)
        response_a = self.client.get(f'/api/v1/proposals/{self.proposal_a.id}/')
        response_b = self.client.get(f'/api/v1/proposals/{self.proposal_b.id}/')
        
        self.assertEqual(response_a.status_code, status.HTTP_200_OK)
        self.assertEqual(response_b.status_code, status.HTTP_200_OK)
        
        # Verify leadId is present (only in admin serializer)
        self.assertIn('leadId', response_a.data)

    def test_sales_manager_access_all_proposals(self):
        """Sales Manager can access all proposals and sees full serializer."""
        self.set_auth(self.sales_manager_user)
        response_a = self.client.get(f'/api/v1/proposals/{self.proposal_a.id}/')
        response_b = self.client.get(f'/api/v1/proposals/{self.proposal_b.id}/')
        
        self.assertEqual(response_a.status_code, status.HTTP_200_OK)
        self.assertEqual(response_b.status_code, status.HTTP_200_OK)

    def test_client_modify_proposal_denied(self):
        """Client cannot modify proposals (POST, PUT, DELETE, PATCH)."""
        self.set_auth(self.client_a_user)
        
        # Edit title
        response = self.client.patch(f'/api/v1/proposals/{self.proposal_a.id}/', {'title': 'Hacked Title'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Create proposal
        response = self.client.post('/api/v1/proposals/', {
            'lead': self.lead_a.id,
            'title': 'New Proposal',
            'amount': 100
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Delete proposal
        response = self.client.delete(f'/api/v1/proposals/{self.proposal_a.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

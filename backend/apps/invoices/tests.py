from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from apps.users.models import Role
from apps.projects.models import Client
from apps.invoices.models import Invoice

User = get_user_model()

class InvoicePermissionsTestCase(APITestCase):

    def setUp(self):
        # Create Roles
        self.super_admin_role, _ = Role.objects.get_or_create(name='SUPER_ADMIN', defaults={'permissions': []})
        self.client_role, _ = Role.objects.get_or_create(name='CLIENT', defaults={'permissions': []})

        # Create Client profiles
        self.client_a = Client.objects.create(name="Client A", email="clienta@example.com", company_name="Company A")
        self.client_b = Client.objects.create(name="Client B", email="clientb@example.com", company_name="Company B")

        # Create Users
        self.admin_user = User.objects.create_user(
            username='admin_user_invoice_test', email='admin_invoice@example.com', password='adminpass123', role=self.super_admin_role
        )
        self.client_a_user = User.objects.create_user(
            username='client_a_user_invoice_test', email='clienta@example.com', password='clientpass123', role=self.client_role, client=self.client_a
        )
        self.client_b_user = User.objects.create_user(
            username='client_b_user_invoice_test', email='clientb@example.com', password='clientpass123', role=self.client_role, client=self.client_b
        )

        # Create Invoices
        self.invoice_a = Invoice.objects.create(
            invoice_number="INV-0001",
            client=self.client_a,
            due_date=timezone.now().date(),
            subtotal=100.00,
            tax=0.00,
            total=100.00
        )
        self.invoice_b = Invoice.objects.create(
            invoice_number="INV-0002",
            client=self.client_b,
            due_date=timezone.now().date(),
            subtotal=200.00,
            tax=0.00,
            total=200.00
        )

    def set_auth(self, user):
        refresh = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

    def test_shared_helper_filtering(self):
        """Test that the get_for_user shared helper filters correctly based on user role."""
        # Admin gets all
        self.assertEqual(Invoice.get_for_user(self.admin_user).count(), 2)
        # Client A gets only A
        client_a_qs = Invoice.get_for_user(self.client_a_user)
        self.assertEqual(client_a_qs.count(), 1)
        self.assertEqual(client_a_qs.first(), self.invoice_a)

    def test_client_list_own_invoices(self):
        """Client can list their own invoices, but not others."""
        self.set_auth(self.client_a_user)
        response = self.client.get('/api/v1/invoices/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # In list results
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['invoice_number'], "INV-0001")

    def test_client_retrieve_own_invoice(self):
        """Client can retrieve details of their own invoice."""
        self.set_auth(self.client_a_user)
        response = self.client.get(f'/api/v1/invoices/{self.invoice_a.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['invoice_number'], "INV-0001")

    def test_client_retrieve_other_invoice_forbidden(self):
        """Client cannot retrieve another client's invoice."""
        self.set_auth(self.client_a_user)
        response = self.client.get(f'/api/v1/invoices/{self.invoice_b.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_client_download_own_invoice(self):
        """Client can download their own invoice PDF."""
        self.set_auth(self.client_a_user)
        response = self.client.get(f'/api/v1/invoices/{self.invoice_a.id}/download/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'application/pdf')

    def test_client_download_other_invoice_forbidden(self):
        """Client cannot download another client's invoice PDF."""
        self.set_auth(self.client_a_user)
        response = self.client.get(f'/api/v1/invoices/{self.invoice_b.id}/download/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_client_modify_invoice_denied(self):
        """Client cannot modify/delete invoices."""
        self.set_auth(self.client_a_user)
        
        # PATCH
        response = self.client.patch(f'/api/v1/invoices/{self.invoice_a.id}/', {'notes': 'hacked'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # DELETE
        response = self.client.delete(f'/api/v1/invoices/{self.invoice_a.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

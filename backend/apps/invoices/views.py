from rest_framework import viewsets
from .models import Invoice
from .serializers import InvoiceSerializer
from .utils import generate_invoice_number


class InvoiceViewSet(viewsets.ModelViewSet):

    queryset = Invoice.objects.all()

    serializer_class = InvoiceSerializer

    
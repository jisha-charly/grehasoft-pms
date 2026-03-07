from rest_framework import serializers
from .models import Invoice, InvoiceItem
from .utils import generate_invoice_number


class InvoiceItemSerializer(serializers.ModelSerializer):

    class Meta:
        model = InvoiceItem
        fields = ["description", "quantity", "rate", "amount"]


class InvoiceSerializer(serializers.ModelSerializer):

    items = InvoiceItemSerializer(many=True)

    class Meta:
        model = Invoice
        fields = "__all__"
        read_only_fields = ["invoice_number"]

    def create(self, validated_data):

        items_data = validated_data.pop("items")

        # Generate invoice number
        invoice_number = generate_invoice_number()

        # Calculate subtotal
        subtotal = sum(item["amount"] for item in items_data)

        tax = validated_data.get("tax", 0)

        total = subtotal + tax

        # Create invoice
        invoice = Invoice.objects.create(
            invoice_number=invoice_number,
            subtotal=subtotal,
            tax=tax,
            total=total,
            **validated_data
        )

        # Create invoice items
        for item in items_data:
            InvoiceItem.objects.create(
                invoice=invoice,
                **item
            )

        return invoice
from rest_framework import serializers
from .models import Invoice, InvoiceItem,InvoicePayment
from .utils import generate_invoice_number


class InvoiceItemSerializer(serializers.ModelSerializer):

    amount = serializers.SerializerMethodField()

    class Meta:
        model = InvoiceItem
        fields = ["description", "quantity", "rate", "amount"]
        read_only_fields = ["amount"]
    def get_amount(self, obj):
        return obj.quantity * obj.rate

class InvoicePaymentSerializer(serializers.ModelSerializer):

    class Meta:
        model = InvoicePayment
        fields = "__all__"


class InvoiceSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source="client.name", read_only=True)
    items = InvoiceItemSerializer(many=True)
    payments = InvoicePaymentSerializer(many=True, read_only=True)
    
    total_paid = serializers.ReadOnlyField()
    balance = serializers.ReadOnlyField()
    status = serializers.ReadOnlyField()

    class Meta:
        model = Invoice
        fields = "__all__"
        read_only_fields = ["invoice_number"]

    def create(self, validated_data):

     items_data = validated_data.pop("items")

     # remove frontend totals
     validated_data.pop("subtotal", None)
     validated_data.pop("tax", None)
     validated_data.pop("total", None)

     invoice_number = generate_invoice_number()

     subtotal = sum(item["quantity"] * item["rate"] for item in items_data)

     tax = 0
     total = subtotal + tax

     invoice = Invoice.objects.create(
        invoice_number=invoice_number,
        subtotal=subtotal,
        tax=tax,
        total=total,
        **validated_data
    )

     for item in items_data:
        InvoiceItem.objects.create(
            invoice=invoice,
            description=item["description"],
            quantity=item["quantity"],
            rate=item["rate"],
            amount=item["quantity"] * item["rate"]
        )

     return invoice
    def update(self, instance, validated_data):

     items_data = validated_data.pop("items")
 
     validated_data.pop("subtotal", None)
     validated_data.pop("tax", None)
     validated_data.pop("total", None)

     for attr, value in validated_data.items():
        setattr(instance, attr, value)

     instance.items.all().delete()

     subtotal = 0

     for item in items_data:
        amount = item["quantity"] * item["rate"]
        subtotal += amount

        InvoiceItem.objects.create(
            invoice=instance,
            description=item["description"],
            quantity=item["quantity"],
            rate=item["rate"],
            amount=amount
        )

     instance.subtotal = subtotal
     instance.total = subtotal + instance.tax
     instance.save()

     return instance

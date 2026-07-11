from rest_framework import serializers
from .models import Invoice, InvoiceItem,InvoicePayment
from .utils import generate_invoice_number


class InvoiceItemSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)
    amount = serializers.SerializerMethodField()

    class Meta:
        model = InvoiceItem
        fields = ["id", "description", "quantity", "rate", "amount"]
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
    tax_rate = serializers.SerializerMethodField(read_only=True)
    client_phone = serializers.CharField(source="client.phone", read_only=True)
    project_name = serializers.SerializerMethodField(read_only=True)

    invoice_number = serializers.CharField(required=False)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    tax = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    total = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)

    class Meta:
        model = Invoice
        fields = "__all__"

    def get_tax_rate(self, obj):
        if obj.subtotal and obj.subtotal > 0:
            return round((obj.tax / obj.subtotal) * 100, 2)
        return 0

    def get_project_name(self, obj):
        if hasattr(obj, 'project') and obj.project:
            return obj.project.name
        return None

    def create(self, validated_data):
        items_data = validated_data.pop("items")

        # remove frontend totals
        validated_data.pop("subtotal", None)
        tax = validated_data.pop("tax", 0) or 0
        validated_data.pop("total", None)

        invoice_number = validated_data.pop("invoice_number", None) or generate_invoice_number()

        subtotal = sum(item["quantity"] * item["rate"] for item in items_data)
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
        from django.db import transaction
        
        with transaction.atomic():
            items_data = validated_data.pop("items", [])
            
            validated_data.pop("subtotal", None)
            tax = validated_data.pop("tax", None)
            validated_data.pop("total", None)

            # Preserve existing invoice number if not explicitly provided
            invoice_number = validated_data.pop("invoice_number", None)
            if invoice_number:
                instance.invoice_number = invoice_number

            # Update other invoice attributes
            for attr, value in validated_data.items():
                setattr(instance, attr, value)

            # Synchronize items
            existing_items = {item.id: item for item in instance.items.all()}
            keep_item_ids = []
            subtotal = 0

            for item_data in items_data:
                item_id = item_data.get("id")
                description = item_data.get("description")
                quantity = item_data.get("quantity")
                rate = item_data.get("rate")
                amount = quantity * rate
                subtotal += amount

                if item_id and item_id in existing_items:
                    # Update existing item
                    item = existing_items[item_id]
                    item.description = description
                    item.quantity = quantity
                    item.rate = rate
                    item.amount = amount
                    item.save()
                    keep_item_ids.append(item_id)
                else:
                    # Create new item
                    new_item = InvoiceItem.objects.create(
                        invoice=instance,
                        description=description,
                        quantity=quantity,
                        rate=rate,
                        amount=amount
                    )
                    keep_item_ids.append(new_item.id)

            # Delete items not passed in request
            for item_id, item in existing_items.items():
                if item_id not in keep_item_ids:
                    item.delete()

            # Recalculate totals
            instance.subtotal = subtotal
            if tax is not None:
                instance.tax = tax
            instance.total = subtotal + instance.tax
            instance.save()

            return instance

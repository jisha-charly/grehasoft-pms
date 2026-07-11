from rest_framework import serializers
from .models import Proposal, ProposalItem


class ProposalItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProposalItem
        fields = ["id", "service", "description", "cost"]


def generate_proposal_secure_pdf_link(serializer_instance, obj):
    from core.signing import generate_secure_pdf_link
    return generate_secure_pdf_link(obj.id, f"/api/v1/proposals/{obj.id}/download_pdf/")


class ProposalSerializer(serializers.ModelSerializer):

    items = ProposalItemSerializer(many=True)
    leadId = serializers.IntegerField(source='lead.id', read_only=True)
    leadName = serializers.CharField(source='lead.name', read_only=True)
    leadEmail = serializers.CharField(source='lead.email', read_only=True)
    leadPhone = serializers.CharField(source='lead.phone', read_only=True)
    secure_pdf_link = serializers.SerializerMethodField()

    class Meta:
        model = Proposal
        fields = [
            "id",
            "lead",
            "leadName",
            "title",
            "description",
            "project_overview",
            "subtotal",
            "discount",
            "amount",
            "status",
            "client",
            "is_converted",
            "items",
            "created_at",
            "last_sent_at",
            "leadEmail",
            "leadPhone",
            "leadId",
            "builder_config",
            "secure_pdf_link",
        ]

    def create(self, validated_data):

     items_data = validated_data.pop("items")

     lead = validated_data.get("lead")

     # Automatically attach client from lead
     if lead and not validated_data.get("client"):
        validated_data["client"] = lead.client

     proposal = Proposal.objects.create(**validated_data)

     for item in items_data:
        ProposalItem.objects.create(proposal=proposal, **item)

     return proposal

    def update(self, instance, validated_data):

        items_data = validated_data.pop("items", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()

        if items_data is not None:
            instance.items.all().delete()

            for item in items_data:
                ProposalItem.objects.create(proposal=instance, **item)

        return instance


    def get_secure_pdf_link(self, obj):
        return generate_proposal_secure_pdf_link(self, obj)


class ClientProposalSerializer(serializers.ModelSerializer):
    items = ProposalItemSerializer(many=True, read_only=True)
    proposal_number = serializers.SerializerMethodField()
    client_details = serializers.SerializerMethodField()
    leadName = serializers.CharField(source='lead.name', read_only=True)
    leadEmail = serializers.CharField(source='lead.email', read_only=True)
    leadPhone = serializers.CharField(source='lead.phone', read_only=True)
    secure_pdf_link = serializers.SerializerMethodField()

    class Meta:
        model = Proposal
        fields = [
            "id",
            "proposal_number",
            "title",
            "description",
            "project_overview",
            "subtotal",
            "discount",
            "amount",
            "status",
            "client",
            "client_details",
            "items",
            "created_at",
            "is_converted",
            "leadName",
            "leadEmail",
            "leadPhone",
            "builder_config",
            "secure_pdf_link",
        ]
        read_only_fields = fields

    def get_proposal_number(self, obj):
        return f"PROP-{obj.id:04d}"

    def get_client_details(self, obj):
        if obj.client:
            return {
                "id": obj.client.id,
                "name": obj.client.name,
                "company_name": obj.client.company_name,
                "email": obj.client.email,
                "phone": obj.client.phone,
                "address": obj.client.address,
            }
        return None

    def get_secure_pdf_link(self, obj):
        return generate_proposal_secure_pdf_link(self, obj)
from rest_framework import serializers
from .models import Proposal, ProposalItem


class ProposalItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProposalItem
        fields = ["id", "service", "description", "cost"]


class ProposalSerializer(serializers.ModelSerializer):

    items = ProposalItemSerializer(many=True)
    leadName = serializers.CharField(source="lead.name", read_only=True)

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
            "client",  # add this
            "is_converted",
            "items",
            "created_at",
            "last_sent_at",
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
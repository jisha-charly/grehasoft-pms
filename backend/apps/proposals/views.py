from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta

from .models import Proposal
from .serializers import ProposalSerializer

from apps.projects.models import Project
from apps.projects.models import Client


class ProposalViewSet(viewsets.ModelViewSet):

    queryset = Proposal.objects.all().order_by("-created_at")
    serializer_class = ProposalSerializer


    @action(detail=True, methods=["post"])
    def send(self, request, pk=None):
        proposal = self.get_object()

        proposal.status = "sent"
        proposal.last_sent_at = timezone.now()
        proposal.save()

        return Response({"message": "Proposal sent"})

    @action(detail=True, methods=["post"])
    def convert(self, request, pk=None):

     proposal = self.get_object()

     lead = proposal.lead
     client = proposal.client or lead.client

     if not client:
        return Response(
            {"error": "Client not found. Please attach a client before converting."},
            status=400
        )

     project = Project.objects.create(
        name=proposal.title,
        client=client,
        department_id=1,
        project_manager_id=request.user.id,
        created_by=request.user,
        start_date=timezone.now().date(),
        end_date=timezone.now().date() + timedelta(days=30),
        status="not_started"
    )

     proposal.is_converted = True
     proposal.save()

     lead.status = "converted"
     lead.save()

     return Response({
        "message": "Proposal converted successfully",
       
        "project": ProjectSerializer(project).data
    })
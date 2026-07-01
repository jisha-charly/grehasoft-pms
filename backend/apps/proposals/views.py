from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
# pyrefly: ignore [missing-import]
from apps.projects.serializers import ProjectSerializer
from .models import Proposal
from .serializers import ProposalSerializer, ClientProposalSerializer
# pyrefly: ignore [missing-import]
from apps.projects.models import Project, Client
from core.permissions import IsClientOwner
from .pdf_generator import ProposalPDFGenerator


class ProposalViewSet(viewsets.ModelViewSet):

    queryset = Proposal.objects.all().order_by("-created_at")
    serializer_class = ProposalSerializer
    permission_classes = [permissions.IsAuthenticated, IsClientOwner]

    def get_serializer_class(self):
        user = self.request.user
        role_name = getattr(user.role, 'name', None) if hasattr(user, 'role') else None
        if role_name == 'CLIENT':
            return ClientProposalSerializer
        return ProposalSerializer

    def get_queryset(self):
        user = self.request.user
        role_name = getattr(user.role, 'name', None) if hasattr(user, 'role') else None
        
        if role_name == 'CLIENT':
            client = user.get_associated_client()
            if not client:
                return Proposal.objects.none()
            if getattr(self, 'detail', False) or self.action in ['retrieve', 'update', 'partial_update', 'destroy', 'send', 'convert'] or 'pk' in self.kwargs:
                return Proposal.objects.all().order_by("-created_at")
            return Proposal.objects.filter(client=client).order_by("-created_at")
            
        return Proposal.objects.all().order_by("-created_at")


    def check_permissions(self, request):
        super().check_permissions(request)
        role_name = getattr(request.user.role, 'name', None) if hasattr(request.user, 'role') else None
        if role_name == 'CLIENT' and request.method not in permissions.SAFE_METHODS:
            # pyrefly: ignore [missing-import]
            from apps.projects.utils import log_failed_attempt
            log_failed_attempt(request.user, f"Tried to write proposal via {request.method}")
            self.permission_denied(request, message="Clients do not have permission to modify proposals.")


    @action(detail=True, methods=["post"])
    def send(self, request, pk=None):
        proposal = self.get_object()

        proposal.status = "sent"
        proposal.last_sent_at = timezone.now()
        proposal.save()

        return Response({"message": "Proposal sent"})
    @action(detail=True, methods=["post"])
    def convert_to_client(self, request, pk=None):
     lead = self.get_object()

     if lead.client:
        return Response({"message": "Already converted"})

     client = Client.objects.create(
        name=lead.name,
        email=lead.email,
        phone=lead.phone
    )

     lead.client = client
     lead.status = "converted"
     lead.save()

     return Response({"client_id": client.id})
   
    @action(detail=True, methods=["post"])
    def convert(self, request, pk=None):

     proposal = self.get_object()
     lead = proposal.lead

     # ✅ STEP 1: GET OR CREATE CLIENT
     client = proposal.client or lead.client

     if not client:
        client = Client.objects.create(
            name=lead.name,
            email=lead.email,
            phone=lead.phone,
        )

        # 🔥 VERY IMPORTANT: update lead + proposal
        lead.client = client
        lead.save()
        
        proposal.client = client
        proposal.save()
 
     # ✅ STEP 2: CREATE PROJECT
     project = Project.objects.create(
        name=proposal.title,
        client=client,
        department_id=1,
        project_manager=request.user,
        created_by=request.user,
        start_date=timezone.now().date(),
        end_date=timezone.now().date() + timedelta(days=30),
        status="not_started"
    )

     # ✅ STEP 3: UPDATE STATUS
     proposal.is_converted = True
     proposal.project = project
     proposal.save()
     # 🔥 CRITICAL FIX (ADD THIS LINE)
     lead.converted_project = project
     lead.status = "converted"
     lead.save()

     return Response({
        "message": "Proposal converted successfully",
        "project": ProjectSerializer(project).data,
        "client": client.id   # ✅ ADD THIS
    })

    @action(detail=True, methods=["get", "post"])
    def download_pdf(self, request, pk=None):
        proposal = self.get_object()
        
        builder_config = None
        if request.method == "POST":
            builder_config = request.data
        else:
            builder_config = proposal.builder_config

        # Audit logging
        # pyrefly: ignore [missing-import]
        from apps.activity.models import ActivityLog
        ActivityLog.objects.create(
            user=request.user,
            action=f"Downloaded proposal PDF for: {proposal.title}"
        )

        from django.http import HttpResponse
        generator = ProposalPDFGenerator(proposal, builder_config)
        pdf_path = generator.generate_pdf()
        
        try:
            with open(pdf_path, "rb") as pdf:
                response = HttpResponse(pdf.read(), content_type="application/pdf")
                response["Content-Disposition"] = f'attachment; filename="proposal_{proposal.id}.pdf"'
            return response
        finally:
            import os
            if os.path.exists(pdf_path):
                os.remove(pdf_path)

    @action(detail=False, methods=["post"])
    def preview_pdf(self, request):
        from django.http import HttpResponse
        proposal_id = request.data.get("id")
        
        if proposal_id:
            try:
                proposal = Proposal.objects.get(id=proposal_id)
            except Proposal.DoesNotExist:
                proposal = Proposal(
                    title=request.data.get("title", "Project Proposal"),
                    subtotal=request.data.get("subtotal", 0),
                    discount=request.data.get("discount", 0),
                    amount=request.data.get("amount", 0)
                )
        else:
            proposal = Proposal(
                title=request.data.get("title", "Project Proposal"),
                subtotal=request.data.get("subtotal", 0),
                discount=request.data.get("discount", 0),
                amount=request.data.get("amount", 0)
            )

        builder_config = request.data.get("builder_config", {})
        
        generator = ProposalPDFGenerator(proposal, builder_config)
        pdf_path = generator.generate_pdf()
        
        try:
            with open(pdf_path, "rb") as pdf:
                response = HttpResponse(pdf.read(), content_type="application/pdf")
                response["Content-Disposition"] = 'inline; filename="proposal_preview.pdf"'
            return response
        finally:
            import os
            if os.path.exists(pdf_path):
                os.remove(pdf_path)
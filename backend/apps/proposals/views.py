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
        import os
        import socket
        import smtplib
        import logging
        from django.db import transaction
        from rest_framework import status
        
        logger = logging.getLogger(__name__)
        proposal = self.get_object()

        # Check if already sent to return a clear resend message later
        is_resend = proposal.status == "sent"

        # 1. Generate Proposal PDF
        try:
            generator = ProposalPDFGenerator(proposal, proposal.builder_config)
            pdf_path = generator.generate_pdf()
        except Exception as e:
            logger.critical(f"❌ Failed to generate Proposal PDF: {str(e)}", exc_info=True)
            return Response({"error": "Failed to compile and generate proposal PDF."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # 2. Email Dispatch
        try:
            from .email_service import send_proposal_email
            send_proposal_email(proposal, pdf_path)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except (smtplib.SMTPAuthenticationError, smtplib.SMTPConnectError, socket.timeout) as e:
            logger.critical(f"❌ SMTP connection/authentication failure: {str(e)}")
            return Response({"error": "Email service is temporarily unavailable. Please check configuration/auth settings."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except (smtplib.SMTPException, OSError) as e:
            logger.error(f"❌ Network or protocol error sending proposal email: {str(e)}")
            return Response({"error": "Failed to send email. Please verify SMTP server settings."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            logger.error(f"❌ Unexpected email dispatch error: {str(e)}", exc_info=True)
            return Response({"error": "An unexpected error occurred during email transmission."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        finally:
            # Always clean up temporary files
            if os.path.exists(pdf_path):
                try:
                    os.remove(pdf_path)
                    logger.info(f"🗑️ Temporary PDF cleaned up: {pdf_path}")
                except Exception as cleanup_err:
                    logger.warning(f"⚠️ Failed to remove temporary PDF file: {str(cleanup_err)}")

        # 3. Database Write Transaction (short & atomic)
        with transaction.atomic():
            proposal.status = "sent"
            proposal.last_sent_at = timezone.now()
            proposal.save()

        msg = "Proposal resent successfully." if is_resend else "Proposal sent successfully."
        return Response({"message": msg})

    @action(detail=True, methods=["post"])
    def convert_to_client(self, request, pk=None):
     proposal = self.get_object()
     lead = proposal.lead

     if proposal.client or (lead and lead.client):
        return Response({"message": "Already converted"})

     # pyrefly: ignore [missing-import]
     from apps.projects.utils import get_or_create_active_client
     client, _ = get_or_create_active_client(
        email=lead.email if lead else "",
        name=lead.name if lead else "",
        phone=lead.phone if lead else "",
        company_name=lead.company_name if (lead and lead.company_name) else "",
        address=""
     )

     proposal.client = client
     proposal.save()

     if lead:
         lead.client = client
         lead.status = "converted"
         lead.save()

     return Response({"client_id": client.id})

   
    @action(detail=True, methods=["post"])
    def convert(self, request, pk=None):

     proposal = self.get_object()
     lead = proposal.lead

     # ✅ STEP 1: GET OR CREATE CLIENT
     client = proposal.client or (lead.client if lead else None)

     if not client:
        if lead:
            # pyrefly: ignore [missing-import]
            from apps.projects.utils import get_or_create_active_client
            client, _ = get_or_create_active_client(
                email=lead.email,
                name=lead.name,
                phone=lead.phone,
                company_name=lead.company_name or "",
                address=""
            )
        else:
            # Fallback if no lead exists
            client = Client.objects.create(name="", email="", phone="", company_name="", address="")

        # 🔥 VERY IMPORTANT: update lead + proposal
        if lead:
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
                # Enforce ownership check for CLIENT users to prevent cross-client BOLA leaks
                role_name = getattr(request.user.role, 'name', None) if hasattr(request.user, 'role') else None
                if role_name == 'CLIENT':
                    client = request.user.get_associated_client()
                    if not client or proposal.client != client:
                        from rest_framework.exceptions import PermissionDenied
                        raise PermissionDenied("You do not have permission to preview this proposal.")
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
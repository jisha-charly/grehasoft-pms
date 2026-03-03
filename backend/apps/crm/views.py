from rest_framework import viewsets, status, permissions,filters
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Lead, LeadFollowup, LeadAssignment
from .serializers import LeadSerializer, LeadFollowupSerializer,LeadAssignmentSerializer
from apps.projects.models import Project
from apps.projects.serializers import ProjectSerializer
from core.permissions import IsSalesManager
from django.db import transaction
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
class LeadViewSet(viewsets.ModelViewSet):
    queryset = Lead.objects.all()
    serializer_class = LeadSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role.name in ['SUPER_ADMIN', 'SALES_MANAGER']:
            return Lead.objects.all()
        # Sales Executives only see leads assigned to them
        return Lead.objects.filter(assignments__sales_exec=user)
 
    @action(detail=True, methods=['post'], permission_classes=[IsSalesManager])
    def convert_to_project(self, request, pk=None):

     lead = self.get_object()

     if lead.status == "converted":
        return Response(
            {"error": "Lead already converted"},
            status=status.HTTP_400_BAD_REQUEST
        )

     if not lead.client:
        return Response(
            {"error": "Lead must be linked to a client before conversion"},
            status=status.HTTP_400_BAD_REQUEST
        )

     with transaction.atomic():

        project = Project.objects.create(
           name=request.data.get("name"),
    client=lead.client,
    department_id=request.data.get("department"),
    project_manager_id=request.data.get("project_manager"),
    created_by=request.user,
    start_date=request.data.get("start_date"),
    end_date=request.data.get("end_date"),  # ✅ THIS FIXES YOUR ERROR
    status=request.data.get("status", "not_started"),
    progress_percentage=request.data.get("progress_percentage", 0)
        )

        lead.status = "converted"
        lead.converted_project = project
        lead.save()

        return Response(
            {
                "message": "Lead converted successfully",
                "project_id": project.id
            },
            status=status.HTTP_201_CREATED
        )

class LeadFollowupViewSet(viewsets.ModelViewSet):
    queryset = LeadFollowup.objects.all()
    serializer_class = LeadFollowupSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['lead', 'status', 'followup_type']
    search_fields = ['notes']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    #def get_queryset(self):
      #  lead_id = self.request.query_params.get('lead_id')
       # if lead_id:
       #     return LeadFollowup.objects.filter(lead_id=lead_id)
        #return super().get_queryset()
    
class LeadAssignmentViewSet(viewsets.ModelViewSet):
    queryset = LeadAssignment.objects.all()
    serializer_class = LeadAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        lead_id = self.request.query_params.get('lead_id')
        if lead_id:
            return LeadAssignment.objects.filter(lead_id=lead_id)
        return super().get_queryset()
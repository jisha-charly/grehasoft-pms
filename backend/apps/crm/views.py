from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Lead, LeadFollowup, LeadAssignment
from .serializers import LeadSerializer, LeadFollowupSerializer
from apps.projects.models import Project
from apps.projects.serializers import ProjectSerializer
from core.permissions import IsSalesManager
from django.db import transaction

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
        """
        Custom action to convert a Lead into a Project.
        Expects project details (department, manager, dates) in request body.
        """
        lead = self.get_object()
        if lead.status == 'converted':
            return Response({'error': 'Lead is already converted'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            # Create the project based on lead data and additional params
            project_data = {
                'name': f"Project: {lead.name}",
                'client': request.data.get('client_id'), # Should exist or be created
                'department': request.data.get('department_id'),
                'project_manager': request.data.get('manager_id'),
                'created_by': request.user.id,
                'start_date': request.data.get('start_date'),
                'end_date': request.data.get('end_date'),
                'status': 'not_started'
            }
            
            # Simple simulation of project creation for the placeholder
            # In production, use ProjectSerializer to validate and save
            project = Project.objects.create(
                name=project_data['name'],
                client_id=project_data['client'],
                department_id=project_data['department'],
                project_manager_id=project_data['project_manager'],
                created_by_id=project_data['created_by'],
                start_date=project_data['start_date'],
                end_date=project_data['end_date']
            )

            # Update lead status
            lead.status = 'converted'
            lead.converted_project = project
            lead.save()

            return Response({
                'message': 'Lead converted successfully',
                'project_id': project.id
            }, status=status.HTTP_201_CREATED)

class LeadFollowupViewSet(viewsets.ModelViewSet):
    queryset = LeadFollowup.objects.all()
    serializer_class = LeadFollowupSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def get_queryset(self):
        lead_id = self.request.query_params.get('lead_id')
        if lead_id:
            return LeadFollowup.objects.filter(lead_id=lead_id)
        return super().get_queryset()

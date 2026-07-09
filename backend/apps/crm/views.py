from rest_framework import viewsets, status, permissions,filters
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Lead, LeadFollowup, LeadAssignment
from .serializers import LeadSerializer, LeadFollowupSerializer,LeadAssignmentSerializer
from apps.projects.models import Project
from apps.projects.serializers import ProjectSerializer
from core.permissions import HasPermission
from django.db import transaction
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
class LeadViewSet(viewsets.ModelViewSet):
    queryset = Lead.objects.all()
    serializer_class = LeadSerializer
    permission_classes = [HasPermission]
    required_permission = 'VIEW_LEADS'



    def check_permissions(self, request):
        if request.method not in permissions.SAFE_METHODS:
            self.required_permission = 'MANAGE_LEADS'
        else:
            self.required_permission = 'VIEW_LEADS'
        super().check_permissions(request)


    def get_queryset(self):
        user = self.request.user
        role_name = getattr(user.role, 'name', None) if hasattr(user, 'role') else None
        
        base_qs = Lead.objects.select_related(
            'client', 'converted_project'
        ).prefetch_related(
            'followups', 'assignments__sales_exec'
        )
        
        if role_name in ['SUPER_ADMIN', 'SALES_MANAGER']:
            return base_qs.all()
        # Sales Executives only see leads assigned to them
        return base_qs.filter(assignments__sales_exec=user)

 
    @action(detail=True, methods=['post'])
    def convert_to_project(self, request, pk=None):
     from core.permissions import has_permission
     if not has_permission(request.user, 'MANAGE_LEADS'):
        return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

     lead = self.get_object()

     if lead.status == "converted":
        return Response(
            {"error": "Lead already converted"},
            status=status.HTTP_400_BAD_REQUEST
        )

     with transaction.atomic():
        client = lead.client
        if not client:
            from apps.projects.utils import get_or_create_active_client
            client, _ = get_or_create_active_client(
                email=lead.email,
                name=lead.name,
                phone=lead.phone,
                company_name=lead.company_name or "",
                address=request.data.get("client_address") or ""
            )
            lead.client = client
            lead.save()

        project = Project.objects.create(
           name=request.data.get("name"),
    client=client,
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
    permission_classes = [HasPermission]
    required_permission = 'VIEW_LEADS'


    def check_permissions(self, request):
        if request.method not in permissions.SAFE_METHODS:
            self.required_permission = 'MANAGE_LEADS'
        else:
            self.required_permission = 'VIEW_LEADS'
        super().check_permissions(request)

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
    permission_classes = [HasPermission]
    required_permission = 'VIEW_LEADS'


    def check_permissions(self, request):
        if request.method not in permissions.SAFE_METHODS:
            self.required_permission = 'MANAGE_LEADS'
        else:
            self.required_permission = 'VIEW_LEADS'
        super().check_permissions(request)


    def get_queryset(self):
        lead_id = self.request.query_params.get('lead_id')
        if lead_id:
            return LeadAssignment.objects.filter(lead_id=lead_id)
        return super().get_queryset()
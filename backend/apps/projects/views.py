from rest_framework import viewsets, permissions
from .models import Project, Client,Milestone,ProjectMember,ActivityLog
from rest_framework.permissions import IsAuthenticated
from .serializers import ProjectSerializer, ClientSerializer
from core.permissions import IsProjectManager
from .serializers import (
    MilestoneSerializer,
    ProjectMemberSerializer,
    ActivityLogSerializer
)

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [IsProjectManager]

    def get_queryset(self):
        user = self.request.user
        if user.role.name == 'SUPER_ADMIN':
            return Project.objects.all()
        return Project.objects.filter(members__user=user)

class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    permission_classes = [permissions.IsAuthenticated]

class MilestoneViewSet(viewsets.ModelViewSet):
    queryset = Milestone.objects.all()
    serializer_class = MilestoneSerializer
    permission_classes = [IsAuthenticated]


class ProjectMemberViewSet(viewsets.ModelViewSet):
    queryset = ProjectMember.objects.all()
    serializer_class = ProjectMemberSerializer
    permission_classes = [IsAuthenticated]


class ActivityLogViewSet(viewsets.ModelViewSet):
    queryset = ActivityLog.objects.all()
    serializer_class = ActivityLogSerializer
    permission_classes = [IsAuthenticated]
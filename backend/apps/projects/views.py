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
from .utils  import log_system_activity
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
   
    def perform_create(self, serializer):
     serializer.save(created_by=self.request.user)

class MilestoneViewSet(viewsets.ModelViewSet):
    queryset = Milestone.objects.all()
    serializer_class = MilestoneSerializer
    permission_classes = [IsAuthenticated]


class ProjectMemberViewSet(viewsets.ModelViewSet):
    queryset = ProjectMember.objects.all()
    serializer_class = ProjectMemberSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        member = serializer.save()
        log_system_activity(
            user=self.request.user,
            project=member.project,
            action=f"Added member: {member.user.name}"
        )

    def perform_update(self, serializer):
        member = serializer.save()
        log_system_activity(
            user=self.request.user,
            project=member.project,
            action=f"Updated role of {member.user.name}"
        )

    def perform_destroy(self, instance):
        log_system_activity(
            user=self.request.user,
            project=instance.project,
            action=f"Removed member: {instance.user.name}"
        )
        instance.delete()


class ActivityLogViewSet(viewsets.ModelViewSet):
    queryset = ActivityLog.objects.all()
    serializer_class = ActivityLogSerializer
    permission_classes = [IsAuthenticated]
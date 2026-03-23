from rest_framework import viewsets, permissions
from .models import Project, Client,Milestone,ProjectMember,ActivityLog
from rest_framework.permissions import IsAuthenticated
from .serializers import ProjectSerializer, ClientSerializer
from core.permissions import HasPermission
from .serializers import (
    MilestoneSerializer,
    ProjectMemberSerializer,
    ActivityLogSerializer
)
from .utils  import log_system_activity
class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [HasPermission]
    required_permission = 'VIEW_PROJECTS'
   
    def get_queryset(self):
        user = self.request.user
        if user.role.name == 'SUPER_ADMIN':
            return Project.objects.all()
        return Project.objects.filter(members__user=user)

class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    permission_classes = [HasPermission]
    required_permission = 'VIEW_CLIENTS'
   
    def perform_create(self, serializer):
     serializer.save()

class MilestoneViewSet(viewsets.ModelViewSet):
    queryset = Milestone.objects.all()
    serializer_class = MilestoneSerializer
    permission_classes = [HasPermission]
    required_permission = 'VIEW_PROJECTS'

    def perform_create(self, serializer):
        milestone = serializer.save()
        log_system_activity(
            user=self.request.user,
            project=milestone.project,
            action=f"Created milestone: {milestone.title}"
        )

    def perform_update(self, serializer):
        milestone = serializer.save()
        log_system_activity(
            user=self.request.user,
            project=milestone.project,
            action=f"Updated milestone: {milestone.title}"
        )

    def perform_destroy(self, instance):
        log_system_activity(
            user=self.request.user,
            project=instance.project,
            action=f"Deleted milestone: {instance.title}"
        )
        instance.delete()


class ProjectMemberViewSet(viewsets.ModelViewSet):
    queryset = ProjectMember.objects.all()
    serializer_class = ProjectMemberSerializer
    permission_classes = [HasPermission]
    required_permission = 'MANAGE_PROJECTS'

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
    queryset = ActivityLog.objects.all().order_by('-created_at')
    serializer_class = ActivityLogSerializer
    permission_classes = [HasPermission]
    required_permission = 'VIEW_PROJECTS'

    def get_queryset(self):
        queryset = super().get_queryset()
        project_id = self.request.query_params.get('project')

        if project_id:
            queryset = queryset.filter(project_id=project_id)

        return queryset
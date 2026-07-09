from rest_framework import filters, permissions, viewsets
from apps.projects.models import Project
from core.permissions import HasPermission

from .models import Server, Domain, WebsiteCredential
from .serializers import (
    ServerSerializer,
    DomainSerializer,
    WebsiteCredentialSerializer
)

class BaseInfraViewSet(viewsets.ModelViewSet):
    permission_classes = [HasPermission]
    required_permission = "MANAGE_INFRASTRUCTURE"

    def filter_queryset_by_role(self, qs):
        user = self.request.user
        role = getattr(getattr(user, "role", None), "name", None)

        if user.is_superuser or role == "SUPER_ADMIN":
            return qs

        if role in ["PROJECT_MANAGER", "TEAM_MEMBER"]:
            project_ids = Project.objects.filter(
                members__user=user
            ).values_list("id", flat=True)

            model_name = qs.model.__name__
            if model_name == "Server":
                return qs.filter(domains__project_id__in=project_ids).distinct()
            elif model_name == "Domain":
                return qs.filter(project_id__in=project_ids)
            elif model_name == "WebsiteCredential":
                return qs.filter(project_id__in=project_ids)

        return qs.none()


class ServerViewSet(BaseInfraViewSet):
    queryset = Server.objects.all().order_by("name")
    serializer_class = ServerSerializer

    def get_queryset(self):
        return self.filter_queryset_by_role(self.queryset)


class DomainViewSet(BaseInfraViewSet):
    queryset = Domain.objects.select_related(
        "project",
        "server"
    ).all().order_by("-expiry_date")

    serializer_class = DomainSerializer

    filter_backends = [filters.SearchFilter]
    search_fields = ["domain_name", "provider", "project__name"]

    def get_queryset(self):
        return self.filter_queryset_by_role(self.queryset)

    def perform_create(self, serializer):
        obj = serializer.save()
        obj.schedule_renewal_reminder(self.request.user)

    def perform_update(self, serializer):
        obj = serializer.save()
        obj.schedule_renewal_reminder(self.request.user)


class WebsiteCredentialViewSet(BaseInfraViewSet):
    queryset = WebsiteCredential.objects.select_related(
        "project",
        "domain"
    ).all().order_by("-created_at")

    serializer_class = WebsiteCredentialSerializer

    def get_queryset(self):
        return self.filter_queryset_by_role(self.queryset)
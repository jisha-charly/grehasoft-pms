from rest_framework import filters, permissions, viewsets

from apps.projects.models import Project
from .models import Server, Domain, WebsiteCredential
from .serializers import (
    ServerSerializer,
    DomainSerializer,
    WebsiteCredentialSerializer,
)


class BaseInfraViewSet(viewsets.ModelViewSet):
    """
    Common RBAC logic:
    - Admin: full access
    - Project Manager / Developer: only entries for projects where they are members
    - Other roles: no access
    """

    permission_classes = [permissions.IsAuthenticated]

    def filter_queryset_by_role(self, qs):
        user = self.request.user
        role = getattr(getattr(user, "role", None), "name", None)

        # Admins see everything
        if getattr(user, "is_superuser", False) or role == "SUPER_ADMIN":
            return qs

        # For project-scoped models, restrict to projects where user is a member
        # Project membership model: apps.projects.models.ProjectMember (already exists)
        if role in ["PROJECT_MANAGER", "TEAM_MEMBER"]:
            return qs.filter(project__members__user=user).distinct()

        # Everyone else: no access for now
        return qs.none()


class ServerViewSet(BaseInfraViewSet):
    queryset = Server.objects.all().order_by("name")
    serializer_class = ServerSerializer

    def get_queryset(self):
        # Servers are global; only admins and PM/dev can see them
        user = self.request.user
        role = getattr(getattr(user, "role", None), "name", None)

        if getattr(user, "is_superuser", False) or role == "SUPER_ADMIN":
            return self.queryset

        if role in ["PROJECT_MANAGER", "TEAM_MEMBER"]:
            # Limit to servers actually referenced by domains in user's projects
            project_ids = Project.objects.filter(members__user=user).values_list(
                "id", flat=True
            )
            return self.queryset.filter(domains__project_id__in=project_ids).distinct()

        return self.queryset.none()


class DomainViewSet(BaseInfraViewSet):
    queryset = Domain.objects.select_related("project", "server").all().order_by(
        "-expiry_date", "domain_name"
    )
    serializer_class = DomainSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["domain_name", "provider", "project__name"]

    def get_queryset(self):
        return self.filter_queryset_by_role(self.queryset)

    def perform_create(self, serializer):
        obj: Domain = serializer.save()
        obj.schedule_renewal_reminder(self.request.user)

    def perform_update(self, serializer):
        obj: Domain = serializer.save()
        obj.schedule_renewal_reminder(self.request.user)


class WebsiteCredentialViewSet(BaseInfraViewSet):
    queryset = (
        WebsiteCredential.objects.select_related("project", "domain")
        .all()
        .order_by("-created_at")
    )
    serializer_class = WebsiteCredentialSerializer

    def get_queryset(self):
        return self.filter_queryset_by_role(self.queryset)

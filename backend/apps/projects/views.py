from rest_framework import viewsets, permissions
from .models import Project, Client
from .serializers import ProjectSerializer, ClientSerializer
from core.permissions import IsProjectManager

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

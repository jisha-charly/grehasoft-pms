from rest_framework import viewsets, permissions
from .models import (
    SEOTask, SEOOnPage, SEOOffPage, SEOTechnical, 
    SEOKeywords, GMBProfile, SocialMediaPost, SocialMetrics
)
from .serializers import (
    SEOTaskSerializer, SEOOnPageSerializer, SEOOffPageSerializer,
    SEOTechnicalSerializer, SEOKeywordsSerializer, GMBProfileSerializer,
    SocialMediaPostSerializer, SocialMetricsSerializer
)

class SEOTaskViewSet(viewsets.ModelViewSet):
    queryset = SEOTask.objects.all()
    serializer_class = SEOTaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        project_id = self.request.query_params.get('project_id')
        if project_id:
            return self.queryset.filter(task__project_id=project_id)
        return self.queryset

class SEOOnPageViewSet(viewsets.ModelViewSet):
    queryset = SEOOnPage.objects.all()
    serializer_class = SEOOnPageSerializer
    permission_classes = [permissions.IsAuthenticated]

class SEOOffPageViewSet(viewsets.ModelViewSet):
    queryset = SEOOffPage.objects.all()
    serializer_class = SEOOffPageSerializer
    permission_classes = [permissions.IsAuthenticated]

class SEOTechnicalViewSet(viewsets.ModelViewSet):
    queryset = SEOTechnical.objects.all()
    serializer_class = SEOTechnicalSerializer
    permission_classes = [permissions.IsAuthenticated]

class SEOKeywordsViewSet(viewsets.ModelViewSet):
    queryset = SEOKeywords.objects.all()
    serializer_class = SEOKeywordsSerializer
    permission_classes = [permissions.IsAuthenticated]

class GMBProfileViewSet(viewsets.ModelViewSet):
    queryset = GMBProfile.objects.all()
    serializer_class = GMBProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        project_id = self.request.query_params.get('project_id')
        if project_id:
            return self.queryset.filter(project_id=project_id)
        return self.queryset

class SocialMediaPostViewSet(viewsets.ModelViewSet):
    queryset = SocialMediaPost.objects.all()
    serializer_class = SocialMediaPostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        project_id = self.request.query_params.get('project_id')
        if project_id:
            return self.queryset.filter(project_id=project_id)
        return self.queryset

class SocialMetricsViewSet(viewsets.ModelViewSet):
    queryset = SocialMetrics.objects.all()
    serializer_class = SocialMetricsSerializer
    permission_classes = [permissions.IsAuthenticated]

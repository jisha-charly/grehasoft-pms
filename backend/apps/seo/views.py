from rest_framework import viewsets, permissions
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import (
    SEOTask, Website, Keyword, Backlink, TechnicalSEO, SEOAnalytics, SocialMedia
)
from .serializers import (
    SEOAnalyticsSerializer, SEOTaskSerializer,  WebsiteSerializer, KeywordSerializer, BacklinkSerializer, TechnicalSEOSerializer,SocialMediaSerializer
)

class WebsiteViewSet(viewsets.ModelViewSet):

    queryset = Website.objects.all().order_by("-created_at")

    serializer_class = WebsiteSerializer

class SEOTaskViewSet(viewsets.ModelViewSet):

    queryset = SEOTask.objects.all().order_by("-created_at")
    serializer_class = SEOTaskSerializer


class KeywordViewSet(viewsets.ModelViewSet):

    queryset = Keyword.objects.all()
    serializer_class = KeywordSerializer


class BacklinkViewSet(viewsets.ModelViewSet):

    queryset = Backlink.objects.all()
    serializer_class = BacklinkSerializer


class TechnicalSEOViewSet(viewsets.ModelViewSet):

    queryset = TechnicalSEO.objects.all()
    serializer_class = TechnicalSEOSerializer


class SEOAnalyticsViewSet(viewsets.ModelViewSet):

    queryset = SEOAnalytics.objects.all()
    serializer_class = SEOAnalyticsSerializer


class SocialMediaViewSet(viewsets.ModelViewSet):

    queryset = SocialMedia.objects.all()
    serializer_class = SocialMediaSerializer

@api_view(["GET"])
def seo_dashboard(request):

    website_id = request.GET.get("website")

    tasks = SEOTask.objects.filter(website_id=website_id)

    analytics = SEOAnalytics.objects.filter(website_id=website_id)

    backlinks = Backlink.objects.filter(website_id=website_id)

    keywords = Keyword.objects.filter(website_id=website_id)

    social = SocialMedia.objects.filter(website_id=website_id)

    technical = TechnicalSEO.objects.filter(website_id=website_id).first()

    metrics = {
        "on_page_score": 82,
        "avg_lcp": technical.lcp if technical else 0,
        "rankings_up": tasks.count(),
        "spam_score": 0.5
    }

    data = {
        "metrics": metrics,
        "tasks": SEOTaskSerializer(tasks, many=True).data,
        "analytics": SEOAnalyticsSerializer(analytics, many=True).data,
        "backlinks": BacklinkSerializer(backlinks, many=True).data,
        "keywords": KeywordSerializer(keywords, many=True).data,
        "social": SocialMediaSerializer(social, many=True).data,
        "technical": TechnicalSEOSerializer(technical).data if technical else None
    }

    return Response(data)
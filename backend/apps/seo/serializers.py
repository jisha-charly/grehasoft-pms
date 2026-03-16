from rest_framework import serializers
from .models import (
    Keyword, SEOTask, Backlink, TechnicalSEO, SEOAnalytics, SocialMedia, Website
)

class WebsiteSerializer(serializers.ModelSerializer):

    client_name = serializers.CharField(
        source="client.company_name",
        read_only=True
    )

    class Meta:
        model = Website
        fields = "__all__"


class SEOTaskSerializer(serializers.ModelSerializer):

    class Meta:
        model = SEOTask
        fields = "__all__"


class KeywordSerializer(serializers.ModelSerializer):

    class Meta:
        model = Keyword
        fields = "__all__"


class BacklinkSerializer(serializers.ModelSerializer):

    class Meta:
        model = Backlink
        fields = "__all__"


class TechnicalSEOSerializer(serializers.ModelSerializer):

    class Meta:
        model = TechnicalSEO
        fields = "__all__"


class SEOAnalyticsSerializer(serializers.ModelSerializer):

    class Meta:
        model = SEOAnalytics
        fields = "__all__"


class SocialMediaSerializer(serializers.ModelSerializer):

    class Meta:
        model = SocialMedia
        fields = "__all__"
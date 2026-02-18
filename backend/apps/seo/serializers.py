from rest_framework import serializers
from .models import (
    SEOTask, SEOOnPage, SEOOffPage, SEOTechnical, 
    SEOKeywords, GMBProfile, SocialMediaPost, SocialMetrics
)

class SEOOnPageSerializer(serializers.ModelSerializer):
    class Meta:
        model = SEOOnPage
        fields = '__all__'

class SEOOffPageSerializer(serializers.ModelSerializer):
    class Meta:
        model = SEOOffPage
        fields = '__all__'

class SEOTechnicalSerializer(serializers.ModelSerializer):
    class Meta:
        model = SEOTechnical
        fields = '__all__'

class SEOKeywordsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SEOKeywords
        fields = '__all__'

class SEOTaskSerializer(serializers.ModelSerializer):
    onpage_metrics = SEOOnPageSerializer(many=True, read_only=True)
    offpage_activities = SEOOffPageSerializer(many=True, read_only=True)
    technical_audits = SEOTechnicalSerializer(many=True, read_only=True)
    keyword_tracking = SEOKeywordsSerializer(many=True, read_only=True)
    project_name = serializers.CharField(source='task.project.name', read_only=True)

    class Meta:
        model = SEOTask
        fields = '__all__'

class SocialMetricsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocialMetrics
        fields = '__all__'

class SocialMediaPostSerializer(serializers.ModelSerializer):
    metrics = SocialMetricsSerializer(many=True, read_only=True)
    
    class Meta:
        model = SocialMediaPost
        fields = '__all__'

class GMBProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = GMBProfile
        fields = '__all__'

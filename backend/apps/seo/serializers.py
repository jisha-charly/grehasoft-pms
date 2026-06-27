from rest_framework import serializers
from .models import (
    SEOActivityType, Website, Keyword, SEODailyWorkLog, SEODailyWorkLogItem, SEOMonthlyTarget, SEOTask, SEOReminder, SEOCredential, SEODailyWorkProof
)
from .utils import encrypt_password, decrypt_password


class SEOActivityTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = SEOActivityType
        fields = "__all__"


class WebsiteSerializer(serializers.ModelSerializer):
    client_name = serializers.SerializerMethodField(read_only=True)
    executive_name = serializers.CharField(source="assigned_executive.name", default="", read_only=True)
    assigned_by_name = serializers.CharField(source="assigned_by.name", default="", read_only=True)

    class Meta:
        model = Website
        fields = "__all__"

    def get_client_name(self, obj):
        if obj.client:
            company = obj.client.company_name.strip() if obj.client.company_name else None
            contact = obj.client.name.strip() if obj.client.name else None
            email = obj.client.email.strip() if obj.client.email else None
            return company or contact or email or f"Client #{obj.client.id}"
        return ""


class KeywordSerializer(serializers.ModelSerializer):
    website_name = serializers.CharField(source="website.website_name", read_only=True)

    class Meta:
        model = Keyword
        fields = "__all__"


class SEODailyWorkLogItemSerializer(serializers.ModelSerializer):
    activity_type_name = serializers.CharField(source="activity_type.name", read_only=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)
    decrypted_password = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = SEODailyWorkLogItem
        fields = [
            "id", "work_log", "activity_type", "activity_type_name", "count",
            "keyword", "submission_url", "domain_authority", "spam_score", "time_spent_minutes",
            "username", "password", "decrypted_password"
        ]
        read_only_fields = ["work_log"]

    def validate(self, attrs):
        password = attrs.get("password")
        if password:
            attrs["password"] = encrypt_password(password)
        return attrs

    def get_decrypted_password(self, obj):
        request = self.context.get("request")
        if not request or not request.user:
            return None
        
        user = request.user
        role_name = user.role.name if getattr(user, 'role', None) else None
        
        is_admin = user.is_superuser or role_name == "SUPER_ADMIN"
        is_seo_manager = role_name == "SEO_MANAGER"
        is_submitting_executive = (obj.work_log and obj.work_log.executive == user)
        
        if is_admin or is_seo_manager or is_submitting_executive:
            if obj.password:
                return decrypt_password(obj.password)
        return None



class SEODailyWorkProofSerializer(serializers.ModelSerializer):
    class Meta:
        model = SEODailyWorkProof
        fields = ["id", "proof_file", "uploaded_at"]


class SEODailyWorkLogSerializer(serializers.ModelSerializer):
    items = SEODailyWorkLogItemSerializer(many=True)
    proof_files = SEODailyWorkProofSerializer(many=True, read_only=True)
    website_name = serializers.CharField(source="website.website_name", read_only=True)
    executive_name = serializers.CharField(source="executive.name", default="", read_only=True)
    created_by_name = serializers.CharField(source="created_by.name", default="", read_only=True)
    approved_by_name = serializers.CharField(source="approved_by.name", default="", read_only=True)
    rejected_by_name = serializers.CharField(source="rejected_by.name", default="", read_only=True)

    class Meta:
        model = SEODailyWorkLog
        fields = "__all__"
        read_only_fields = [
            "executive", "total_count", "created_by", "updated_by", "approved_by",
            "approved_date", "rejected_by", "rejected_date", "remarks_by_manager"
        ]

    def validate(self, attrs):
        proof_file = attrs.get('proof_file')
        if proof_file:
            # Validate file size (10MB)
            max_size = 10 * 1024 * 1024
            if proof_file.size > max_size:
                raise serializers.ValidationError({"proof_file": "File size exceeds 10MB limit."})
            # Validate file extension
            ext = proof_file.name.split('.')[-1].lower()
            allowed = ['xls', 'xlsx', 'pdf', 'jpg', 'jpeg', 'png', 'zip']
            if ext not in allowed:
                raise serializers.ValidationError({"proof_file": "File type not supported. Allowed: xls, xlsx, pdf, jpg, jpeg, png, zip"})

        return attrs

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        request = self.context.get("request")
        if request:
            validated_data["executive"] = request.user
            validated_data["created_by"] = request.user

        work_log = SEODailyWorkLog.objects.create(**validated_data)
        for item_data in items_data:
            SEODailyWorkLogItem.objects.create(work_log=work_log, **item_data)

        work_log.calculate_total_count()
        work_log.save()
        return work_log

    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", None)
        request = self.context.get("request")
        if request:
            instance.updated_by = request.user

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                SEODailyWorkLogItem.objects.create(work_log=instance, **item_data)

        instance.calculate_total_count()
        instance.save()
        return instance


class SEOMonthlyTargetSerializer(serializers.ModelSerializer):
    executive_name = serializers.CharField(source="executive.name", read_only=True)
    website_name = serializers.CharField(source="website.website_name", default="Overall", read_only=True)
    activity_type_name = serializers.CharField(source="activity_type.name", read_only=True)

    class Meta:
        model = SEOMonthlyTarget
        fields = "__all__"


class SEOTaskSerializer(serializers.ModelSerializer):
    website_name = serializers.CharField(source="website.website_name", read_only=True)
    assigned_executive_name = serializers.CharField(source="assigned_executive.name", read_only=True)
    created_by_name = serializers.CharField(source="created_by.name", read_only=True)

    class Meta:
        model = SEOTask
        fields = "__all__"
        read_only_fields = ["created_by"]


class SEOReminderSerializer(serializers.ModelSerializer):
    website_name = serializers.CharField(source="website.website_name", read_only=True)
    assigned_executive_name = serializers.CharField(source="assigned_executive.name", read_only=True)
    created_by_name = serializers.CharField(source="created_by.name", read_only=True)

    class Meta:
        model = SEOReminder
        fields = "__all__"
        read_only_fields = ["created_by"]


class SEOCredentialSerializer(serializers.ModelSerializer):
    website_name = serializers.CharField(source="website.website_name", read_only=True)
    decrypted_password = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = SEOCredential
        fields = [
            "id", "website", "website_name", "platform", "username", 
            "password", "decrypted_password", "notes", "created_at", "updated_at"
        ]

    def get_decrypted_password(self, obj):
        return decrypt_password(obj.password)

    def create(self, validated_data):
        password = validated_data.get("password")
        if password:
            validated_data["password"] = encrypt_password(password)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        password = validated_data.get("password")
        if password:
            validated_data["password"] = encrypt_password(password)
        return super().update(instance, validated_data)
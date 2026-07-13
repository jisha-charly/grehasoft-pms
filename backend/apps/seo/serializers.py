from rest_framework import serializers
from .models import (
    SEOActivityType, Website, Keyword, SEODailyWorkLog, SEODailyWorkLogItem, SEOMonthlyTarget, SEOTask, SEOReminder, SEOCredential, SEODailyWorkProof, SEOTaskTimeline
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

        if work_log.seo_task and work_log.status == "submitted":
            if not SEOTaskTimeline.objects.filter(task=work_log.seo_task, action__in=["First Work Log Submitted", "Additional Work Log Submitted"], remarks__contains=f"Work Log ID: {work_log.id}").exists():
                existing_count = SEODailyWorkLog.objects.filter(seo_task=work_log.seo_task).exclude(status="draft").exclude(id=work_log.id).count()
                action_name = "First Work Log Submitted" if existing_count == 0 else "Additional Work Log Submitted"
                SEOTaskTimeline.objects.create(
                    task=work_log.seo_task,
                    user=work_log.executive,
                    user_name=work_log.executive.name or work_log.executive.username,
                    action=action_name,
                    remarks=f"Work Log ID: {work_log.id}. Date: {work_log.log_date}. Activities count: {work_log.total_count}."
                )
                if work_log.seo_task.status == "pending":
                    work_log.seo_task.status = "in_progress"
                    work_log.seo_task.save()

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

        if instance.seo_task and instance.status == "submitted":
            if not SEOTaskTimeline.objects.filter(task=instance.seo_task, action__in=["First Work Log Submitted", "Additional Work Log Submitted"], remarks__contains=f"Work Log ID: {instance.id}").exists():
                existing_count = SEODailyWorkLog.objects.filter(seo_task=instance.seo_task).exclude(status="draft").exclude(id=instance.id).count()
                action_name = "First Work Log Submitted" if existing_count == 0 else "Additional Work Log Submitted"
                SEOTaskTimeline.objects.create(
                    task=instance.seo_task,
                    user=instance.executive,
                    user_name=instance.executive.name or instance.executive.username,
                    action=action_name,
                    remarks=f"Work Log ID: {instance.id}. Date: {instance.log_date}. Activities count: {instance.total_count}."
                )
                if instance.seo_task.status == "pending":
                    instance.seo_task.status = "in_progress"
                    instance.seo_task.save()

        return instance


class SEOMonthlyTargetSerializer(serializers.ModelSerializer):
    executive_name = serializers.CharField(source="executive.name", read_only=True)
    website_name = serializers.CharField(source="website.website_name", default="Overall", read_only=True)
    activity_type_name = serializers.CharField(source="activity_type.name", read_only=True)

    class Meta:
        model = SEOMonthlyTarget
        fields = "__all__"


class SEOTaskWorkLogHistorySerializer(serializers.ModelSerializer):
    executive_name = serializers.CharField(source="executive.name", read_only=True)
    approved_by_name = serializers.CharField(source="approved_by.name", read_only=True)
    rejected_by_name = serializers.CharField(source="rejected_by.name", read_only=True)
    items = SEODailyWorkLogItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = SEODailyWorkLog
        fields = [
            "id", "log_date", "executive_name", "total_count", "status",
            "remarks", "remarks_by_manager", "approved_by_name", "rejected_by_name",
            "proof_file", "items"
        ]


class SEOTaskTimelineSerializer(serializers.ModelSerializer):
    class Meta:
        model = SEOTaskTimeline
        fields = ["id", "event_time", "user_name", "action", "remarks"]


class SEOTaskSerializer(serializers.ModelSerializer):
    website_name = serializers.CharField(source="website.website_name", read_only=True)
    assigned_executive_name = serializers.CharField(source="assigned_executive.name", read_only=True)
    created_by_name = serializers.CharField(source="created_by.name", read_only=True)
    activity_type_name = serializers.CharField(source="activity_type.name", read_only=True)
    
    submitted_logs_count = serializers.SerializerMethodField(read_only=True)
    latest_submission_date = serializers.SerializerMethodField(read_only=True)
    current_progress = serializers.SerializerMethodField(read_only=True)
    work_history = SEOTaskWorkLogHistorySerializer(source="daily_logs", many=True, read_only=True)
    timeline = SEOTaskTimelineSerializer(many=True, read_only=True)
    completion_summary = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = SEOTask
        fields = "__all__"
        read_only_fields = ["created_by"]

    def get_submitted_logs_count(self, obj):
        return obj.daily_logs.exclude(status="draft").count()

    def get_latest_submission_date(self, obj):
        latest = obj.daily_logs.exclude(status="draft").order_by("-log_date").first()
        return latest.log_date if latest else None

    def get_current_progress(self, obj):
        status_map = {
            "pending": 0,
            "in_progress": 50,
            "ready_for_review": 75,
            "completed": 100,
            "on_hold": 25,
            "overdue": 0
        }
        return status_map.get(obj.status, 0)

    def get_completion_summary(self, obj):
        if obj.status != "completed":
            return None
            
        logs = obj.daily_logs.exclude(status="draft")
        total_logs = logs.count()
        
        total_activities = 0
        total_urls = 0
        total_time = 0
        for log in logs:
            for item in log.items.all():
                total_activities += item.count or 0
                if item.time_spent_minutes:
                    total_time += item.time_spent_minutes
                if item.submission_url:
                    urls = [u.strip() for u in item.submission_url.split('\n') if u.strip()]
                    total_urls += len(urls)
                    
        comp_event = obj.timeline.filter(action="Manager Marked Task as Completed").order_by("-event_time").first()
        completion_date = comp_event.event_time.strftime("%Y-%m-%d %H:%M:%S") if comp_event else None
        completed_by = comp_event.user_name if comp_event else (obj.assigned_executive.name or obj.assigned_executive.username if obj.assigned_executive else None)
        
        ready_event = obj.timeline.filter(action="Marked Ready for Review").order_by("event_time").first()
        review_duration_str = "N/A"
        if ready_event and comp_event:
            diff = comp_event.event_time - ready_event.event_time
            days = diff.days
            hours = diff.seconds // 3600
            minutes = (diff.seconds % 3600) // 60
            parts = []
            if days > 0:
                parts.append(f"{days} day{'s' if days > 1 else ''}")
            if hours > 0:
                parts.append(f"{hours} hour{'s' if hours > 1 else ''}")
            if minutes > 0:
                parts.append(f"{minutes} minute{'s' if minutes > 1 else ''}")
            review_duration_str = ", ".join(parts) if parts else "0 minutes"

        return {
            "total_logs": total_logs,
            "total_activities": total_activities,
            "total_urls": total_urls,
            "total_time": total_time,
            "completion_date": completion_date,
            "completed_by": completed_by,
            "review_duration": review_duration_str
        }


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
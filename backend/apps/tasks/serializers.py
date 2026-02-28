from rest_framework import serializers
from .models import Task, TaskType, TaskAssignment, TaskProgress, TaskFile, TaskReview, TaskComment
from apps.users.serializers import UserSerializer

class TaskTypeSerializer(serializers.ModelSerializer):

    class Meta:
        model = TaskType
        fields = "__all__"

    def validate_name(self, value):
        value = value.upper().strip()

        # 🔥 Exclude current instance during update
        queryset = TaskType.objects.filter(name=value)

        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError(
                "Task type with this name already exists."
            )

        return value


class TaskCommentSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.name', read_only=True)
    class Meta:
        model = TaskComment
        fields = '__all__'

class TaskReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.CharField(source='reviewer.name', read_only=True)

    class Meta:
        model = TaskReview
        fields = "__all__"
        read_only_fields = ["reviewer"]
    def validate(self, data):
        task_file = data.get("task_file")

        # Check if already approved
        if TaskReview.objects.filter(
            task_file=task_file,
            status="approved"
        ).exists():
            raise serializers.ValidationError(
                "This file is already approved and locked."
            )

        return data

class TaskFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskFile
        fields = "__all__"
        read_only_fields = ["file_path", "file_type"]
    def create(self, validated_data):
     file = validated_data.get("file")

     validated_data["file_path"] = file.name
     validated_data["file_type"] = file.content_type

     return super().create(validated_data)

class TaskProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskProgress
        fields = '__all__'

class TaskAssignmentSerializer(serializers.ModelSerializer):
    employee_details = UserSerializer(source='employee', read_only=True)
    class Meta:
        model = TaskAssignment
        fields = '__all__'



class TaskSerializer(serializers.ModelSerializer):
    task_type_name = serializers.CharField(source='task_type.name', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    assignments = TaskAssignmentSerializer(many=True, read_only=True)
    files = TaskFileSerializer(many=True, read_only=True)
    comments = TaskCommentSerializer(many=True, read_only=True)
    latest_progress = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at', 'updated_at']

    def get_latest_progress(self, obj):
        last = obj.progress_history.order_by('-updated_at').first()
        return last.progress_percentage if last else 0

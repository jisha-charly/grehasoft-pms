from rest_framework import serializers
from .models import Task, TaskType, TaskAssignment, TaskProgress, TaskFile, TaskReview, TaskComment
from apps.users.serializers import UserSerializer

class TaskCommentSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.name', read_only=True)
    class Meta:
        model = TaskComment
        fields = '__all__'

class TaskReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.CharField(source='reviewer.name', read_only=True)
    class Meta:
        model = TaskReview
        fields = '__all__'

class TaskFileSerializer(serializers.ModelSerializer):
    reviews = TaskReviewSerializer(many=True, read_only=True)
    uploader_name = serializers.CharField(source='uploaded_by.name', read_only=True)
    class Meta:
        model = TaskFile
        fields = '__all__'

class TaskProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskProgress
        fields = '__all__'

class TaskAssignmentSerializer(serializers.ModelSerializer):
    employee_details = UserSerializer(source='employee', read_only=True)
    class Meta:
        model = TaskAssignment
        fields = '__all__'

class TaskTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskType
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

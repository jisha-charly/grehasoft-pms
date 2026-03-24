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
        read_only_fields = ['user']

class TaskReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.CharField(source='reviewer.name', read_only=True)

    class Meta:
        model = TaskReview
        fields = "__all__"
        read_only_fields = ["reviewer", "review_version", "reviewed_by_role"]
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

    description = serializers.CharField(allow_blank=True, required=False)
    assignees = serializers.ListField(
        child=serializers.IntegerField(), 
        write_only=True, 
        required=False
    )

    class Meta:
        model = Task
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at', 'updated_at']

    def get_latest_progress(self, obj):
        last = obj.progress_history.order_by('-updated_at').first()
        return last.progress_percentage if last else 0

    def create(self, validated_data):
        assignees_data = validated_data.pop('assignees', [])
        
        # If description is missing but required by Model, give default
        if 'description' not in validated_data or not validated_data['description']:
            validated_data['description'] = ''
            
        task = super().create(validated_data)
        
        request = self.context.get('request')
        user_id = request.user.id if request else task.created_by_id
        
        for emp_id in assignees_data:
            TaskAssignment.objects.create(
                task=task,
                employee_id=emp_id,
                assigned_by_id=user_id
            )
        return task

    def update(self, instance, validated_data):
        assignees_data = validated_data.pop('assignees', None)
        
        if 'description' in validated_data and not validated_data['description']:
            validated_data['description'] = ''
            
        task = super().update(instance, validated_data)
        
        if assignees_data is not None:
            request = self.context.get('request')
            user_id = request.user.id if request else task.created_by_id
            
            TaskAssignment.objects.filter(task=task).delete()
            for emp_id in assignees_data:
                TaskAssignment.objects.create(
                    task=task,
                    employee_id=emp_id,
                    assigned_by_id=user_id
                )

        return task

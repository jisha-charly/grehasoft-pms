
from rest_framework import serializers
from .models import User, Role, Department

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name', 'description','permissions', 'created_at', 'updated_at']

class DepartmentSerializer(serializers.ModelSerializer):
    parent_name = serializers.CharField(source='parent.name', read_only=True)

    class Meta:
        model = Department
        fields = ['id', 'name', 'parent', 'parent_name', 'created_at', 'updated_at']

class UserSerializer(serializers.ModelSerializer):
    role_name = serializers.CharField(source='role.name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    role_permissions = serializers.JSONField(source='role.permissions', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'name', 'username', 'email', 'role', 'role_name', 'role_permissions',
            'department', 'department_name', 'status', 'is_active', 
            'date_joined', 'last_login','position', 'joining_date', 'salary_monthly','address',
            'is_superuser', 'client', 'profile_photo'
        ]
        read_only_fields = ['last_login', 'date_joined']

class UserCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'name', 'username', 'email', 'password', 'role', 'department', 'status','position', 'joining_date', 'salary_monthly','address', 'client', 'profile_photo']
        extra_kwargs = {'password': {'write_only': True}}
        read_only_fields = ['id']

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        instance = self.Meta.model(**validated_data)
        if password:
            instance.set_password(password)
        instance.save()
        return instance

    def validate_email(self, value):
        if not value or str(value).strip() == "":
            raise serializers.ValidationError("Email cannot be blank.")
        return value

    def update(self, instance, validated_data):
        request = self.context.get('request')
        
        if request and 'email' in validated_data and validated_data['email'] != instance.email:
            req_user = request.user
            req_is_super = req_user.is_superuser or (req_user.role and req_user.role.name == 'SUPER_ADMIN')
            tgt_is_super = instance.role and instance.role.name == 'SUPER_ADMIN'
            
            if not req_is_super:
                raise serializers.ValidationError({"email": "You do not have permission to change this user's email."})
                
            if req_user.id != instance.id and tgt_is_super:
                raise serializers.ValidationError({"email": "You do not have permission to change this user's email."})

        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance
class UserProfileSerializer(serializers.ModelSerializer):
    role_permissions = serializers.JSONField(source='role.permissions', read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "name",
            "username",
            "email",
            "role",
            "role_permissions",
            "department",
            "date_joined",
            "last_login",
            "is_superuser",
            "client",
            "profile_photo"
        ]
        read_only_fields = ["role", "department", "date_joined", "last_login", "is_superuser"]
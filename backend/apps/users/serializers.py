
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

    def validate(self, attrs):
        """
        Centralized security validation:
        - Prevents non-Super-Admins from assigning the SUPER_ADMIN role.
        - Prevents non-Super-Admins from modifying or demoting existing SUPER_ADMIN users.
        """
        request = self.context.get('request')
        if not request:
            return attrs

        req_user = request.user
        req_is_super = req_user.is_superuser or (req_user.role and req_user.role.name == 'SUPER_ADMIN')

        # 1. Role assignment check
        role = attrs.get('role')
        if role and role.name == 'SUPER_ADMIN':
            if not req_is_super:
                raise serializers.ValidationError({"role": "Only Super Admins can assign the SUPER_ADMIN role."})

        # 2. Modify existing Super Admin account check
        if self.instance:
            instance_is_super = self.instance.is_superuser or (self.instance.role and self.instance.role.name == 'SUPER_ADMIN')
            if instance_is_super and req_user.id != self.instance.id and not req_is_super:
                raise serializers.ValidationError({"role": "Only Super Admins can modify other Super Admin accounts."})

        return attrs

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

class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """
    Dedicated profile serializer containing only safe, self-service fields.
    Excludes all administrative, privilege, and salary fields to block privilege escalation.
    """
    class Meta:
        model = User
        fields = ['name', 'username', 'email', 'address', 'profile_photo']

    def validate(self, attrs):
        allowed = ['name', 'username', 'email', 'address', 'profile_photo']
        for field in self.initial_data.keys():
            if field not in allowed:
                raise serializers.ValidationError(
                    {field: f"Modifying the field '{field}' is prohibited."}
                )
        return attrs

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
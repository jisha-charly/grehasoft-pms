from rest_framework import serializers

from .models import Server, Domain, WebsiteCredential


class ServerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Server
        fields = "__all__"


class DomainSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source="project.name", read_only=True)
    server_name = serializers.CharField(source="server.name", read_only=True)

    class Meta:
        model = Domain
        fields = "__all__"


class WebsiteCredentialSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source="project.name", read_only=True)
    domain_name = serializers.CharField(source="domain.domain_name", read_only=True)

    class Meta:
        model = WebsiteCredential
        fields = "__all__"

    def to_representation(self, instance):
        """
        Mask password fields for non-admin users.
        Admin = SUPER_ADMIN role or is_superuser.
        """
        data = super().to_representation(instance)
        request = self.context.get("request")
        user = getattr(request, "user", None)

        role_name = getattr(getattr(user, "role", None), "name", None)

        is_admin = bool(
            user
            and (
                getattr(user, "is_superuser", False)
                or role_name == "SUPER_ADMIN"
            )
        )

        if is_admin:
            return data

        mask = "••••••••"
        for field in [
            "admin_password",
            "cpanel_password",
            "ftp_password",
            "client_email_password",
        ]:
            if data.get(field):
                data[field] = mask

        return data
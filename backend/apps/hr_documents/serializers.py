from rest_framework import serializers

from .models import Employee, HRDocument


class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = "__all__"


class HRDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = HRDocument
        fields = "__all__"


class OfferLetterInputSerializer(serializers.Serializer):
    employee_id = serializers.IntegerField(required=False)
    employee_name = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    position = serializers.CharField()
    joining_date = serializers.DateField()
    salary_monthly = serializers.DecimalField(max_digits=12, decimal_places=2)
    department = serializers.CharField()


class AppraisalInputSerializer(serializers.Serializer):
    employee_id = serializers.IntegerField()
    increase_percentage = serializers.DecimalField(max_digits=6, decimal_places=2)
    effective_date = serializers.DateField(required=False)


class ExperienceCertificateInputSerializer(serializers.Serializer):
    employee_id = serializers.IntegerField()
    role = serializers.CharField()
    start_date = serializers.DateField()
    end_date = serializers.DateField()


class SalaryCertificateInputSerializer(serializers.Serializer):
    employee_id = serializers.IntegerField()
    company_name = serializers.CharField()
    issue_date = serializers.DateField()

from datetime import date
from decimal import Decimal

from django.http import HttpResponse
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import HasPermission

from .models import Employee, HRDocument
from .pdf import (
    build_appraisal_letter_pdf,
    build_experience_certificate_pdf,
    build_offer_letter_pdf,
    build_salary_certificate_pdf,
)
from .serializers import (
    AppraisalInputSerializer,
    EmployeeSerializer,
    ExperienceCertificateInputSerializer,
    HRDocumentSerializer,
    OfferLetterInputSerializer,
    SalaryCertificateInputSerializer,
)


class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all().order_by("-created_at")
    serializer_class = EmployeeSerializer
    permission_classes = [HasPermission]
    required_permission = 'GENERATE_HR_DOCS'


class HRDocumentViewSet(viewsets.ModelViewSet):
    queryset = HRDocument.objects.all().order_by("-created_at")
    serializer_class = HRDocumentSerializer
    permission_classes = [HasPermission]
    required_permission = 'GENERATE_HR_DOCS'


def _pdf_response(pdf_bytes: bytes, filename: str) -> HttpResponse:
    resp = HttpResponse(pdf_bytes, content_type="application/pdf")
    resp["Content-Disposition"] = f'attachment; filename=\"{filename}\"'
    return resp


class OfferLetterGenerateView(APIView):
    permission_classes = [HasPermission]
    required_permission = 'GENERATE_HR_DOCS'

    def post(self, request):
        ser = OfferLetterInputSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        employee_name = data.get("employee_name")
        address = data.get("address")
        if data.get("employee_id"):
            from django.contrib.auth import get_user_model
            User = get_user_model()
            emp = User.objects.filter(id=data["employee_id"]).select_related("department").first()
            if emp:
                employee_name = employee_name or emp.name
                address = address or emp.address

        ctx = {
            "date": timezone.now().date().isoformat(),
            "employee_name": employee_name,
            "address": address,
            "position": data["position"],
            "joining_date": data["joining_date"].isoformat(),
            "salary_monthly": data["salary_monthly"],
            "department": data["department"],
        }

        pdf = build_offer_letter_pdf(ctx)
        return _pdf_response(pdf, "offer_letter.pdf")


class AppraisalLetterGenerateView(APIView):
    permission_classes = [HasPermission]
    required_permission = 'GENERATE_HR_DOCS'

    def post(self, request):
        ser = AppraisalInputSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        from django.shortcuts import get_object_or_404
        from django.contrib.auth import get_user_model
        User = get_user_model()
        employee = get_object_or_404(User.objects.all(), id=data["employee_id"])
        increase_pct = Decimal(data["increase_percentage"])

        effective = data.get("effective_date")
        if not effective:
            today = timezone.now().date()
            effective = date(today.year, 3, 31)

        old_salary = Decimal(employee.salary_monthly)
        new_salary = (old_salary * (Decimal("1") + (increase_pct / Decimal("100")))).quantize(Decimal("0.01"))

        ctx = {
            "date": timezone.now().date().isoformat(),
            "employee_name": employee.name,
            "effective_date": effective.isoformat(),
            "increase_percentage": str(increase_pct),
            "old_salary_monthly": old_salary,
            "new_salary_monthly": new_salary,
        }

        pdf = build_appraisal_letter_pdf(ctx)
        return _pdf_response(pdf, "appraisal_letter.pdf")


class ExperienceCertificateGenerateView(APIView):
    permission_classes = [HasPermission]
    required_permission = 'GENERATE_HR_DOCS'

    def post(self, request):
        ser = ExperienceCertificateInputSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        from django.shortcuts import get_object_or_404
        from django.contrib.auth import get_user_model
        User = get_user_model()
        employee = get_object_or_404(User.objects.all(), id=data["employee_id"])
        ctx = {
            "date": timezone.now().date().isoformat(),
            "employee_name": employee.name,
            "role": data["role"],
            "start_date": data["start_date"].isoformat(),
            "end_date": data["end_date"].isoformat(),
        }
        pdf = build_experience_certificate_pdf(ctx)
        return _pdf_response(pdf, "experience_certificate.pdf")


class SalaryCertificateGenerateView(APIView):
    permission_classes = [HasPermission]
    required_permission = 'GENERATE_HR_DOCS'

    def post(self, request):
        ser = SalaryCertificateInputSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        from django.shortcuts import get_object_or_404
        from django.contrib.auth import get_user_model
        User = get_user_model()
        employee = get_object_or_404(User.objects.all(), id=data["employee_id"])
        ctx = {
            "company_name": data["company_name"],
            "issue_date": data["issue_date"].isoformat(),
            "employee_name": employee.name,
            "position": employee.position,
            "salary_monthly": employee.salary_monthly,
            "joining_date": employee.joining_date.isoformat() if employee.joining_date else "",
        }
        pdf = build_salary_certificate_pdf(ctx)
        return _pdf_response(pdf, "salary_certificate.pdf")


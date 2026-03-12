from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.users.models import Department


class Employee(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="employee",
    )
    address = models.TextField(blank=True, default="")
    position = models.CharField(max_length=120)
    joining_date = models.DateField()
    salary_monthly = models.DecimalField(max_digits=12, decimal_places=2)
    department = models.ForeignKey(Department, null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"{self.user.name} ({self.position})"


class HRDocument(models.Model):
    class DocType(models.TextChoices):
        OFFER_LETTER = "offer_letter", "Offer Letter"
        APPRAISAL_LETTER = "appraisal_letter", "Appraisal Letter"
        EXPERIENCE_CERTIFICATE = "experience_certificate", "Experience Certificate"
        SALARY_CERTIFICATE = "salary_certificate", "Salary Certificate"

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="documents")
    doc_type = models.CharField(max_length=40, choices=DocType.choices)
    issued_on = models.DateField(default=timezone.now)
    payload = models.JSONField(default=dict)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="generated_hr_documents",
    )
    pdf_file = models.FileField(upload_to="hr_documents/%Y/%m/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"{self.doc_type} - {self.employee.user.name}"


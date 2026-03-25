from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    AppraisalLetterGenerateView,
    EmployeeViewSet,
    ExperienceCertificateGenerateView,
    HRDocumentViewSet,
    OfferLetterGenerateView,
    SalaryCertificateGenerateView,
    InternshipCertificateGenerateView,
)

router = DefaultRouter()
router.register(r"employees", EmployeeViewSet)
router.register(r"hr-documents", HRDocumentViewSet)

urlpatterns = [
    path("hr-documents/offer-letter/", OfferLetterGenerateView.as_view()),
    path("hr-documents/appraisal-letter/", AppraisalLetterGenerateView.as_view()),
    path("hr-documents/experience-certificate/", ExperienceCertificateGenerateView.as_view()),
    path("hr-documents/salary-certificate/", SalaryCertificateGenerateView.as_view()),
    path("hr-documents/internship-certificate/", InternshipCertificateGenerateView.as_view()),
    *router.urls,
]


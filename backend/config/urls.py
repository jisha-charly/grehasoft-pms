from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from apps.projects.views import ProjectViewSet, ClientViewSet,MilestoneViewSet,ProjectMemberViewSet,ActivityLogViewSet
from apps.users.views import UserViewSet, RoleViewSet, DepartmentViewSet
from apps.crm.views import LeadViewSet, LeadFollowupViewSet,LeadAssignmentViewSet
from apps.tasks.views import (
    TaskViewSet, TaskTypeViewSet, TaskFileViewSet, 
    TaskCommentViewSet, TaskReviewViewSet
)
#from apps.activity.views import ActivityLogViewSet
from apps.reports.views import DashboardStatsView
from apps.seo.views import (
    SEOActivityTypeViewSet, WebsiteViewSet, KeywordViewSet, SEODailyWorkLogViewSet,
    SEOMonthlyTargetViewSet, SEOTaskViewSet, SEOReminderViewSet, SEOCredentialViewSet
)
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from django.conf.urls.static import static
from django.conf import settings
from apps.users.views import ProfileView,change_password
from apps.activity.views import ActivityLogViewSet as GlobalActivityLogViewSet
from apps.projects.views import ActivityLogViewSet as ProjectActivityLogViewSet
from apps.invoices.views import InvoicePaymentViewSet, InvoiceViewSet
from apps.invoices import views
from apps.proposals.views import ProposalViewSet
from apps.reminders.views import ReminderViewSet, reminder_dashboard_summary

router = routers.DefaultRouter()

# Project Management
router.register(r'projects', ProjectViewSet)
router.register(r'clients', ClientViewSet)
router.register(r'milestones', MilestoneViewSet)
router.register(r'members', ProjectMemberViewSet)
router.register(r'project-activity-logs', ProjectActivityLogViewSet, basename='project-activity-logs')
# User Management (RBAC)
router.register(r'users', UserViewSet)
router.register(r'roles', RoleViewSet)
router.register(r'departments', DepartmentViewSet)

# CRM & Sales
router.register(r'leads', LeadViewSet)
router.register(r'lead-followups', LeadFollowupViewSet)
router.register(r'lead-assignments', LeadAssignmentViewSet, basename='lead-assignments')
router.register(r'proposals', ProposalViewSet)
router.register(r'reminders', ReminderViewSet, basename='reminders')
# Task Management & Collaboration
router.register(r'tasks', TaskViewSet)
router.register(r'task-types', TaskTypeViewSet)
router.register(r'task-files', TaskFileViewSet)
router.register(r'task-comments', TaskCommentViewSet)
router.register(r'task-reviews', TaskReviewViewSet)

# Global activity logs (profile, login etc.)
router.register(r'activity-logs', GlobalActivityLogViewSet, basename='activity-logs')

# SEO Module
router.register("websites", WebsiteViewSet)
router.register("seo-tasks", SEOTaskViewSet)
router.register("seo-keywords", KeywordViewSet, basename="seo-keywords")
router.register("seo-activity-types", SEOActivityTypeViewSet, basename="seo-activity-types")
router.register("seo-daily-logs", SEODailyWorkLogViewSet, basename="seo-daily-logs")
router.register("seo-monthly-targets", SEOMonthlyTargetViewSet, basename="seo-monthly-targets")
router.register("seo-reminders", SEOReminderViewSet, basename="seo-reminders")
router.register("seo-credentials", SEOCredentialViewSet, basename="seo-credentials")


urlpatterns = [
]


router.register(r'invoices', InvoiceViewSet)
router.register(r"invoice-payments", InvoicePaymentViewSet)
urlpatterns = [
    path('admin/', admin.site.urls),

     # JWT Authentication
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path("api/v1/invoices/analytics/", views.invoice_analytics),
    path('api/v1/', include(router.urls)),
    path("api/v1/", include("apps.hr_documents.urls")),
    path("api/v1/infrastructure/", include("apps.infrastructure.urls")),
    path("api/v1/tracking/", include("apps.tracking.urls")),  # Work Tracking System
    path('api/v1/dashboard-summary/', reminder_dashboard_summary),
    path("api/v1/dashboard/", include("apps.dashboard.urls")),
    path('api/v1/dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('api/v1/auth/', include('rest_framework.urls')), 
    path('api/v1/password_reset/', include('django_rest_passwordreset.urls', namespace='password_reset')),
    path("api/v1/users/profile/", ProfileView.as_view()),
    path("api/v1/users/change-password/", change_password),
    path("api/v1/invoices/<int:pk>/download/",views.download_invoice),
    path("api/v1/invoices/<int:pk>/send-email/", views.send_invoice_email_view,),
  
   
] 
# Removed seo-dashboard endpoint 
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

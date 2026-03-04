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
    SEOTaskViewSet, SEOOnPageViewSet, SEOOffPageViewSet,
    SEOTechnicalViewSet, SEOKeywordsViewSet, GMBProfileViewSet,
    SocialMediaPostViewSet, SocialMetricsViewSet
)
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from django.conf.urls.static import static
from django.conf import settings
router = routers.DefaultRouter()

# Project Management
router.register(r'projects', ProjectViewSet)
router.register(r'clients', ClientViewSet)
router.register(r'milestones', MilestoneViewSet)
router.register(r'members', ProjectMemberViewSet)
router.register(r'activity', ActivityLogViewSet)

# User Management (RBAC)
router.register(r'users', UserViewSet)
router.register(r'roles', RoleViewSet)
router.register(r'departments', DepartmentViewSet)

# CRM & Sales
router.register(r'leads', LeadViewSet)
router.register(r'lead-followups', LeadFollowupViewSet)
router.register(r'lead-assignments', LeadAssignmentViewSet, basename='lead-assignments')

# Task Management & Collaboration
router.register(r'tasks', TaskViewSet)
router.register(r'task-types', TaskTypeViewSet)
router.register(r'task-files', TaskFileViewSet)
router.register(r'task-comments', TaskCommentViewSet)
router.register(r'task-reviews', TaskReviewViewSet)

# Activity & Audit
#router.register(r'activity-logs', ActivityLogViewSet)

# SEO & Social Module
router.register(r'seo-tasks', SEOTaskViewSet)
router.register(r'seo-onpage', SEOOnPageViewSet)
router.register(r'seo-offpage', SEOOffPageViewSet)
router.register(r'seo-technical', SEOTechnicalViewSet)
router.register(r'seo-keywords', SEOKeywordsViewSet)
router.register(r'gmb-profiles', GMBProfileViewSet)
router.register(r'social-posts', SocialMediaPostViewSet)
router.register(r'social-metrics', SocialMetricsViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),

     # JWT Authentication
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/v1/', include(router.urls)),
    path('api/v1/dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('api/v1/auth/', include('rest_framework.urls')), 
    path('api/v1/password_reset/', include('django_rest_passwordreset.urls', namespace='password_reset')),
] 
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

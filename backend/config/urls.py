from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from backend.apps.projects.views import ProjectViewSet, ClientViewSet
from backend.apps.users.views import UserViewSet, RoleViewSet, DepartmentViewSet
from backend.apps.crm.views import LeadViewSet, LeadFollowupViewSet
from backend.apps.tasks.views import (
    TaskViewSet, TaskTypeViewSet, TaskFileViewSet, 
    TaskCommentViewSet, TaskReviewViewSet
)
from backend.apps.activity.views import ActivityLogViewSet
from backend.apps.reports.views import DashboardStatsView
from backend.apps.seo.views import (
    SEOTaskViewSet, SEOOnPageViewSet, SEOOffPageViewSet,
    SEOTechnicalViewSet, SEOKeywordsViewSet, GMBProfileViewSet,
    SocialMediaPostViewSet, SocialMetricsViewSet
)

router = routers.DefaultRouter()

# Project Management
router.register(r'projects', ProjectViewSet)
router.register(r'clients', ClientViewSet)

# User Management (RBAC)
router.register(r'users', UserViewSet)
router.register(r'roles', RoleViewSet)
router.register(r'departments', DepartmentViewSet)

# CRM & Sales
router.register(r'leads', LeadViewSet)
router.register(r'lead-followups', LeadFollowupViewSet)

# Task Management & Collaboration
router.register(r'tasks', TaskViewSet)
router.register(r'task-types', TaskTypeViewSet)
router.register(r'task-files', TaskFileViewSet)
router.register(r'task-comments', TaskCommentViewSet)
router.register(r'task-reviews', TaskReviewViewSet)

# Activity & Audit
router.register(r'activity-logs', ActivityLogViewSet)

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
    path('api/v1/', include(router.urls)),
    path('api/v1/dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('api/v1/auth/', include('rest_framework.urls')), 
]

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create router for ViewSets
router = DefaultRouter()
router.register(r'profiles', views.UserProfileViewSet, basename='userprofile')
router.register(r'sessions', views.WorkSessionViewSet, basename='worksession')

app_name = 'tracking'

urlpatterns = [
    # Router endpoints
    path('', include(router.urls)),
    
    # Heartbeat and logout
    path('heartbeat/', views.heartbeat, name='heartbeat'),
    path('logout/', views.logout, name='logout'),
    
    # Status endpoints
    path('employee-status/', views.employee_status, name='employee_status_all'),
    path('employee-status/<int:user_id>/', views.employee_status, name='employee_status'),
    path('user-status/', views.user_tracking_status, name='user_status'),
    
    # Tracking toggle
    path('toggle-tracking/<int:user_id>/', views.toggle_user_tracking, name='toggle_tracking'),
    path('set-track-enable/', views.set_track_enable, name='set_track_enable'),
    
    # Batch syncing & Screenshot upload
    path('activity-batch-sync/', views.activity_batch_sync, name='activity_batch_sync'),
    path('screenshot-upload/', views.ScreenshotUploadView.as_view(), name='screenshot_upload'),
]

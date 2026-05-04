"""
INSTALLATION AND INTEGRATION GUIDE
Selective Remote Work Tracking System

============================================================================
STEP 1: Add tracking app to INSTALLED_APPS in settings.py
============================================================================

In backend/config/settings.py, find INSTALLED_APPS and add:

    INSTALLED_APPS = [
        'django.contrib.admin',
        'django.contrib.auth',
        'django.contrib.contenttypes',
        'django.contrib.sessions',
        'django.contrib.messages',
        'django.contrib.staticfiles',
        'rest_framework',
        'rest_framework.authtoken',
        'corsheaders',
        
        # Your apps
        'apps.users',
        'apps.projects',
        'apps.tasks',
        
        # ADD THIS LINE:
        'apps.tracking',  # New Work Tracking System
    ]


============================================================================
STEP 2: Add tracking URLs to main urlpatterns in config/urls.py
============================================================================

In backend/config/urls.py, find urlpatterns and add:

    from django.contrib import admin
    from django.urls import path, include
    
    urlpatterns = [
        path('admin/', admin.site.urls),
        path('api/auth/', include('rest_framework.urls')),
        
        # Your existing APIs
        path('api/users/', include('apps.users.urls')),
        path('api/projects/', include('apps.projects.urls')),
        
        # ADD THESE LINES:
        path('api/tracking/', include('apps.tracking.urls')),
    ]


============================================================================
STEP 3: Configure Celery Beat (see CELERY_SETUP_GUIDE.md)
============================================================================

Configure Celery Beat schedule in settings.py CELERY_BEAT_SCHEDULE dict.
See CELERY_SETUP_GUIDE.md for detailed instructions.


============================================================================
STEP 4: Run Database Migrations
============================================================================

    cd backend
    python manage.py makemigrations tracking
    python manage.py migrate


============================================================================
STEP 5: API ENDPOINTS REFERENCE
============================================================================

HEARTBEAT:
    POST /api/tracking/heartbeat/
    
    Request:
        {
            "Content-Type": "application/json"
        }
    
    Response (200):
        {
            "success": true,
            "message": "Heartbeat recorded",
            "session_id": 1,
            "status": "Active"
        }
    
    Response (403 - tracking disabled):
        {
            "success": false,
            "message": "Tracking is disabled for user",
            "session_id": null,
            "status": "Offline"
        }


LOGOUT:
    POST /api/tracking/logout/
    
    Response (200):
        {
            "success": true,
            "message": "Session closed",
            "session_id": 1
        }


EMPLOYEE STATUS (All):
    GET /api/tracking/employee-status/
    
    Response (200):
        [
            {
                "user_id": 1,
                "username": "john_doe",
                "first_name": "John",
                "last_name": "Doe",
                "email": "john@example.com",
                "is_tracking_enabled": true,
                "status": "Active",
                "login_time": "2026-04-29T10:00:00Z",
                "last_ping": "2026-04-29T10:05:00Z",
                "total_work_time": "05:30:45",
                "session_id": 1
            },
            ...
        ]


EMPLOYEE STATUS (Single):
    GET /api/tracking/employee-status/1/
    
    Response (200):
        {
            "user_id": 1,
            "username": "john_doe",
            "first_name": "John",
            "last_name": "Doe",
            "email": "john@example.com",
            "is_tracking_enabled": true,
            "status": "Active",
            "login_time": "2026-04-29T10:00:00Z",
            "last_ping": "2026-04-29T10:05:00Z",
            "total_work_time": "05:30:45",
            "session_id": 1
        }


USER TRACKING STATUS:
    GET /api/tracking/user-status/
    
    Response (200):
        {
            "id": 1,
            "user_id": 1,
            "is_tracking_enabled": true,
            "created_at": "2026-04-29T08:00:00Z",
            "updated_at": "2026-04-29T10:05:00Z"
        }


TOGGLE TRACKING (Specific User):
    POST /api/tracking/toggle-tracking/1/
    
    Request:
        {
            "enabled": true
        }
    
    Response (200):
        {
            "success": true,
            "message": "Tracking enabled",
            "data": {
                "id": 1,
                "user_id": 1,
                "is_tracking_enabled": true,
                "created_at": "2026-04-29T08:00:00Z",
                "updated_at": "2026-04-29T10:10:00Z"
            }
        }


SET TRACKING (Current User):
    POST /api/tracking/set-track-enable/
    
    Request:
        {
            "enabled": true
        }
    
    Response (200):
        {
            "success": true,
            "message": "Tracking enabled",
            "data": {
                "id": 1,
                "user_id": 1,
                "is_tracking_enabled": true
            }
        }


WORK SESSIONS (List - Current User):
    GET /api/tracking/sessions/
    
    Query params:
        ?user_id=1  (admin only, filter by user)
    
    Response (200):
        [
            {
                "id": 1,
                "user_id": 1,
                "login_time": "2026-04-29T10:00:00Z",
                "last_ping": "2026-04-29T10:05:00Z",
                "logout_time": null,
                "is_active_session": true,
                "total_duration_seconds": 300,
                "status": "Active",
                "created_at": "2026-04-29T10:00:00Z",
                "updated_at": "2026-04-29T10:05:00Z"
            }
        ]


ACTIVE SESSION (Current User):
    GET /api/tracking/sessions/active/
    
    Response (200):
        {
            "id": 1,
            "user_id": 1,
            "login_time": "2026-04-29T10:00:00Z",
            "last_ping": "2026-04-29T10:05:00Z",
            "logout_time": null,
            "is_active_session": true,
            "total_duration_seconds": 300,
            "status": "Active",
            "created_at": "2026-04-29T10:00:00Z",
            "updated_at": "2026-04-29T10:05:00Z"
        }


TODAY SESSIONS (Current User):
    GET /api/tracking/sessions/today/
    
    Response (200):
        [
            {
                "id": 1,
                ...
            }
        ]


============================================================================
STEP 6: TESTING THE BACKEND
============================================================================

# Test heartbeat
curl -X POST http://localhost:8000/api/tracking/heartbeat/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Get employee status
curl -X GET http://localhost:8000/api/tracking/employee-status/ \
  -H "Authorization: Bearer YOUR_TOKEN"

# Toggle tracking
curl -X POST http://localhost:8000/api/tracking/toggle-tracking/1/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}'


============================================================================
STEP 7: ADMIN INTERFACE
============================================================================

Access at: http://localhost:8000/admin/

Features:
- Manage UserProfile (enable/disable tracking)
- View WorkSessions with color-coded status
- Monitor ActivityLog for detailed tracking
- Filter by date ranges
- Search by username/email


============================================================================
SECURITY NOTES
============================================================================

1. All endpoints require authentication (IsAuthenticated permission)
2. Users can only access their own data (except admins)
3. Heartbeat endpoint is rate-limited to 60 requests/minute
4. Toggle endpoints check permissions before allowing changes
5. All sensitive operations are logged


============================================================================
PERFORMANCE NOTES
============================================================================

- All list queries use select_related/prefetch_related
- Database indexes on frequently queried fields
- Celery Beat automates cleanup of old sessions
- Lightweight heartbeat endpoint (~2-3ms response)
- Caching-ready design for dashboard (can add Redis cache)


============================================================================
OPTIONAL: DATABASE ROUTER (for high-scale deployments)
============================================================================

If you want to use a separate database for tracking:

Create backend/config/routers.py:

    class TrackingRouter:
        def db_for_read(self, model, **hints):
            if model._meta.app_label == 'tracking':
                return 'tracking'
            return None
        
        def db_for_write(self, model, **hints):
            if model._meta.app_label == 'tracking':
                return 'tracking'
            return None
        
        def allow_relation(self, obj1, obj2, **hints):
            return None
        
        def allow_migrate(self, db, app_label, model_name=None, **hints):
            if app_label == 'tracking':
                return db == 'tracking'
            return None

Then in settings.py:
    DATABASE_ROUTERS = ['config.routers.TrackingRouter']

And configure 'tracking' database in DATABASES.

"""

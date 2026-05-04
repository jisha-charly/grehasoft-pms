"""
QUICK START GUIDE - 15 MINUTES TO IMPLEMENTATION

Follow these exact steps to get the tracking system running.
"""

# ============================================================================
# STEP 1: BACKEND SETUP (5 minutes)
# ============================================================================

# 1.1 Add tracking app to INSTALLED_APPS
# File: backend/config/settings.py
# Find: INSTALLED_APPS = [...]
# Add: 'apps.tracking',

# 1.2 Add URLs
# File: backend/config/urls.py
# Add: path('api/tracking/', include('apps.tracking.urls')),

# 1.3 Run migrations
cd backend
python manage.py makemigrations tracking
python manage.py migrate

# ============================================================================
# STEP 2: CELERY SETUP (3 minutes)
# ============================================================================

# 2.1 Add Celery Beat schedule
# File: backend/config/settings.py
# Add to CELERY_BEAT_SCHEDULE:
CELERY_BEAT_SCHEDULE = {
    'auto-logout-inactive-users': {
        'task': 'apps.tracking.tasks.auto_logout_inactive',
        'schedule': 300.0,
    },
    'cleanup-old-sessions': {
        'task': 'apps.tracking.tasks.cleanup_old_data',
        'schedule': crontab(hour=2, minute=0),
    },
    'generate-daily-report': {
        'task': 'apps.tracking.tasks.generate_daily_report',
        'schedule': crontab(hour=23, minute=55),
    },
}

# 2.2 Start Celery Beat (in separate terminal)
celery -A config beat --loglevel=info

# ============================================================================
# STEP 3: FRONTEND SETUP (4 minutes)
# ============================================================================

# 3.1 Create .env file in frontend root
# File: frontend/.env
REACT_APP_API_URL=http://localhost:8000

# 3.2 Use in your app (example in AppWithTracking.tsx)
# Or add useHeartbeat hook to your login component

import useHeartbeat from './hooks/useHeartbeat';

const MyComponent = () => {
  const heartbeat = useHeartbeat({
    isTrackingEnabled: true,
    token: localStorage.getItem('token') || '',
  });

  // ... rest of component
};

# 3.3 Add dashboard to admin page
import WorkTrackingDashboard from './components/WorkTrackingDashboard';

export default function AdminPage() {
  return <WorkTrackingDashboard />;
}

# ============================================================================
# STEP 4: TEST (3 minutes)
# ============================================================================

# 4.1 Start backend
python manage.py runserver

# 4.2 Start frontend
npm start

# 4.3 Login to your app

# 4.4 Open browser DevTools and check:
# - Network tab: POST /api/tracking/heartbeat/ should appear
# - Console: No errors
# - Local Storage: 'token' should exist

# 4.5 Visit admin dashboard:
# http://localhost:3000/admin/tracking
# Should see employee list with status

# ============================================================================
# VERIFICATION CHECKLIST
# ============================================================================

✓ Backend migrations completed
✓ Celery Beat running
✓ Frontend env configured
✓ App component imports useHeartbeat
✓ Dashboard added to admin page
✓ Heartbeat API responding
✓ Employee status visible in dashboard
✓ Toggle switches work
✓ Real-time updates every 60 seconds

# ============================================================================
# COMMON ISSUES & FIXES
# ============================================================================

Issue: API 404 error
Fix: Check url routing in config/urls.py

Issue: CORS error
Fix: Add CORS_ALLOWED_ORIGINS in settings.py

Issue: Heartbeat not sending
Fix: Check localStorage.token exists
Fix: Check REACT_APP_API_URL is correct

Issue: Celery tasks not running
Fix: Start Celery Beat: celery -A config beat
Fix: Check Redis running on localhost:6379

Issue: Database error on migration
Fix: Run: python manage.py migrate tracking --fake-initial

# ============================================================================
# NEXT STEPS
# ============================================================================

1. Read TRACKING_SYSTEM_README.md for complete documentation
2. Configure TRACKING_ENV_CONFIG.md for your environment
3. Review test.py for testing examples
4. Monitor logs/tracking.log for activity
5. Custom 6. Scale up: Use separate tracking database (see TRACKING_ENV_CONFIG.md)

# ============================================================================
# SUPPORT
# ============================================================================

For issues, check:
1. https://yourdomain.com/admin/ - Admin interface
2. Logs: backend/logs/tracking.log
3. Browser console: DevTools
4. Django debug toolbar (if installed)

For advanced customization, see:
1. TRACKING_SYSTEM_README.md - Architecture & features
2. CELERY_SETUP_GUIDE.md - Task scheduling
3. MIGRATION_GUIDE.md - Database structure
4. INSTALLATION_GUIDE.md - Detailed API docs
"""

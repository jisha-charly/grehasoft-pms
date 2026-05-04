"""
CELERY BEAT SCHEDULE CONFIGURATION FOR WORK TRACKING

Add this to your Django settings.py file in the CELERY_BEAT_SCHEDULE dictionary.

Location: Find the following section in your config/settings.py:

    from celery.schedules import crontab
    
    CELERY_BEAT_SCHEDULE = {
        # ... your existing tasks ...
    }

Then add the following tasks to the CELERY_BEAT_SCHEDULE dictionary:
"""

# ============================================================================
# COPY THIS TO YOUR settings.py CELERY_BEAT_SCHEDULE DICTIONARY
# ============================================================================

CELERY_BEAT_SCHEDULE_TRACKING = {
    'auto-logout-inactive-users': {
        'task': 'apps.tracking.tasks.auto_logout_inactive',
        'schedule': 300.0,  # Run every 5 minutes (300 seconds)
        'options': {'queue': 'default'}
    },
    'cleanup-old-sessions': {
        'task': 'apps.tracking.tasks.cleanup_old_data',
        'schedule': crontab(hour=2, minute=0),  # Run daily at 2:00 AM
        'options': {'queue': 'default'}
    },
    'generate-daily-report': {
        'task': 'apps.tracking.tasks.generate_daily_report',
        'schedule': crontab(hour=23, minute=55),  # Run at 11:55 PM
        'options': {'queue': 'default'}
    },
}

# ============================================================================
# HOW TO INTEGRATE:
# ============================================================================
"""
1. Open backend/config/settings.py

2. Find the existing CELERY_BEAT_SCHEDULE dictionary (around line ~500)

3. Add the above tasks:

    CELERY_BEAT_SCHEDULE = {
        # ... existing tasks ...
        
        # Work Tracking System
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

4. Make sure at the top of settings.py you have:

    from celery.schedules import crontab

5. Ensure the 'tracking' app is in INSTALLED_APPS:

    INSTALLED_APPS = [
        # ... other apps ...
        'apps.tracking',
    ]

6. Restart Celery Beat:

    celery -A config beat --loglevel=info

7. Verify tasks are scheduled:
    - Check Celery logs for "Scheduler: Sending due task"
    - Monitor active sessions in Django admin

"""

# ============================================================================
# ALTERNATIVE: CRON JOB (Without Celery)
# ============================================================================
"""
If you prefer not to use Celery, use Django management commands instead:

1. Create management command: backend/apps/tracking/management/commands/auto_logout.py

2. Then schedule via system cron:

    */5 * * * * cd /path/to/backend && python manage.py auto_logout
    0 2 * * * cd /path/to/backend && python manage.py cleanup_old_data
    55 23 * * * cd /path/to/backend && python manage.py generate_report

"""

# ============================================================================
# SETTINGS.PY ADDITIONS (if not already present)
# ============================================================================
"""
# Add these to your settings.py if using apps.tracking:

# Installed Apps
INSTALLED_APPS = [
    # ... existing apps ...
    'apps.tracking',
]

# Database optimization for tracking
# Add to DATABASES config (if using multiple databases):
DATABASES = {
    'default': {
        # ... your existing config ...
    },
    # Optional: separate DB for tracking if scaling
    'tracking': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'pms_tracking',
        'USER': 'your_user',
        'PASSWORD': 'your_password',
        'HOST': 'localhost',
        'PORT': '3306',
    }
}

# Optional: Database routing for tracking models
DATABASE_ROUTERS = ['config.routers.TrackingRouter']

# API Rate Limiting
REST_FRAMEWORK = {
    # ... existing config ...
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
        'apps.tracking.views.HeartbeatThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour',
        'heartbeat': '60/minute',
    }
}

# Logging for tracking
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'tracking_file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': os.path.join(BASE_DIR, 'logs', 'tracking.log'),
            'maxBytes': 1024 * 1024 * 10,  # 10MB
            'backupCount': 5,
        },
    },
    'loggers': {
        'apps.tracking': {
            'handlers': ['tracking_file'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}

"""

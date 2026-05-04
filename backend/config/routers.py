"""
DATABASE ROUTER - For scaling with separate tracking database

Use this file ONLY if you want to use a separate MySQL database for tracking.
This is optional and recommended for deployments with 500+ users.

File: backend/config/routers.py
"""

class TrackingRouter:
    """
    A router to control all database operations on models for the tracking app.
    """

    def db_for_read(self, model, **hints):
        """
        Attempts to read tracking models go to the tracking database.
        """
        if model._meta.app_label == 'tracking':
            return 'tracking'
        return None

    def db_for_write(self, model, **hints):
        """
        Attempts to write tracking models go to the tracking database.
        """
        if model._meta.app_label == 'tracking':
            return 'tracking'
        return None

    def allow_relation(self, obj1, obj2, **hints):
        """
        Allow relations if both models are tracking models.
        """
        db1 = self.db_for_read(type(obj1), instance=obj1)
        db2 = self.db_for_read(type(obj2), instance=obj2)
        if db1 and db2:
            return db1 == db2
        return None

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        """
        Make sure tracking models only appear in the 'tracking' database.
        """
        if app_label == 'tracking':
            return db == 'tracking'
        return None


# ============================================================================
# SETTINGS.PY ADDITIONS (if using this router)
# ============================================================================

"""
# Add to settings.py:

# Database Router
DATABASE_ROUTERS = ['config.routers.TrackingRouter']

# Database Configuration
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'pms_database',  # Main database
        'USER': 'root',
        'PASSWORD': 'password',
        'HOST': 'localhost',
        'PORT': '3306',
    },
    'tracking': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'pms_tracking',  # Separate database for tracking
        'USER': 'root',
        'PASSWORD': 'password',
        'HOST': 'localhost',
        'PORT': '3306',
    }
}

"""

# ============================================================================
# MIGRATION NOTES
# ============================================================================

"""
When using database router:

1. Create pms_tracking database:
   CREATE DATABASE pms_tracking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

2. Run migrations for tracking only:
   python manage.py migrate tracking --database=tracking

3. Run other migrations on default:
   python manage.py migrate --database=default

4. If migration fails, try:
   python manage.py migrate tracking --database=tracking --fake-initial

5. Verify:
   python manage.py dbshell --database=tracking
   SHOW TABLES;
"""

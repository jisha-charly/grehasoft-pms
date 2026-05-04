"""
MIGRATION INITIALIZATION GUIDE

This file contains the SQL and steps to manually set up the tracking system.

OPTION 1: Using Django Migrations (Recommended)
"""

# Step 1: Generate migrations
# cd backend
# python manage.py makemigrations tracking

# Step 2: View SQL
# python manage.py sqlmigrate tracking 0001

# Step 3: Apply migrations
# python manage.py migrate

"""
OPTION 2: Manual SQL (If needed)

Run these SQL commands directly on your MySQL database:
MySQL version: 5.7+, MariaDB 10.0+
"""

# Create UserProfile table
CREATE TABLE tracking_user_profile (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    is_tracking_enabled BOOLEAN DEFAULT FALSE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    
    KEY idx_user (user_id),
    KEY idx_tracking_enabled (is_tracking_enabled),
    
    FOREIGN KEY (user_id) REFERENCES auth_user(id) ON DELETE CASCADE
);

# Create WorkSession table
CREATE TABLE tracking_work_session (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    login_time DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    last_ping DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    logout_time DATETIME(6) NULL,
    is_active_session BOOLEAN DEFAULT TRUE,
    total_duration BIGINT NULL,  /* Duration in seconds */
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    
    KEY idx_user_active (user_id, is_active_session),
    KEY idx_user_login (user_id, login_time),
    KEY idx_last_ping (last_ping),
    KEY idx_login_time (login_time),
    
    UNIQUE KEY unique_active_session (user_id, is_active_session) WHERE is_active_session = TRUE,
    
    FOREIGN KEY (user_id) REFERENCES auth_user(id) ON DELETE CASCADE
);

# Create ActivityLog table
CREATE TABLE tracking_activity_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_id INT NOT NULL,
    activity_type VARCHAR(10) NOT NULL,  /* 'active', 'idle', 'offline' */
    timestamp DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    
    KEY idx_user_timestamp (user_id, timestamp),
    KEY idx_session_timestamp (session_id, timestamp),
    
    FOREIGN KEY (user_id) REFERENCES auth_user(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES tracking_work_session(id) ON DELETE CASCADE
);

"""
OPTION 3: After Migration - Create Initial Data

Run in Django shell:
    python manage.py shell

Then execute:
"""

from django.contrib.auth.models import User
from apps.tracking.models import UserProfile

# Create UserProfile for all existing users
for user in User.objects.all():
    UserProfile.objects.get_or_create(user=user)

print("UserProfile created for all users")

"""
VERIFICATION STEPS

1. Check tables created:
   SHOW TABLES LIKE 'tracking_%';

2. Describe each table:
   DESC tracking_user_profile;
   DESC tracking_work_session;
   DESC tracking_activity_log;

3. Check indexes:
   SHOW INDEXES FROM tracking_user_profile;
   SHOW INDEXES FROM tracking_work_session;
   SHOW INDEXES FROM tracking_activity_log;

4. Test queries:
   SELECT COUNT(*) FROM tracking_user_profile;
   SELECT COUNT(*) FROM tracking_work_session;

5. Check in Django admin:
   http://localhost:8000/admin/tracking/

"""

"""
ROLLBACK (If needed)

Delete migrations:
    python manage.py migrate tracking zero

Or manually:
    DROP TABLE tracking_activity_log;
    DROP TABLE tracking_work_session;
    DROP TABLE tracking_user_profile;

"""

"""
MIGRATION FILE LOCATION

Once created, the migration file will be at:
    backend/apps/tracking/migrations/0001_initial.py

It will contain:

from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='UserProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('is_tracking_enabled', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='tracking_profile', to='auth.user')),
            ],
            options={
                'db_table': 'tracking_user_profile',
            },
        ),
        # ... more migrations ...
    ]

"""

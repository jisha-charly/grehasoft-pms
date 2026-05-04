"""
ENVIRONMENT CONFIGURATION EXAMPLES

Copy the relevant sections to your configuration files.
"""

# ============================================================================
# .env (Backend Root)
# ============================================================================
"""
# Database
DB_ENGINE=django.db.backends.mysql
DB_NAME=pms_database
DB_USER=root
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=3306

# Email (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=true
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password

# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# JWT (if using)
SECRET_KEY=your-secret-key-here

# Tracking System
TRACKING_DEBUG=false
TRACKING_AUTO_LOGOUT_MINUTES=15
TRACKING_CLEANUP_DAYS=90
"""

# ============================================================================
# frontend/.env
# ============================================================================
"""
REACT_APP_API_URL=http://localhost:8000
REACT_APP_ENVIRONMENT=development
REACT_APP_LOG_LEVEL=info
"""

# ============================================================================
# settings.py Configuration Sections
# ============================================================================
"""

# 1. INSTALLED APPS
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
    'django_celery_beat',
    'django_celery_results',
    
    # Your apps
    'apps.users',
    'apps.projects',
    'apps.tasks',
    'apps.notifications',
    
    # Tracking System
    'apps.tracking',
]

# 2. MIDDLEWARE
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# 3. CORS CONFIGURATION
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:8000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:8000',
]

# 4. REST FRAMEWORK
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
        'apps.tracking.views.HeartbeatThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour',
        'heartbeat': '60/minute',
    },
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# 5. CELERY CONFIGURATION
from celery.schedules import crontab

CELERY_BROKER_URL = 'redis://localhost:6379/0'
CELERY_RESULT_BACKEND = 'redis://localhost:6379/0'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'UTC'
CELERY_ENABLE_UTC = True

CELERY_BEAT_SCHEDULE = {
    # Work Tracking System
    'auto-logout-inactive-users': {
        'task': 'apps.tracking.tasks.auto_logout_inactive',
        'schedule': 300.0,  # Every 5 minutes
        'options': {
            'queue': 'default',
            'priority': 5,
        }
    },
    'cleanup-old-sessions': {
        'task': 'apps.tracking.tasks.cleanup_old_data',
        'schedule': crontab(hour=2, minute=0),  # Daily 2 AM
        'options': {
            'queue': 'default',
            'priority': 3,
        }
    },
    'generate-daily-report': {
        'task': 'apps.tracking.tasks.generate_daily_report',
        'schedule': crontab(hour=23, minute=55),  # Daily 11:55 PM
        'options': {
            'queue': 'default',
            'priority': 3,
        }
    },
    
    # Your existing tasks...
}

# 6. LOGGING
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {asctime} {message}',
            'style': '{',
        },
    },
    'filters': {
        'require_debug_false': {
            '()': 'django.utils.log.RequireDebugFalse',
        },
        'require_debug_true': {
            '()': 'django.utils.log.RequireDebugTrue',
        },
    },
    'handlers': {
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
        'file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': os.path.join(BASE_DIR, 'logs', 'django.log'),
            'maxBytes': 1024 * 1024 * 10,  # 10MB
            'backupCount': 5,
            'formatter': 'verbose',
        },
        'tracking_file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': os.path.join(BASE_DIR, 'logs', 'tracking.log'),
            'maxBytes': 1024 * 1024 * 10,  # 10MB
            'backupCount': 5,
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': True,
        },
        'apps.tracking': {
            'handlers': ['console', 'tracking_file'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}

# 7. CACHING (Optional - for dashboard optimization)
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}

# 8. DATABASE (for single or multiple databases)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': os.getenv('DB_NAME', 'pms_database'),
        'USER': os.getenv('DB_USER', 'root'),
        'PASSWORD': os.getenv('DB_PASSWORD', ''),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '3306'),
        'OPTIONS': {
            'charset': 'utf8mb4',
        }
    },
    # Optional: Separate database for tracking
    # 'tracking': {
    #     'ENGINE': 'django.db.backends.mysql',
    #     'NAME': 'pms_tracking',
    #     'USER': os.getenv('DB_USER', 'root'),
    #     'PASSWORD': os.getenv('DB_PASSWORD', ''),
    #     'HOST': os.getenv('DB_HOST', 'localhost'),
    #     'PORT': os.getenv('DB_PORT', '3306'),
    # }
}

# DATABASE_ROUTERS = ['config.routers.TrackingRouter']

# 9. SECURITY (Production)
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

"""

# ============================================================================
# docker-compose.yml (Optional - for local development)
# ============================================================================
"""
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: pms_database
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build: ./backend
    command: python manage.py runserver 0.0.0.0:8000
    ports:
      - "8000:8000"
    environment:
      - DEBUG=True
      - DB_HOST=mysql
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mysql
      - redis
    volumes:
      - ./backend:/app

  celery:
    build: ./backend
    command: celery -A config worker -l info
    environment:
      - DEBUG=True
      - DB_HOST=mysql
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mysql
      - redis
    volumes:
      - ./backend:/app

  celery-beat:
    build: ./backend
    command: celery -A config beat -l info
    environment:
      - DEBUG=True
      - DB_HOST=mysql
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mysql
      - redis
    volumes:
      - ./backend:/app

  frontend:
    build: ./frontend
    command: npm start
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:8000
    depends_on:
      - backend
    volumes:
      - ./frontend:/app
      - /app/node_modules

volumes:
  mysql_data:
  redis_data:
"""

# ============================================================================
# Nginx Configuration (Production - Optional)
# ============================================================================
"""
upstream django_backend {
    server backend:8000;
}

upstream react_frontend {
    server frontend:3000;
}

server {
    listen 80;
    server_name pms.example.com;

    client_max_body_size 100M;

    # Frontend
    location / {
        proxy_pass http://react_frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # API
    location /api/ {
        proxy_pass http://django_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Admin
    location /admin/ {
        proxy_pass http://django_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files
    location /static/ {
        alias /app/backend/static/;
        expires 30d;
    }

    # Media files
    location /media/ {
        alias /app/backend/media/;
        expires 30d;
    }
}
"""

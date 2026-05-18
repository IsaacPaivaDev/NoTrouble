"""
Django settings for core project.
"""

import os
from pathlib import Path
from datetime import timedelta
import dj_database_url  # 🚀 Lê a URL do Supabase na nuvem

BASE_DIR = Path(__file__).resolve().parent.parent


# =====================================================================
# 🔐 SECURITY
# =====================================================================

# Em PRODUÇÃO (Render), defina SECRET_KEY como env var.
# O fallback existe só pra você rodar local sem dor de cabeça.
SECRET_KEY = os.environ.get(
    'SECRET_KEY',
    'django-insecure-$e0=!uahimk0671+3@-&l-vymjlz%el6zh8pjr88%k)+e@$4+^'
)

# ⚠️ FAIL-SAFE: se DEBUG não vier configurado, assume PRODUÇÃO (False).
# Mais seguro do que assumir dev. Para rodar local, defina DEBUG=True no .env.
DEBUG = os.environ.get('DEBUG', 'False') == 'True'

# ALLOWED_HOSTS via env var separados por vírgula.
# Exemplo no Render: ALLOWED_HOSTS=notrouble-api.onrender.com,localhost,127.0.0.1
ALLOWED_HOSTS = [
    host.strip()
    for host in os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')
    if host.strip()
]


# =====================================================================
# 📦 APPS
# =====================================================================

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Nossos Apps
    'api',

    # Terceiros
    'corsheaders',
    'rest_framework',
    'rest_framework_simplejwt',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',     # 🚀 Estáticos no Render
    'corsheaders.middleware.CorsMiddleware',          # ⚠️ Tem que vir ANTES de CommonMiddleware
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'


# =====================================================================
# 🗄️ DATABASE (Supabase em prod, Postgres local em dev)
# =====================================================================

DATABASES = {
    'default': dj_database_url.config(
        default='postgres://postgres:0279@localhost:5432/notrouble_db',
        conn_max_age=600,
        ssl_require=not DEBUG,  # Supabase exige SSL; local geralmente não usa
    )
}


# =====================================================================
# 🌐 CORS & CSRF
# =====================================================================

# 🚨 NUNCA use CORS_ALLOW_ALL_ORIGINS=True em produção.
# Lista explícita via env, separada por vírgula.
CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get(
        'CORS_ALLOWED_ORIGINS',
        'http://localhost:5173,http://127.0.0.1:5173'
    ).split(',')
    if origin.strip()
]

CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get(
        'CSRF_TRUSTED_ORIGINS',
        'http://localhost:5173,http://127.0.0.1:5173'
    ).split(',')
    if origin.strip()
]

CORS_ALLOW_CREDENTIALS = True


# =====================================================================
# 🔒 HEADERS DE SEGURANÇA (somente em produção)
# =====================================================================

if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000  # 1 ano
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_CONTENT_TYPE_NOSNIFF = True


# =====================================================================
# 📁 STATIC / MEDIA
# =====================================================================

STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')


# =====================================================================
# 👤 AUTH / DRF / JWT
# =====================================================================

AUTH_USER_MODEL = 'api.User'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'AUTH_HEADER_TYPES': ('Bearer',),
}


# =====================================================================
# 🌍 I18N
# =====================================================================

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# =====================================================================
# 📧 EMAIL (Configuração Outlook)
# =====================================================================
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp-mail.outlook.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = f"NoTrouble <{EMAIL_HOST_USER}>"
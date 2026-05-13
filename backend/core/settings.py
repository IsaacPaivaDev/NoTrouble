"""
Django settings for core project.
"""

import os
from pathlib import Path
import dj_database_url # 🚀 NOVO: Lê a URL do Supabase na nuvem

BASE_DIR = Path(__file__).resolve().parent.parent

# 🚀 O Django agora tenta pegar a chave secreta das variáveis de ambiente do Render. 
# Se não achar (no seu PC), ele usa essa padrão.
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-$e0=!uahimk0671+3@-&l-vymjlz%el6zh8pjr88%k)+e@$4+^')

# 🚀 Na nuvem, isso vai virar False automaticamente para proteger seus erros
DEBUG = os.environ.get('DEBUG', 'True') == 'True'

# 🚀 Permite o Render e o seu localhost acessarem o backend
ALLOWED_HOSTS = ['*'] 

# Application definition
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
    'whitenoise.middleware.WhiteNoiseMiddleware', # 🚀 NOVO: Ajuda o Render a carregar imagens e CSS
    'corsheaders.middleware.CorsMiddleware',
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

# 🚀 DATABASE INTELIGENTE
# Ele tenta pegar a URL do Supabase do Render. Se não existir, ele usa o seu banco local do PostgreSQL!
DATABASES = {
    'default': dj_database_url.config(
        default='postgres://postgres:0279@localhost:5432/notrouble_db',
        conn_max_age=600
    )
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# 🚀 STATIC FILES (Obrigatório para o Render)
STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

AUTH_USER_MODEL = 'api.User'

# 🚀 CORS (Liberado para facilitar o Deploy. Depois a gente trava só pra sua URL da Vercel)
CORS_ALLOW_ALL_ORIGINS = True 

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    )
}

from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1), 
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'AUTH_HEADER_TYPES': ('Bearer',),
}
from django.contrib import admin
from django.urls import path
from api.endpoints import api
from django.conf import settings
from django.conf.urls.static import static

# Importando as views prontas do JWT
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # 🚨 JWT ANTES DO NINJA 🚨
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # O Ninja captura todo o resto daqui pra baixo
    path('api/', api.urls), 
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
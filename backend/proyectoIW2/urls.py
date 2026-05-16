from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    # Usamos 'api/' como prefijo base para que no se duplique 'serie'
    path('api/', include('serie.urls')), 
]
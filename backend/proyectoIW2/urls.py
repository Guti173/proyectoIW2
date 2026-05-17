from django.contrib import admin
from django.urls import path, include
from .router import router
from user.views import auth_me

urlpatterns = [
    path('admin/', admin.site.urls),
    path("auth/me/", auth_me, name="auth-me"),
    path('api/', include(router.urls)),
]

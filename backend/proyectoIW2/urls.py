from django.urls import path, include
from .router import router
from user.views import auth_me

urlpatterns = [
    path("auth/me/", auth_me, name="auth-me"),
    path("", include(router.urls)),
]

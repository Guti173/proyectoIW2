from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import *


# Creating a new router object.
routerUser = DefaultRouter()
# Registering the viewset to the router.
routerUser.register(prefix="user", basename="user", viewset=UserView)

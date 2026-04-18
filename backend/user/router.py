from rest_framework.routers import DefaultRouter
from .views import *

routerUser = DefaultRouter()
routerUser.register(prefix="user", basename="user", viewset=UserView)
routerUser.register(prefix="group", basename="group", viewset=GroupView)
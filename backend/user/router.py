from rest_framework.routers import DefaultRouter
from .views import UserView

routerUser = DefaultRouter()
routerUser.register(prefix="user", basename="user", viewset=UserView)

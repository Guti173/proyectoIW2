from rest_framework.routers import DefaultRouter
from .views import *

routerSocial = DefaultRouter()
routerSocial.register(prefix="amistad", basename="amistad", viewset=AmistadView)
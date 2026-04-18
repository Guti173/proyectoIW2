from rest_framework.routers import DefaultRouter
from .views import *

routerModule = DefaultRouter()
routerModule.register(prefix="module", basename="module", viewset=ModuleView)
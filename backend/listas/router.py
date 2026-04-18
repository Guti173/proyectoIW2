from rest_framework.routers import DefaultRouter
from .views import *

routerListas = DefaultRouter()
routerListas.register(prefix="listausuario", basename="listausuario", viewset=ListaUsuarioView)
routerListas.register(prefix="progresoserie", basename="progresoserie", viewset=ProgresoSerieView)
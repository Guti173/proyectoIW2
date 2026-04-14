from rest_framework.routers import DefaultRouter

from .views import *


routerListasUsuario = DefaultRouter()
routerListasUsuario.register(
    prefix="listausuario", basename="listausuario", viewset=ListaUsuarioView
)

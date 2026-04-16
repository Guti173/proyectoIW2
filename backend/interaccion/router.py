from rest_framework.routers import DefaultRouter
from .views import *

routerInteraccion = DefaultRouter()
routerInteraccion.register(prefix="comentario", basename="comentario", viewset=ComentarioView)
routerInteraccion.register(prefix="valoracion", basename="valoracion", viewset=ValoracionView)
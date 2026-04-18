from rest_framework.routers import DefaultRouter
from .views import *

routerSerie = DefaultRouter()
routerSerie.register(prefix="serie", basename="serie", viewset=SerieView)
routerSerie.register(prefix="genero", basename="genero", viewset=GeneroView)
from rest_framework.routers import DefaultRouter

from .views import *


routerSeries = DefaultRouter()
routerSeries.register(prefix="serie", basename="serie", viewset=SerieView)

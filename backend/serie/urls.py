from django.urls import path, include
from .router import routerSerie  # Importamos tu inicializador específico[cite: 5, 6]

urlpatterns = [
    # Esto incluye automáticamente /serie/ y /genero/[cite: 6]
    path("", include(routerSerie.urls)),
]
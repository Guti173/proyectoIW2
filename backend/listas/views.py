from rest_framework import viewsets
from .models import ListaUsuario, ProgresoSerie
from .serializers import ListaUsuarioSerializer, ProgresoSerieSerializer

class ListaUsuarioView(viewsets.ModelViewSet):
    queryset = ListaUsuario.objects.all()
    serializer_class = ListaUsuarioSerializer

class ProgresoSerieView(viewsets.ModelViewSet):
    queryset = ProgresoSerie.objects.all()
    serializer_class = ProgresoSerieSerializer
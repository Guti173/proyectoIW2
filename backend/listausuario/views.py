from rest_framework import viewsets

from .models import ListaUsuario
from .serializers import ListaUsuarioSerializer


class ListaUsuarioView(viewsets.ModelViewSet):
    queryset = ListaUsuario.objects.all()
    serializer_class = ListaUsuarioSerializer

    def get_queryset(self):
        queryset = ListaUsuario.objects.all()
        tipo_lista = self.request.query_params.get("tipoLista")

        if tipo_lista is not None:
            queryset = queryset.filter(tipoLista__icontains=tipo_lista)

        return queryset

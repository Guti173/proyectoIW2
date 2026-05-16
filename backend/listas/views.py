from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import ListaUsuario, ProgresoSerie
from .serializers import ListaUsuarioSerializer, ProgresoSerieSerializer
from user.auth import get_current_user
from serie.models import Serie

class ListaUsuarioView(viewsets.ModelViewSet):
    queryset = ListaUsuario.objects.all()
    serializer_class = ListaUsuarioSerializer

    def get_queryset(self):
        queryset = ListaUsuario.objects.prefetch_related('series').select_related('user').all()
        user = get_current_user(self.request, ensure_exists=False)

        if user is not None:
            return queryset.filter(user=user)

        return queryset

    def perform_create(self, serializer):
        user = get_current_user(self.request)
        serializer.save(user=user)

    def create(self, request, *args, **kwargs):
        user = get_current_user(request)
        tipo_lista = request.data.get('tipoLista', '').strip()

        if ListaUsuario.objects.filter(user=user, tipoLista__iexact=tipo_lista).exists():
            return Response(
                {'detail': 'Ya existe una lista con ese nombre.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return super().create(request, *args, **kwargs)

    @action(detail=False, methods=['get'], url_path='mine')
    def mine(self, request):
        user = get_current_user(request)
        queryset = self.get_queryset().filter(user=user).order_by('-fechaAgregado', '-id')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='add-serie')
    def add_serie(self, request, pk=None):
        lista = self.get_object()
        serie_id = request.data.get('serieId')

        if not serie_id:
            return Response({'detail': 'Falta serieId.'}, status=status.HTTP_400_BAD_REQUEST)

        serie = Serie.objects.filter(pk=serie_id).first()
        if serie is None:
            return Response({'detail': 'La serie no existe.'}, status=status.HTTP_404_NOT_FOUND)

        lista.series.add(serie)
        serializer = self.get_serializer(lista)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='remove-serie')
    def remove_serie(self, request, pk=None):
        lista = self.get_object()
        serie_id = request.data.get('serieId')

        if not serie_id:
            return Response({'detail': 'Falta serieId.'}, status=status.HTTP_400_BAD_REQUEST)

        lista.series.remove(serie_id)
        serializer = self.get_serializer(lista)
        return Response(serializer.data)

class ProgresoSerieView(viewsets.ModelViewSet):
    queryset = ProgresoSerie.objects.all()
    serializer_class = ProgresoSerieSerializer

    def get_queryset(self):
        queryset = ProgresoSerie.objects.select_related('user', 'serie').all()
        try:
            user = get_current_user(self.request, ensure_exists=False)
        except Exception:
            user = None

        if user is not None:
            return queryset.filter(user=user)

        return queryset

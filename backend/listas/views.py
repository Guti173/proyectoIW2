from datetime import date

from django.db.models import F
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import ListaSerie, ListaUsuario, ProgresoSerie
from .serializers import ListaUsuarioSerializer, ProgresoSerieSerializer
from user.auth import get_current_user
from user.permissions import require_active_user
from serie.models import Serie


def get_or_create_user_list(user, name, description=''):
    lista = ListaUsuario.objects.filter(user=user, tipoLista__iexact=name).first()

    if lista is None:
        lista = ListaUsuario.objects.create(
            user=user,
            tipoLista=name,
            descripcion=description,
        )

    return lista


def sync_progress_lists(user, serie, completed):
    viendo = get_or_create_user_list(user, 'Viendo', 'Series que estoy viendo')
    completadas = get_or_create_user_list(user, 'Completadas', 'Series completadas')

    if completed:
        remove_serie_from_list(viendo, serie)
        add_serie_to_list(completadas, serie)
    else:
        remove_serie_from_list(completadas, serie)
        add_serie_to_list(viendo, serie)


def add_serie_to_list(lista, serie):
    lista.series.add(serie)
    ListaSerie.objects.get_or_create(lista=lista, serie=serie)


def remove_serie_from_list(lista, serie):
    lista.series.remove(serie)
    ListaSerie.objects.filter(lista=lista, serie=serie).delete()


class ListaUsuarioView(viewsets.ModelViewSet):
    queryset = ListaUsuario.objects.all()
    serializer_class = ListaUsuarioSerializer

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        require_active_user(request)

    def get_queryset(self):
        queryset = ListaUsuario.objects.prefetch_related('series').select_related('user').all()
        user = get_current_user(self.request, ensure_exists=False)

        if user is not None:
            return queryset.filter(user=user)

        return queryset.none()

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

        add_serie_to_list(lista, serie)
        serializer = self.get_serializer(lista)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='remove-serie')
    def remove_serie(self, request, pk=None):
        lista = self.get_object()
        serie_id = request.data.get('serieId')

        if not serie_id:
            return Response({'detail': 'Falta serieId.'}, status=status.HTTP_400_BAD_REQUEST)

        serie = Serie.objects.filter(pk=serie_id).first()

        if serie is not None:
            remove_serie_from_list(lista, serie)

        serializer = self.get_serializer(lista)
        return Response(serializer.data)

class ProgresoSerieView(viewsets.ModelViewSet):
    queryset = ProgresoSerie.objects.all()
    serializer_class = ProgresoSerieSerializer

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        require_active_user(request)

    def get_queryset(self):
        queryset = ProgresoSerie.objects.select_related('user', 'serie').all()
        try:
            user = get_current_user(self.request, ensure_exists=False)
        except Exception:
            user = None

        if user is not None:
            queryset = queryset.filter(user=user)
        else:
            queryset = queryset.none()

        serie_id = self.request.GET.get('serieId') or self.request.GET.get('serie')
        if serie_id:
            queryset = queryset.filter(serie_id=serie_id)

        return queryset

    def perform_create(self, serializer):
        user = get_current_user(self.request)
        serializer.save(user=user)

    @action(detail=False, methods=['get'], url_path='by-serie')
    def by_serie(self, request):
        user = get_current_user(request)
        serie_id = request.GET.get('serieId') or request.GET.get('serie')

        if not serie_id:
            return Response({'detail': 'Falta serieId.'}, status=status.HTTP_400_BAD_REQUEST)

        progreso = ProgresoSerie.objects.filter(user=user, serie_id=serie_id).first()

        if progreso is None:
            return Response(None)

        serializer = self.get_serializer(progreso)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='continue-watching')
    def continue_watching(self, request):
        queryset = (
            self.get_queryset()
            .filter(serie__numeroEpisodios__gt=0)
            .exclude(estado__iexact='Completada')
            .filter(episodiosVistos__lt=F('serie__numeroEpisodios'))
            .order_by('-ultimaActualizacion', '-id')
        )
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='start')
    def start(self, request):
        user = get_current_user(request)
        serie_id = request.data.get('serieId')
        serie = Serie.objects.filter(pk=serie_id).first()

        if serie is None:
            return Response({'detail': 'La serie no existe.'}, status=status.HTTP_404_NOT_FOUND)

        today = date.today()
        progreso, created = ProgresoSerie.objects.get_or_create(
            user=user,
            serie=serie,
            defaults={
                'episodiosVistos': 0,
                'fechaInicio': today,
                'fechaFin': None,
                'ultimaActualizacion': today,
                'estado': 'Viendo',
            },
        )

        if not created and progreso.estado != 'Completada':
            progreso.estado = 'Viendo'
            progreso.fechaFin = None
            progreso.ultimaActualizacion = today
            progreso.save()

        sync_progress_lists(user, serie, completed=progreso.estado == 'Completada')

        serializer = self.get_serializer(progreso)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='set-progress')
    def set_progress(self, request):
        user = get_current_user(request)
        serie_id = request.data.get('serieId')
        serie = Serie.objects.filter(pk=serie_id).first()

        if serie is None:
            return Response({'detail': 'La serie no existe.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            episodios_vistos = int(request.data.get('episodiosVistos', 0))
        except (TypeError, ValueError):
            return Response(
                {'detail': 'episodiosVistos debe ser un número entero.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        total_episodios = max(int(serie.numeroEpisodios or 0), 0)
        episodios_vistos = max(0, min(episodios_vistos, total_episodios))
        today = date.today()
        completed = total_episodios > 0 and episodios_vistos >= total_episodios

        progreso, _ = ProgresoSerie.objects.get_or_create(
            user=user,
            serie=serie,
            defaults={
                'fechaInicio': today,
                'episodiosVistos': episodios_vistos,
                'ultimaActualizacion': today,
                'estado': 'Completada' if completed else 'Viendo',
                'fechaFin': today if completed else None,
            },
        )

        progreso.episodiosVistos = episodios_vistos
        progreso.ultimaActualizacion = today
        progreso.estado = 'Completada' if completed else 'Viendo'
        progreso.fechaFin = today if completed else None
        progreso.save()

        sync_progress_lists(user, serie, completed=completed)

        serializer = self.get_serializer(progreso)
        return Response(serializer.data)

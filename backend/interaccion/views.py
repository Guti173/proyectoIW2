from datetime import date

from django.db import transaction
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from .models import Comentario, LikeComentario, Valoracion, ReporteComentario
from .serializers import ComentarioSerializer, ValoracionSerializer, ReporteComentarioSerializer
from user.permissions import can_manage_object, require_active_user, require_admin_user

class ComentarioView(viewsets.ModelViewSet):
    queryset = Comentario.objects.select_related('user', 'serie').prefetch_related('likes')
    serializer_class = ComentarioSerializer

    def list(self, request):
        serie_id = request.GET.get("serie")

        if serie_id:
            result = self.get_queryset().filter(serie=serie_id)
        else:
            result = self.get_queryset().all()

        serializer = self.get_serializer(result.order_by('-fechaPublicacion', '-id'), many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        user = require_active_user(self.request)
        serializer.save(
            user=user,
            fechaPublicacion=date.today(),
            estado='Publicado',
        )

    def _check_owner_or_admin(self, request, comentario):
        user = require_active_user(request)

        if not can_manage_object(user, comentario.user_id):
            raise PermissionDenied('No puedes modificar este comentario.')

    def update(self, request, *args, **kwargs):
        comentario = self.get_object()
        self._check_owner_or_admin(request, comentario)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        comentario = self.get_object()
        self._check_owner_or_admin(request, comentario)
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        comentario = self.get_object()
        self._check_owner_or_admin(request, comentario)
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'], url_path='toggle-like')
    def toggle_like(self, request, pk=None):
        user = require_active_user(request)
        comentario = self.get_object()

        with transaction.atomic():
            like = LikeComentario.objects.filter(comentario=comentario, user=user).first()

            if like is None:
                LikeComentario.objects.create(comentario=comentario, user=user)
                liked = True
            else:
                like.delete()
                liked = False

            comentario.contadorLikes = LikeComentario.objects.filter(comentario=comentario).count()
            comentario.save(update_fields=['contadorLikes'])

        serializer = self.get_serializer(comentario)
        data = serializer.data
        data['likedByMe'] = liked
        data['totalLikes'] = comentario.contadorLikes
        return Response(data)

class ValoracionView(viewsets.ModelViewSet):
    queryset = Valoracion.objects.all()
    serializer_class = ValoracionSerializer

    def perform_create(self, serializer):
        user = require_active_user(self.request)
        serializer.save(user=user)

    def _check_owner_or_admin(self, request, valoracion):
        user = require_active_user(request)

        if not can_manage_object(user, valoracion.user_id):
            raise PermissionDenied('No puedes modificar esta valoración.')

    def update(self, request, *args, **kwargs):
        valoracion = self.get_object()
        self._check_owner_or_admin(request, valoracion)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        valoracion = self.get_object()
        self._check_owner_or_admin(request, valoracion)
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        valoracion = self.get_object()
        self._check_owner_or_admin(request, valoracion)
        return super().destroy(request, *args, **kwargs)

class ReporteComentarioViewSet(viewsets.ModelViewSet):
    queryset = ReporteComentario.objects.all().order_by('-fechaReporte')
    serializer_class = ReporteComentarioSerializer

    def list(self, request, *args, **kwargs):
        require_admin_user(request)
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        require_admin_user(request)
        return super().retrieve(request, *args, **kwargs)

    def perform_create(self, serializer):
        user = require_active_user(self.request)
        serializer.save(usuario=user)

    def update(self, request, *args, **kwargs):
        require_admin_user(request)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        require_admin_user(request)
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        require_admin_user(request)
        return super().destroy(request, *args, **kwargs)

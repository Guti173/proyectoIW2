from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Amistad
from .serializers import AmistadSerializer
from user.models import User
from user.permissions import require_active_user

class AmistadView(viewsets.ModelViewSet):
    queryset = Amistad.objects.select_related('user', 'user2').all()
    serializer_class = AmistadSerializer

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        self.current_user = require_active_user(request)
        request.isdb_user = self.current_user

    def get_serializer_context(self):
        context = super().get_serializer_context()
        self.request.isdb_user = getattr(self, 'current_user', None)
        return context

    def get_queryset(self):
        user = getattr(self, 'current_user', None) or require_active_user(self.request)
        return self.queryset.filter(Q(user=user) | Q(user2=user)).order_by(
            '-fechaSolicitud',
            '-id',
        )

    def create(self, request, *args, **kwargs):
        user = getattr(self, 'current_user', None) or require_active_user(request)
        target_user_id = request.data.get('user2')

        if not target_user_id:
            return Response(
                {'detail': 'Selecciona el usuario al que quieres enviar la solicitud.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        target_user = User.objects.filter(pk=target_user_id, estadoCuenta='Activa').first()

        if target_user is None:
            return Response(
                {'detail': 'El usuario indicado no existe o no esta activo.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if target_user.id == user.id:
            return Response(
                {'detail': 'No puedes enviarte una solicitud a ti mismo.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        relation_filter = Q(user=user, user2=target_user) | Q(user=target_user, user2=user)
        now = timezone.now()

        with transaction.atomic():
            existing = Amistad.objects.filter(relation_filter).first()

            if existing and existing.estado != Amistad.ESTADO_DENEGADA:
                return Response(
                    {'detail': 'Ya existe una solicitud o amistad con este usuario.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if existing:
                existing.user = user
                existing.user2 = target_user
                existing.estado = Amistad.ESTADO_PENDIENTE
                existing.fechaSolicitud = now
                existing.fechaRespuesta = None
                existing.fechaAmistad = None
                existing.save()
                serializer = self.get_serializer(existing)
                return Response(serializer.data, status=status.HTTP_200_OK)

            amistad = Amistad.objects.create(
                user=user,
                user2=target_user,
                estado=Amistad.ESTADO_PENDIENTE,
                fechaSolicitud=now,
            )

        serializer = self.get_serializer(amistad)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='accept')
    def accept(self, request, pk=None):
        user = getattr(self, 'current_user', None) or require_active_user(request)
        amistad = self.get_object()

        if amistad.user2_id != user.id:
            return Response(
                {'detail': 'Solo el receptor puede aceptar esta solicitud.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if amistad.estado != Amistad.ESTADO_PENDIENTE:
            return Response(
                {'detail': 'Esta solicitud ya no esta pendiente.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        now = timezone.now()
        amistad.estado = Amistad.ESTADO_ACEPTADA
        amistad.fechaRespuesta = now
        amistad.fechaAmistad = now
        amistad.save(update_fields=['estado', 'fechaRespuesta', 'fechaAmistad'])

        serializer = self.get_serializer(amistad)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='deny')
    def deny(self, request, pk=None):
        user = getattr(self, 'current_user', None) or require_active_user(request)
        amistad = self.get_object()

        if amistad.user2_id != user.id:
            return Response(
                {'detail': 'Solo el receptor puede denegar esta solicitud.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if amistad.estado != Amistad.ESTADO_PENDIENTE:
            return Response(
                {'detail': 'Esta solicitud ya no esta pendiente.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        amistad.estado = Amistad.ESTADO_DENEGADA
        amistad.fechaRespuesta = timezone.now()
        amistad.fechaAmistad = None
        amistad.save(update_fields=['estado', 'fechaRespuesta', 'fechaAmistad'])

        serializer = self.get_serializer(amistad)
        return Response(serializer.data)

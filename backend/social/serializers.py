from rest_framework import serializers
from user.models import User
from .models import Amistad

class AmistadUserSerializer(serializers.ModelSerializer):
    displayName = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'email',
            'nombre',
            'apellidos',
            'fotoPerfil',
            'displayName',
        )

    def get_displayName(self, obj):
        full_name = f'{obj.nombre or ""} {obj.apellidos or ""}'.strip()
        return full_name or obj.username or obj.email or f'Usuario {obj.pk}'

class AmistadSerializer(serializers.ModelSerializer):
    solicitante = AmistadUserSerializer(source='user', read_only=True)
    receptor = AmistadUserSerializer(source='user2', read_only=True)
    otroUsuario = serializers.SerializerMethodField(read_only=True)
    fechaSolicitudDiaHora = serializers.SerializerMethodField(read_only=True)
    fechaAmistadDiaHora = serializers.SerializerMethodField(read_only=True)
    tiempoComoAmigos = serializers.SerializerMethodField(read_only=True)
    rolActual = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Amistad
        fields = (
            'id',
            'estado',
            'fechaSolicitud',
            'fechaRespuesta',
            'fechaAmistad',
            'fechaSolicitudDiaHora',
            'fechaAmistadDiaHora',
            'tiempoComoAmigos',
            'rolActual',
            'user',
            'user2',
            'solicitante',
            'receptor',
            'otroUsuario',
        )
        read_only_fields = (
            'id',
            'estado',
            'fechaSolicitud',
            'fechaRespuesta',
            'fechaAmistad',
            'user',
            'solicitante',
            'receptor',
            'otroUsuario',
        )

    def get_otroUsuario(self, obj):
        request = self.context.get('request')
        current_user = getattr(request, 'isdb_user', None)

        if current_user is None:
            return None

        other_user = obj.user2 if obj.user_id == current_user.id else obj.user
        return AmistadUserSerializer(other_user).data

    def get_fechaSolicitudDiaHora(self, obj):
        return format_day_month_hour(obj.fechaSolicitud)

    def get_fechaAmistadDiaHora(self, obj):
        return format_day_month_hour(obj.fechaAmistad)

    def get_tiempoComoAmigos(self, obj):
        if obj.estado != Amistad.ESTADO_ACEPTADA or not obj.fechaAmistad:
            return ''

        return format_duration_since(obj.fechaAmistad)

    def get_rolActual(self, obj):
        request = self.context.get('request')
        current_user = getattr(request, 'isdb_user', None)

        if current_user is None:
            return ''

        if obj.user_id == current_user.id:
            return 'solicitante'

        if obj.user2_id == current_user.id:
            return 'receptor'

        return ''


def format_day_month_hour(value):
    if not value:
        return ''

    return value.strftime('%d-%m %H:%M')


def format_duration_since(value):
    from django.utils import timezone

    delta = timezone.now() - value
    total_days = max(delta.days, 0)

    if total_days >= 365:
        years = total_days // 365
        return f'{years} anio{"s" if years != 1 else ""}'

    if total_days >= 30:
        months = total_days // 30
        return f'{months} mes{"es" if months != 1 else ""}'

    if total_days >= 1:
        return f'{total_days} dia{"s" if total_days != 1 else ""}'

    hours = max(delta.seconds // 3600, 0)

    if hours >= 1:
        return f'{hours} hora{"s" if hours != 1 else ""}'

    return 'Desde hoy'

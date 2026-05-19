from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'id',
            'auth0Sub',
            'username',
            'email',
            'nombre',
            'apellidos',
            'fotoPerfil',
            'estadoCuenta',
            'role',
        )
        read_only_fields = ('id', 'auth0Sub')

    def validate_estadoCuenta(self, value):
        estados_validos = ('Activa', 'Suspendida')

        if value not in estados_validos:
            raise serializers.ValidationError('El estado debe ser Activa o Suspendida.')

        return value


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'email',
            'nombre',
            'apellidos',
            'fotoPerfil',
            'estadoCuenta',
            'role',
        )
        read_only_fields = ('id', 'role', 'estadoCuenta')


class UserPublicProfileSerializer(serializers.ModelSerializer):
    displayName = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'nombre',
            'apellidos',
            'fotoPerfil',
            'displayName',
        )
        read_only_fields = fields

    def get_displayName(self, obj):
        full_name = f'{obj.nombre or ""} {obj.apellidos or ""}'.strip()
        return full_name or obj.username or f'Usuario {obj.pk}'

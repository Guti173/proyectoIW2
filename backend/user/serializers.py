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
            'auth0Sub',
            'username',
            'password',
            'email',
            'nombre',
            'apellidos',
            'fotoPerfil',
            'estadoCuenta',
            'role',
        )
        read_only_fields = ('id', 'auth0Sub', 'role', 'estadoCuenta')

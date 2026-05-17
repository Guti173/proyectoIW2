from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'
        read_only_fields = ('auth0Sub',)


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

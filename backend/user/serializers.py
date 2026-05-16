from rest_framework import serializers
from .models import User, Group

class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    groupName = serializers.CharField(source='group.groupName', read_only=True)

    class Meta:
        model = User
        fields = '__all__'
        read_only_fields = ('auth0Sub',)


class UserProfileSerializer(serializers.ModelSerializer):
    groupName = serializers.CharField(source='group.groupName', read_only=True)

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
            'group',
            'groupName',
        )
        read_only_fields = ('id', 'auth0Sub', 'group', 'groupName', 'estadoCuenta')

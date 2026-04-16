from rest_framework import serializers
from .models import ListaUsuario, ProgresoSerie

class ListaUsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = ListaUsuario
        fields = '__all__'

class ProgresoSerieSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProgresoSerie
        fields = '__all__'
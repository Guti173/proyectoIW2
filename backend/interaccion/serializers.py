from rest_framework import serializers
from .models import Comentario, Valoracion

class ComentarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comentario
        fields = '__all__'

class ValoracionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Valoracion
        fields = '__all__'
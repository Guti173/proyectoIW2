from rest_framework import serializers
from .models import Comentario, Valoracion

class ComentarioSerializer(serializers.ModelSerializer):
    autor = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Comentario
        fields = '__all__'
        read_only_fields = ('user', 'fechaPublicacion', 'estado', 'contadorLikes')

    def get_autor(self, obj):
        if obj.user.nombre or obj.user.apellidos:
            return f'{obj.user.nombre} {obj.user.apellidos}'.strip()

        return obj.user.username or obj.user.email

class ValoracionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Valoracion
        fields = '__all__'

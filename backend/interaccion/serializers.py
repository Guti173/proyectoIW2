from rest_framework import serializers
from user.auth import get_current_user
from .models import Comentario, LikeComentario, Valoracion, ReporteComentario

class ComentarioSerializer(serializers.ModelSerializer):
    autor = serializers.SerializerMethodField(read_only=True)
    totalLikes = serializers.SerializerMethodField(read_only=True)
    likedByMe = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Comentario
        fields = '__all__'
        read_only_fields = ('user', 'fechaPublicacion', 'estado', 'contadorLikes')

    def get_autor(self, obj):
        if obj.user.nombre or obj.user.apellidos:
            return f'{obj.user.nombre} {obj.user.apellidos}'.strip()

        return obj.user.username or obj.user.email

    def get_totalLikes(self, obj):
        return obj.likes.count()

    def get_likedByMe(self, obj):
        request = self.context.get('request')

        if request is None:
            return False

        user = get_current_user(request, ensure_exists=False)

        if user is None:
            return False

        return LikeComentario.objects.filter(comentario=obj, user=user).exists()

class ValoracionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Valoracion
        fields = '__all__'

class ReporteComentarioSerializer(serializers.ModelSerializer):
    comentarioDetalle = ComentarioSerializer(source='comentario', read_only=True)
    comentarioId = serializers.IntegerField(source='comentario_id', read_only=True)

    class Meta:
        model = ReporteComentario
        fields = '__all__'
        read_only_fields = ('usuario', 'fechaReporte')

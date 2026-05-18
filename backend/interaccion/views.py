from datetime import date

from rest_framework import viewsets
from rest_framework.response import Response
from .models import Comentario, Valoracion, ReporteComentario
from .serializers import ComentarioSerializer, ValoracionSerializer, ReporteComentarioSerializer
from user.auth import get_current_user

class ComentarioView(viewsets.ModelViewSet):
    queryset = Comentario.objects.all()
    serializer_class = ComentarioSerializer

    def list(self, request):
        serie_id = request.GET.get("serie")

        if serie_id:
            result = Comentario.objects.filter(serie=serie_id)
        else:
            result = Comentario.objects.all()

        return Response(self.serializer_class(result, many=True).data)

    def perform_create(self, serializer):
        user = get_current_user(self.request)
        serializer.save(
            user=user,
            fechaPublicacion=date.today(),
            estado='Publicado',
        )

class ValoracionView(viewsets.ModelViewSet):
    queryset = Valoracion.objects.all()
    serializer_class = ValoracionSerializer

class ReporteComentarioViewSet(viewsets.ModelViewSet):
    queryset = ReporteComentario.objects.all().order_by('-fechaReporte')
    serializer_class = ReporteComentarioSerializer

    def perform_create(self, serializer):
        user = get_current_user(self.request)
        serializer.save(usuario=user)
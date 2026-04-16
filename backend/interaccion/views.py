from rest_framework import viewsets
from rest_framework.response import Response
from .models import Comentario, Valoracion
from .serializers import ComentarioSerializer, ValoracionSerializer

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

class ValoracionView(viewsets.ModelViewSet):
    queryset = Valoracion.objects.all()
    serializer_class = ValoracionSerializer
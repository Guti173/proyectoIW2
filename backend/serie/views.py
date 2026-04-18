from rest_framework import viewsets
from rest_framework.response import Response
from .models import Serie, Genero
from .serializers import SerieSerializer, GeneroSerializer

class SerieView(viewsets.ModelViewSet):
    queryset = Serie.objects.all()
    serializer_class = SerieSerializer

    def list(self, request):
        genero_id = request.GET.get("genero")

        if genero_id:
            result = Serie.objects.filter(generos=genero_id)
        else:
            result = Serie.objects.all()

        return Response(self.serializer_class(result, many=True).data)

class GeneroView(viewsets.ModelViewSet):
    queryset = Genero.objects.all()
    serializer_class = GeneroSerializer
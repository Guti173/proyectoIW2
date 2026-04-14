from rest_framework import viewsets

from .models import Serie
from .serializers import SerieSerializer


class SerieView(viewsets.ModelViewSet):
    queryset = Serie.objects.all()
    serializer_class = SerieSerializer

    def get_queryset(self):
        queryset = Serie.objects.all()
        titulo = self.request.query_params.get("titulo")

        if titulo is not None:
            queryset = queryset.filter(titulo__icontains=titulo)

        return queryset

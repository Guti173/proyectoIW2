from rest_framework import viewsets
from .models import Amistad
from .serializers import AmistadSerializer

class AmistadView(viewsets.ModelViewSet):
    queryset = Amistad.objects.all()
    serializer_class = AmistadSerializer
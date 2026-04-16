from rest_framework import viewsets
from rest_framework.response import Response
from .models import Module
from .serializers import ModuleSerializer

class ModuleView(viewsets.ModelViewSet):

    queryset = Module.objects.all()
    serializer_class = ModuleSerializer

    def list(self, request):
        result = Module.objects.all()
        return Response(self.serializer_class(result, many=True).data)
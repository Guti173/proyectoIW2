from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework import status
from rest_framework import viewsets, mixins

from .models import User
from .serializers import *

class UserView(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    #mixins.DestroyModelMixin,
    #mixins.UpdateModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_queryset(self):
        # Empezamos con todos los usuarios
        queryset = User.objects.all()
        
        # Obtenemos el parámetro 'nombre' de la URL (?nombre=...)
        nombre = self.request.query_params.get('nombre')
        
        if nombre is not None:
            # Filtramos (puedes usar 'nombre__icontains' para búsquedas parciales)
            queryset = queryset.filter(name__icontains=nombre)
            
        return queryset
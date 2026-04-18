from rest_framework import viewsets
from rest_framework.response import Response
from .models import User, Group
from .serializers import UserSerializer, GroupSerializer

class UserView(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def list(self, request):
        result = User.objects.all()
        return Response(self.serializer_class(result, many=True).data)

class GroupView(viewsets.ModelViewSet):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
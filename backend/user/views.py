from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import User, Group
from .auth import get_current_user
from .serializers import UserSerializer, GroupSerializer, UserProfileSerializer

class UserView(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def list(self, request):
        result = User.objects.all()
        return Response(self.serializer_class(result, many=True).data)

    @action(detail=False, methods=['get', 'patch'], url_path='me')
    def me(self, request):
        user = get_current_user(request)

        if request.method.lower() == 'patch':
            serializer = UserProfileSerializer(user, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)

        serializer = UserProfileSerializer(user)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='sync')
    def sync(self, request):
        user = get_current_user(request)
        serializer = UserProfileSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)

class GroupView(viewsets.ModelViewSet):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer

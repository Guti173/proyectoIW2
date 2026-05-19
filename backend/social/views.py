from rest_framework import viewsets
from django.db.models import Q

from .models import Amistad
from .serializers import AmistadSerializer
from user.permissions import require_active_user

class AmistadView(viewsets.ModelViewSet):
    queryset = Amistad.objects.all()
    serializer_class = AmistadSerializer

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        require_active_user(request)

    def get_queryset(self):
        user = require_active_user(self.request)
        return Amistad.objects.filter(Q(user=user) | Q(user2=user))

    def perform_create(self, serializer):
        user = require_active_user(self.request)
        serializer.save(user=user)

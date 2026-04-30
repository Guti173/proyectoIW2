from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from .models import User
from .serializers import UserSerializer


def _profile_value(profile, *keys):
    for key in keys:
        value = profile.get(key)
        if value:
            return value
    return ""


def _serialize_auth_user(user, created=False):
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "nombre": user.nombre,
        "apellidos": user.apellidos,
        "fotoPerfil": user.fotoPerfil,
        "estadoCuenta": user.estadoCuenta,
        "role": user.role,
        "created": created,
    }


@api_view(["POST"])
@permission_classes([AllowAny])
def auth_me(request):
    profile = request.data.get("profile") or request.data

    if not hasattr(profile, "get"):
        return Response(
            {"detail": "El perfil autenticado no tiene un formato valido."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    email = _profile_value(profile, "email")

    if not email:
        return Response(
            {"detail": "No se recibio email del perfil autenticado."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = User.objects.filter(email__iexact=email).first()
    created = False

    if user is None:
        username = _profile_value(profile, "nickname", "name") or email.split("@")[0]
        user = User.objects.create(
            username=username,
            password="",
            email=email,
            nombre=_profile_value(profile, "given_name", "name") or username,
            apellidos=_profile_value(profile, "family_name"),
            fotoPerfil=_profile_value(profile, "picture"),
            estadoCuenta="activo",
            role=User.ROLE_USER,
        )
        created = True

    return Response(_serialize_auth_user(user, created=created))


class UserView(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def list(self, request):
        result = User.objects.all()
        return Response(self.serializer_class(result, many=True).data)


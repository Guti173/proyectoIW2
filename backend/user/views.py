from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import User
from .auth import get_current_user
from .permissions import require_active_user, require_admin_user
from .serializers import UserProfileSerializer, UserSerializer


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
            {"detail": "El perfil autenticado no tiene un formato válido."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    email = _profile_value(profile, "email")

    if not email:
        return Response(
            {"detail": "No se recibió email del perfil autenticado."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = User.objects.filter(email__iexact=email).first()
    created = False

    if user is None:
        username = _profile_value(profile, "nickname", "name") or email.split("@")[0]
        user = User.objects.create(
            auth0Sub=_profile_value(profile, "sub") or None,
            username=username,
            password="",
            email=email,
            nombre=_profile_value(profile, "given_name", "name") or username,
            apellidos=_profile_value(profile, "family_name"),
            fotoPerfil=_profile_value(profile, "picture"),
            estadoCuenta="Activa",
            role=User.ROLE_USER,
        )
        created = True

    return Response(_serialize_auth_user(user, created=created))


class UserView(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def list(self, request):
        require_admin_user(request)
        result = User.objects.all().order_by('id')
        return Response(self.serializer_class(result, many=True).data)

    def create(self, request, *args, **kwargs):
        require_admin_user(request)
        return super().create(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        require_admin_user(request)
        return super().retrieve(request, *args, **kwargs)

    def _is_sensitive_self_update(self, request, instance):
        try:
            current_user = get_current_user(request, ensure_exists=False)
        except Exception:
            current_user = None

        if current_user is None or current_user.id != instance.id:
            return False

        sensitive_fields = ('role', 'estadoCuenta')

        return any(
            field in request.data and request.data.get(field) != getattr(instance, field)
            for field in sensitive_fields
        )

    def update(self, request, *args, **kwargs):
        require_admin_user(request)
        instance = self.get_object()

        if self._is_sensitive_self_update(request, instance):
            return Response(
                {'detail': 'No puedes cambiar tu propio rol o estado de cuenta desde aquí.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        require_admin_user(request)
        instance = self.get_object()

        if self._is_sensitive_self_update(request, instance):
            return Response(
                {'detail': 'No puedes cambiar tu propio rol o estado de cuenta desde aquí.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        require_admin_user(request)
        instance = self.get_object()
        current_user = get_current_user(request, ensure_exists=False)

        if current_user is not None and current_user.id == instance.id:
            return Response(
                {'detail': 'No puedes eliminar tu propia cuenta desde aquí.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=['get', 'patch'], url_path='me')
    def me(self, request):
        user = get_current_user(request)

        if request.method.lower() == 'patch':
            require_active_user(request)
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

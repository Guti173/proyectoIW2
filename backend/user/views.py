from django.contrib.auth.hashers import check_password, identify_hasher, make_password
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db.models import F, Q
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import User
from .auth import get_current_user, split_name
from .permissions import require_active_user, require_admin_user
from .serializers import UserProfileSerializer, UserPublicProfileSerializer, UserSerializer


def _profile_value(profile, *keys):
    for key in keys:
        value = profile.get(key)
        if value:
            return value
    return ""


def _profile_metadata_value(profile, *keys):
    metadata = profile.get('user_metadata') or profile.get('userMetadata') or {}

    if not hasattr(metadata, 'get'):
        return ''

    return _profile_value(metadata, *keys)


def _clean_registration_name(value):
    return ' '.join(f'{value or ""}'.strip().split())


def _validate_registration_name(value, email=''):
    clean_name = _clean_registration_name(value)

    if not clean_name:
        return '', 'Introduce tu nombre para completar el registro.'

    if len(clean_name) < 2:
        return '', 'El nombre debe tener al menos 2 caracteres.'

    if len(clean_name) > 80:
        return '', 'El nombre no puede superar los 80 caracteres.'

    if email and clean_name.lower() == email.lower():
        return '', 'El nombre no puede ser el correo electrónico.'

    return clean_name, ''


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


def _password_matches(stored_password, raw_password):
    if not stored_password:
        return raw_password == ''

    try:
        identify_hasher(stored_password)
    except ValueError:
        return stored_password == raw_password

    return check_password(raw_password, stored_password)


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
    raw_name = (
        _profile_metadata_value(profile, "fullName", "full_name", "name", "nombre")
        or _profile_value(profile, "given_name", "name")
    )
    clean_name, name_error = _validate_registration_name(raw_name, email=email)

    if user is None:
        if name_error:
            return Response({'detail': name_error}, status=status.HTTP_400_BAD_REQUEST)

        username = (
            _profile_metadata_value(profile, "username", "usuario")
            or _profile_value(profile, "username", "nickname")
            or email.split("@")[0]
        )
        nombre, apellidos = split_name(clean_name)
        user = User.objects.create(
            auth0Sub=_profile_value(profile, "sub") or None,
            username=username,
            password="",
            email=email,
            nombre=nombre,
            apellidos=_profile_value(profile, "family_name") or apellidos,
            fotoPerfil=_profile_value(profile, "picture"),
            estadoCuenta="Activa",
            role=User.ROLE_USER,
        )
        created = True
    elif clean_name and not user.nombre:
        nombre, apellidos = split_name(clean_name)
        user.nombre = nombre

        if apellidos and not user.apellidos:
            user.apellidos = apellidos

        user.save(update_fields=['nombre', 'apellidos'])

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

    @action(detail=False, methods=['post'], url_path='change-password')
    def change_password(self, request):
        user = require_active_user(request)
        current_password = request.data.get('currentPassword', '')
        new_password = request.data.get('newPassword', '')
        repeat_password = request.data.get('repeatPassword', '')

        if not current_password or not new_password or not repeat_password:
            return Response(
                {'detail': 'Completa todos los campos de contraseña.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not _password_matches(user.password, current_password):
            return Response(
                {'detail': 'La contraseña actual no es correcta.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if new_password != repeat_password:
            return Response(
                {'detail': 'La nueva contraseña y la repetición deben coincidir.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            validate_password(new_password, user=user)
        except ValidationError as error:
            return Response(
                {'detail': ' '.join(error.messages)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.password = make_password(new_password)
        user.save(update_fields=['password'])

        return Response({'detail': 'Contraseña actualizada correctamente.'})

    @action(detail=True, methods=['get'], url_path='public-profile')
    def public_profile(self, request, pk=None):
        current_user = require_active_user(request)
        target_user = User.objects.filter(pk=pk, estadoCuenta='Activa').first()

        if target_user is None:
            return Response(
                {'detail': 'El usuario indicado no existe o no está activo.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if target_user.id != current_user.id:
            from social.models import Amistad

            are_friends = Amistad.objects.filter(
                (
                    Q(user=current_user, user2=target_user)
                    | Q(user=target_user, user2=current_user)
                ),
                estado=Amistad.ESTADO_ACEPTADA,
            ).exists()

            if not are_friends:
                return Response(
                    {'detail': 'Solo los amigos pueden ver este perfil.'},
                    status=status.HTTP_403_FORBIDDEN,
                )

        from listas.models import ListaUsuario, ProgresoSerie
        from listas.serializers import ListaUsuarioSerializer

        progress_base = ProgresoSerie.objects.filter(user=target_user)
        continue_count = (
            progress_base
            .filter(serie__numeroEpisodios__gt=0)
            .exclude(estado__iexact='Completada')
            .filter(episodiosVistos__lt=F('serie__numeroEpisodios'))
            .count()
        )
        completed_count = (
            progress_base
            .filter(
                Q(estado__iexact='Completada')
                | (
                    Q(serie__numeroEpisodios__gt=0)
                    & Q(episodiosVistos__gte=F('serie__numeroEpisodios'))
                )
            )
            .count()
        )
        list_count = ListaUsuario.objects.filter(user=target_user).count()
        saved_series_count = (
            ListaUsuario.series.through.objects
            .filter(listausuario__user=target_user)
            .values('serie_id')
            .distinct()
            .count()
        )

        lists = (
            ListaUsuario.objects
            .filter(user=target_user)
            .prefetch_related('series')
            .order_by('-fechaAgregado', '-id')
        )

        return Response({
            'profile': UserPublicProfileSerializer(target_user).data,
            'viewerRole': 'owner' if target_user.id == current_user.id else 'friend',
            'stats': {
                'continueWatching': continue_count,
                'lists': list_count,
                'savedSeries': saved_series_count,
                'completedSeries': completed_count,
            },
            'lists': ListaUsuarioSerializer(lists, many=True).data,
        })

    @action(detail=False, methods=['get'], url_path='discover')
    def discover(self, request):
        current_user = require_active_user(request)
        search = request.GET.get('q', '').strip()

        if not search:
            return Response([])

        try:
            limit = int(request.GET.get('limit', 10))
        except (TypeError, ValueError):
            limit = 10

        limit = max(1, min(limit, 10))

        from social.models import Amistad

        relations = Amistad.objects.filter(Q(user=current_user) | Q(user2=current_user))
        relation_by_user_id = {}
        blocked_user_ids = set()

        for relation in relations:
            other_user_id = relation.user2_id if relation.user_id == current_user.id else relation.user_id
            relation_by_user_id[other_user_id] = relation

            if relation.estado in (Amistad.ESTADO_PENDIENTE, Amistad.ESTADO_ACEPTADA):
                blocked_user_ids.add(other_user_id)

        users = (
            User.objects.filter(estadoCuenta='Activa')
            .exclude(id=current_user.id)
            .exclude(id__in=blocked_user_ids)
            .filter(
                Q(username__icontains=search)
                | Q(email__icontains=search)
                | Q(nombre__icontains=search)
                | Q(apellidos__icontains=search)
            )
            .order_by('username', 'email', 'id')[:limit]
        )
        result = []

        for user in users:
            relation = relation_by_user_id.get(user.id)
            full_name = f'{user.nombre or ""} {user.apellidos or ""}'.strip()

            result.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'nombre': user.nombre,
                'apellidos': user.apellidos,
                'fotoPerfil': user.fotoPerfil,
                'displayName': full_name or user.username or user.email or f'Usuario {user.id}',
                'amistadEstado': relation.estado if relation else '',
                'puedeEnviarSolicitud': relation is None or relation.estado == Amistad.ESTADO_DENEGADA,
            })

        return Response(result)

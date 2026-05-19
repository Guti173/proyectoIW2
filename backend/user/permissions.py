from rest_framework.exceptions import PermissionDenied

from .auth import get_current_user
from .models import User


def require_active_user(request):
    user = get_current_user(request)

    if user.estadoCuenta == 'Suspendida':
        raise PermissionDenied('Tu cuenta está suspendida.')

    return user


def require_admin_user(request):
    user = require_active_user(request)

    if user.role != User.ROLE_ADMIN:
        raise PermissionDenied('Solo un administrador puede realizar esta acción.')

    return user


def can_manage_object(user, owner_id):
    return bool(user and (user.role == User.ROLE_ADMIN or user.id == owner_id))

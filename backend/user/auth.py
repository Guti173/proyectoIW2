from rest_framework.exceptions import NotAuthenticated

from .models import User


def get_current_user(request, ensure_exists=True):
    auth0_sub = request.headers.get('X-Auth0-Sub', '').strip()
    email = request.headers.get('X-Auth0-Email', '').strip()
    name = request.headers.get('X-Auth0-Name', '').strip()
    nickname = request.headers.get('X-Auth0-Nickname', '').strip()
    picture = request.headers.get('X-Auth0-Picture', '').strip()

    if not auth0_sub and not email:
        if ensure_exists:
            raise NotAuthenticated(
                'No se recibieron cabeceras del usuario autenticado de Auth0.',
            )
        return None

    user = None

    if auth0_sub:
        user = User.objects.filter(auth0Sub=auth0_sub).first()

    if user is None and email:
        user = User.objects.filter(email=email).first()

    is_new_user = user is None

    if user is None:
        user = User(auth0Sub=auth0_sub or None)

    nombre, apellidos = split_name(name)

    user.auth0Sub = auth0_sub or user.auth0Sub
    if email and (is_new_user or not user.email):
        user.email = email

    if nickname and (is_new_user or not user.username):
        user.username = nickname
    elif not user.username:
        user.username = infer_username(email, name)

    if nombre and (is_new_user or not user.nombre):
        user.nombre = nombre

    if apellidos and (is_new_user or not user.apellidos):
        user.apellidos = apellidos

    if picture and (is_new_user or not user.fotoPerfil):
        user.fotoPerfil = picture

    user.estadoCuenta = user.estadoCuenta or 'Activa'
    user.password = user.password or ''

    user.save()
    return user


def split_name(full_name):
    parts = [part for part in f'{full_name}'.split(' ') if part]

    if not parts:
        return '', ''

    if len(parts) == 1:
        return parts[0], ''

    return parts[0], ' '.join(parts[1:])


def infer_username(email, full_name):
    if email and '@' in email:
        return email.split('@', 1)[0]

    if full_name:
        return ''.join(part.lower() for part in full_name.split())

    return ''

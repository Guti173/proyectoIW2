# proyectoIW2

Proyecto de Ingeniería Web 2 para ISDB, una aplicación para buscar series, guardarlas en listas y llevar el progreso de lo que estás viendo.

El proyecto está dividido en:

- `backend/`: API REST con Django y Django REST Framework.
- `frontend/`: interfaz en React + Vite.

## Estado actual

- Catálogo de series conectado al backend.
- Detalle de serie con sinopsis, géneros, comentarios, reportes y progreso.
- Login y registro con Auth0.
- Perfil de usuario.
- Mis listas, incluyendo listas automáticas como `Viendo` y `Completadas`.
- Progreso de series por episodios vistos.
- Panel de administrador para gestionar series y géneros.
- Panel de administrador para revisar reportes de comentarios.
- Panel de administrador para gestionar usuarios, cambiar roles y suspender cuentas.
- Permisos básicos en backend:
  - Los usuarios no autenticados pueden consultar series y géneros.
  - Las listas, el progreso, amistades y creación de comentarios requieren usuario activo.
  - La gestión de series, géneros, usuarios y reportes queda limitada a administradores.

## Arranque en local

Backend:

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Si hace falta configurar Auth0, el frontend espera estas variables en `frontend/.env`:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_AUTH0_DOMAIN=...
VITE_AUTH0_CLIENT_ID=...
VITE_AUTH0_DB_CONNECTION=Username-Password-Authentication
```

## Endpoints principales

La API principal está bajo `/api/`.

- `GET /api/serie/`
- `GET /api/serie/{id}/`
- `POST /api/serie/` solo admin
- `GET /api/genero/`
- `POST /api/genero/` solo admin
- `GET /api/user/me/`
- `PATCH /api/user/me/`
- `POST /api/user/sync/`
- `GET /api/user/` solo admin
- `PATCH /api/user/{id}/` solo admin
- `GET /api/listausuario/`
- `GET /api/listausuario/mine/`
- `POST /api/listausuario/`
- `POST /api/listausuario/{id}/add-serie/`
- `POST /api/listausuario/{id}/remove-serie/`
- `GET /api/progresoserie/`
- `GET /api/progresoserie/by-serie/?serieId={id}`
- `POST /api/progresoserie/start/`
- `POST /api/progresoserie/set-progress/`
- `GET /api/comentario/?serie={id}`
- `POST /api/comentario/`
- `POST /api/reportecomentario/`
- `GET /api/reportecomentario/` solo admin
- `PATCH /api/reportecomentario/{id}/` solo admin
- `GET /api/amistad/`

## Páginas del frontend

- `/`: página inicial.
- `/catalogo`: catálogo de series.
- `/series/:id`: detalle de una serie.
- `/perfil`: perfil del usuario.
- `/listas`: listas personales del usuario.
- `/panel-admin`: administración de series y géneros.
- `/admin-comentarios`: administración de reportes.
- `/admin-usuarios`: administración de usuarios.
- `/cuenta-suspendida`: aviso para cuentas suspendidas.
- `/login`: inicio de sesión.
- `/registro`: registro.

## Usuarios y administradores

El modelo `User` usa estos campos importantes:

- `role = user`: usuario normal.
- `role = admin`: administrador.
- `estadoCuenta = Activa`: cuenta normal.
- `estadoCuenta = Suspendida`: cuenta bloqueada para funciones privadas.

Un administrador puede cambiar el rol y el estado de otros usuarios desde `/admin-usuarios`.

## Comprobaciones útiles

Backend:

```bash
cd backend
python manage.py check
python manage.py test
```

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

## Cosas pendientes

- Terminar y probar bien amistades y likes de comentarios.
- Revisar formularios de administración para que todos los campos de serie se puedan editar cómodamente.
- Añadir más validaciones en backend para evitar datos incompletos.
- Mejorar tests automáticos de permisos, progreso, listas y reportes.
- Pulir responsive y pequeños detalles visuales antes de entregar.

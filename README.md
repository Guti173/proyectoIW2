# proyectoIW2

Proyecto de Ingenieria Web 2 para ISDB, una aplicacion de gestion y seguimiento de series.

Ahora mismo el proyecto esta dividido en:

- `backend/`: API REST con Django y Django REST Framework.
- `frontend/`: interfaz en React + Vite.

## Estado actual

Despues de integrar el trabajo de Mario, el proyecto ya tiene una base mas completa:

- Catalogo de series conectado al backend.
- Detalle de serie con comentarios y opcion de guardar series en listas.
- Perfil de usuario.
- Pagina de mis listas.
- Panel de administrador para gestionar series y generos.
- Login/registro con Auth0.
- Sincronizacion del usuario con el backend usando Auth0.
- Usuarios con campo `role`, que puede ser `user` o `admin`.

La API principal esta bajo `/api/`.

## Arranque en local

Backend:

```bash
pip install -r backend/requirements.txt
python backend/manage.py migrate
python backend/manage.py runserver
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Endpoints principales

- `http://127.0.0.1:8000/api/serie/`
- `http://127.0.0.1:8000/api/genero/`
- `http://127.0.0.1:8000/api/user/`
- `http://127.0.0.1:8000/api/user/sync/`
- `http://127.0.0.1:8000/api/user/me/`
- `http://127.0.0.1:8000/api/listausuario/`
- `http://127.0.0.1:8000/api/listausuario/mine/`
- `http://127.0.0.1:8000/api/comentario/`
- `http://127.0.0.1:8000/api/progresoserie/`

## Paginas del frontend

- `/`: pagina inicial.
- `/catalogo`: catalogo de series.
- `/series/:id`: detalle de una serie.
- `/perfil`: perfil del usuario.
- `/listas`: listas personales del usuario.
- `/panel-admin`: panel de administracion de series y generos.
- `/login`: inicio de sesion.
- `/registro`: registro.

## Usuarios y administradores

El modelo actual usa `role` directamente en `user_user`.

- `role = user`: usuario normal.
- `role = admin`: administrador.

Los administradores se marcan manualmente en la base de datos cambiando el campo `role` a `admin`.

## Cosas pendientes

Todavia quedan cosas por terminar o revisar:

- Proteger de verdad las rutas de admin para que solo entren usuarios admin.
- Terminar funcionalidades sociales como amistades, solicitudes, likes y reportes.
- Mejorar la gestion del progreso de series.
- Revisar permisos del backend, porque ahora muchos endpoints son bastante abiertos.
- Anadir tests.
- Revisar textos y estilos finales antes de entregar.

## Comprobaciones utiles

Backend:

```bash
python backend/manage.py check
python backend/manage.py test
```

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

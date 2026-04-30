# proyectoIW2

Proyecto organizado en dos partes:

- `backend/`: API REST en Django + DRF
- `frontend/`: interfaz base en React + Vite

## Arranque en local

Backend:

```bash
pip install -r backend/requirements.txt
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
- `http://127.0.0.1:8000/api/user/`
- `http://127.0.0.1:8000/api/listausuario/`
- `http://127.0.0.1:8000/auth/me/`
- `http://127.0.0.1:8000/api/docs/`

## Usuarios y administradores

Cada usuario tiene un campo `role`: `user` o `admin`.

Tras login o registro con Auth0, el frontend envia el perfil a `auth/me/`.
El backend busca el email en la base de datos. Si no existe, crea un usuario normal con `role = user`.
Si existe, devuelve su `role`.

Luego el frontend redirige asi:

- `role = user` -> `/usuario`
- `role = admin` -> `/panel-admin`

Los administradores se marcan manualmente en la base de datos poniendo `role = admin`.

El modelo actual usa `role` directamente en `user_user`; ya no se usan grupos ni modulos propios para distinguir usuarios y administradores.

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
- `http://127.0.0.1:8000/api/docs/`

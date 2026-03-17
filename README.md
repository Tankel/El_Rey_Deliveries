# El Rey Deliveries

Estado actualizado: 2026-03-17.

## Estado actual del proyecto

- Frontend: Expo Router con flujos por rol (`CLIENT`, `ADMIN`, `DRIVER`).
- Backend: FastAPI con endpoints de auth, usuarios, productos, perfiles, pedidos y notificaciones.
- Integracion: el frontend ya consume backend via `EXPO_PUBLIC_API_URL`.
- Persistencia:
  - Sin `EL_REY_MONGODB_URI`: estado en memoria del backend (se pierde al reiniciar).
  - Con `EL_REY_MONGODB_URI`: estado persistido en MongoDB (modo recomendado).

## Backend con MongoDB real

1. Configura variables en `backend/.env` (puedes copiar `backend/.env.example`):
   - Nota: `backend/main.py` carga este archivo automaticamente.

```env
EL_REY_SECRET_KEY=change-this-secret
EL_REY_TOKEN_EXPIRE_HOURS=24
EL_REY_MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<db>?retryWrites=true&w=majority
EL_REY_MONGODB_DB=el_rey_deliveries
EL_REY_MONGODB_COLLECTION=app_state
EL_REY_MONGODB_STATE_ID=default
```

2. Instala dependencias backend:

```bash
cd backend
python -m pip install -r BackendRequirements.txt
```

3. Levanta API:

```bash
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

4. Verifica:

```bash
curl http://127.0.0.1:8000/health
```

## Frontend conectado al backend

1. Configura `.env` en la raiz (ver `.env.example`):

```env
EXPO_PUBLIC_API_URL=http://127.0.0.1:8000
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=
```

Para iPhone/Expo Go usa IP local, por ejemplo:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.70:8000
```

2. Inicia frontend:

```bash
npm install
npm run start -- --clear --host lan
```

## Usuarios demo

- `admin-demo / admin123`
- `cliente-demo / cliente123`
- `driver-juan / driver123`

## Calidad

```bash
npm run check
```

## Backlog de bugs y pendientes

- Ver [docs/BUGS_BACKLOG.md](docs/BUGS_BACKLOG.md).
- Incluye los bugs reportados: doble guardado de direccion, evidencia de entrega no visible al cliente, overflow visual en alertas de stock, lazy load y migracion de mapas a alternativa gratuita.

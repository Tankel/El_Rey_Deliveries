# Como ejecutar el proyecto (frontend + backend)

Fecha: 2026-03-17.

## 1) De donde sacar el URI de MongoDB

Opcion recomendada: MongoDB Atlas (free tier).

1. Crea cuenta en Atlas y crea un cluster (M0 gratis).
2. En `Database Access`, crea un usuario de BD (username + password).
3. En `Network Access`, agrega tu IP actual (o `0.0.0.0/0` solo para desarrollo temporal).
4. En tu cluster, click en `Connect` -> `Drivers`.
5. Selecciona `Python` y copia la cadena de conexion.
6. Debe verse parecido a esto:

```txt
mongodb+srv://<user>:<password>@<cluster>/<db>?retryWrites=true&w=majority
```

7. Reemplaza `<user>`, `<password>`, `<cluster>` y `<db>` con tus datos.

## 2) Configurar backend

Desde la carpeta `backend/` crea `backend/.env` con base en `backend/.env.example`:

```env
EL_REY_SECRET_KEY=change-this-secret
EL_REY_TOKEN_EXPIRE_HOURS=24
EL_REY_MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<db>?retryWrites=true&w=majority
EL_REY_MONGODB_DB=el_rey_deliveries
EL_REY_MONGODB_PREFIX=
EL_REY_MONGODB_LEGACY_COLLECTION=app_state
EL_REY_MONGODB_STATE_ID=default
```

Si aun no tienes Atlas, deja `EL_REY_MONGODB_URI=` vacio y correra en memoria.

Con Mongo activo, el backend guarda por entidad en colecciones separadas:

- `users`
- `products`
- `orders`
- `profiles`
- `notifications`
- `auth_audit`

Instalar dependencias backend:

```bash
cd backend
python -m pip install -r BackendRequirements.txt
```

En Git Bash (Windows Store Python), si `python` no aparece:

```bash
PY="/c/Users/Luis Reyes/AppData/Local/Microsoft/WindowsApps/PythonSoftwareFoundation.Python.3.9_qbz5n2kfra8p0/python.exe"
"$PY" -m pip install -r BackendRequirements.txt
```

Levantar backend:

- Misma PC (web local):

```bash
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

- Celular fisico (iPhone/Android en misma red):

```bash
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Health check:

```bash
curl http://127.0.0.1:8000/health
```

Para recargar los datos demo actualizados (incluye 25 productos de mayoreo):

```bash
curl -X POST http://127.0.0.1:8000/auth/reset-demo
```

## 3) Configurar frontend (`.env` en raiz)

Usa `EXPO_PUBLIC_API_URL` segun donde corras la app:

- Web en la misma PC:

```env
EXPO_PUBLIC_API_URL=http://127.0.0.1:8000
```

- iPhone / Android fisico (Expo Go):

```env
EXPO_PUBLIC_API_URL=http://TU_IP_LOCAL:8000
```

Ejemplo real:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.70:8000
```

- Android Emulator (AVD):

```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:8000
```

- iOS Simulator en Mac:

```env
EXPO_PUBLIC_API_URL=http://127.0.0.1:8000
```

Variable opcional de mapas:

```env
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=
```

## 4) Comandos para correr frontend

Instalar dependencias (una vez):

```bash
npm install
```

Iniciar Expo para dispositivo en LAN (recomendado para iPhone/Android fisico):

```bash
npm run start -- --clear --host lan
```

Abrir web:

```bash
npm run web
```

Abrir Android (si emulador/dispositivo listo):

```bash
npm run android
```

Abrir iOS (solo macOS con Xcode):

```bash
npm run ios
```

## 5) Credenciales demo

- `admin-demo / admin123`
- `cliente-demo / cliente123`
- `driver-juan / driver123`

## 6) Si aparece "Network request failed"

Checklist rapido:

1. Verifica que backend este arriba y responda `/health`.
2. Revisa que `EXPO_PUBLIC_API_URL` coincida con tu entorno (localhost vs IP LAN vs 10.0.2.2).
3. Reinicia Expo con cache limpia: `npm run start -- --clear --host lan`.
4. Cierra y abre Expo Go.
5. En iPhone, valida permiso de red local para Expo Go.
6. Si usas celular fisico, confirma que backend usa `--host 0.0.0.0`.
7. Si bloquea firewall, abre el puerto 8000 en Windows.

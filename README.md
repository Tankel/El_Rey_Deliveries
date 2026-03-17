# El Rey Deliveries

Estado real del proyecto (corte: 2026-03-17).

## Resumen ejecutivo

Este repositorio ya no es un scaffold basico. Hoy contiene:

- App movil completa en Expo Router con 3 roles: `CLIENT`, `ADMIN`, `DRIVER`.
- Logica de negocio local-first con `AsyncStorage` (sin backend productivo conectado).
- Flujo completo de compra, gestion operativa de pedidos, control de stock, y prueba de entrega.
- Exportacion admin a PDF/XLSX y analitica de stock/tracking.
- Suite de pruebas en Vitest para reglas de dominio y servicios clave.

Tambien contiene un backend en `backend/`, pero actualmente esta incompleto y no esta integrado a la app movil.

## Estado actual por modulo

### Frontend (Expo + React Native)

Estado: **funcional localmente**

Incluye:

- Autenticacion local por `username/password` con hash y bitacora de auditoria.
- Enrutamiento por rol con `RoleGate` y layouts separados.
- Persistencia local con `AsyncStorage` para:
  - sesion,
  - usuarios,
  - productos,
  - pedidos,
  - carrito,
  - perfil/direcciones,
  - notificaciones.
- Flujo cliente:
  - catalogo y detalle de producto,
  - carrito,
  - validacion de domicilio,
  - pago simulado,
  - creacion de pedido,
  - detalle de pedido con timeline y ETA.
- Flujo repartidor:
  - bandeja de asignaciones,
  - gestion de entregas por estado,
  - captura de evidencia (nota, receptor, OTP/foto),
  - timeline operativo.
- Flujo admin:
  - dashboard con KPIs,
  - alertas predictivas de stock,
  - alertas por categoria/proveedor,
  - gestion de pedidos,
  - CRUD de usuarios,
  - CRUD de productos + carga de imagen + ajuste de stock,
  - exportacion PDF/XLSX.
- Servicios de mapas:
  - fallback manual cuando no hay API key,
  - validacion por Google cuando existe `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`.

### Backend (FastAPI + Mongo)

Estado: **incompleto / no listo para uso**

Problemas detectados en codigo:

- `backend/main.py` importa rutas inexistentes: `service`, `review`, `contract`.
- `backend/database.py` usa `MONGO_URL_SERVER = ""` por defecto.
- `backend/controllers/user_controller.py` importa `UserStatus` pero no existe en `models/user.py`.
- `requirements` no esta alineado con el codigo:
  - se usa `pymongo` pero no esta declarado,
  - se declara `pydantic>=1.10` pero el codigo usa `model_dump()` (estilo Pydantic v2).
- Seguridad no apta para produccion:
  - login por password en texto plano,
  - `SECRET_KEY` hardcodeado.

Conclusiones:

- La app movil **no depende hoy de este backend** para operar.
- El backend requiere una fase de estabilizacion antes de conectarlo al frontend.

## Estructura relevante del repo

- `app/`: rutas Expo Router por rol (`(auth)`, `(client)`, `(admin)`, `(driver)`).
- `src/state/`: estado principal de sesion y pedidos.
- `src/context/`: catalogo, carrito, perfil y usuarios.
- `src/domain/rules/`: reglas de negocio (auth, transiciones de pedido, stock).
- `src/services/`: mapas, exportacion, insights, API (no conectada actualmente).
- `tests/`: unit + integration con Vitest.
- `backend/`: API FastAPI (incompleta).

Metricas aproximadas de codigo:

- `app/`: 43 archivos, ~7170 lineas.
- `src/`: 57 archivos, ~4972 lineas.
- `backend/`: 12 archivos, ~277 lineas.
- `tests/`: 8 archivos, ~502 lineas.

## Calidad y pruebas

Resultado local mas reciente:

- `npm run check` -> **OK**
- `tsc --noEmit` -> **OK**
- `eslint` -> **OK**
- `vitest` -> **8 archivos / 25 tests pasando**

Cobertura actual de pruebas:

- Reglas de auth.
- Reglas de transicion/pago de pedidos.
- Reglas de reserva/liberacion de stock.
- Alertas de stock.
- Alertas de quiebre por categoria/proveedor.
- Sugerencias de recompra.
- Tracking/ETA de pedidos.
- Flujo integrado de ciclo de pedido y stock.

No hay pruebas aun para:

- componentes de UI,
- flujos E2E,
- backend FastAPI.

## Variables de entorno

Actualmente no existe `.env.example`. Variables usadas por codigo:

- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` (opcional, mejora validacion/autocomplete/mapa).
- `EXPO_PUBLIC_API_URL` (requerida solo si se empieza a usar `src/services/api/*`).

Si faltan:

- el flujo principal sigue operando en modo local (con fallback manual en mapas),
- pero la capa `src/services/api/client.ts` lanzara error si se invoca sin `EXPO_PUBLIC_API_URL`.

## Usuarios demo

Se crean automaticamente en `UsersContext`:

- `admin-demo / admin123`
- `cliente-demo / cliente123`
- `driver-juan / driver123`

## Scripts

```bash
npm install
npm run start

# calidad
npm run check
npm run lint
npm run test
npm run typecheck

# formato
npm run format
npm run format:check
```

## Que SI incluye hoy

- Producto MVP funcional en frontend local con flujos completos por rol.
- Reglas de negocio de pedidos/pagos/stock.
- Persistencia local robusta.
- Analitica operativa y exportes admin.
- Base de pruebas automatizadas util para refactor.

## Que NO incluye hoy

- Integracion real frontend-backend.
- Backend estable para despliegue.
- Pasarela de pago real.
- Recuperacion de password real.
- Push notifications.
- Pipeline CI/CD.
- Suite E2E.
- Documento de arquitectura versionado (el archivo historico no esta en el arbol actual).

## Gaps prioritarios recomendados

1. Reparar backend y alinear modelos/contratos con frontend.
2. Definir `API_URL` y migrar `OrdersContext/AuthContext` a capa API.
3. Endurecer seguridad (hash server-side, JWT robusto, secretos en env).
4. Agregar `.env.example` y guia de setup.
5. Agregar pruebas E2E de flujos criticos por rol.

## Nota sobre modulos legacy

Existen piezas legacy que no representan el flujo principal actual:

- `app/(tabs)/*` y `src/features/pedidos/*` (demo inicial).
- `app/(client)/products/` (directorio vacio).

No rompen el build actual, pero conviene limpiarlos o documentar su rol para evitar confusion.

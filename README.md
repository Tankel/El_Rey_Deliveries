# El Rey Deliveries

Estado actualizado: 2026-03-19.

## Estado actual rapido

- Frontend: Expo Router con flujos por rol (`CLIENT`, `ADMIN`, `DRIVER`).
- Backend: FastAPI con endpoints de auth, usuarios, productos, perfiles, pedidos y notificaciones.
- Integracion: frontend ya conectado a backend por `EXPO_PUBLIC_API_URL`.
- Pagos: flujo activo de pago contra entrega (en persona: `EFECTIVO`, `TERMINAL` o `TRANSFERENCIA`), sin pasarela online por ahora.
- Persistencia:
  - Sin `EL_REY_MONGODB_URI`: en memoria.
  - Con `EL_REY_MONGODB_URI`: persistencia real en MongoDB en colecciones separadas (`users`, `products`, `orders`, `profiles`, `notifications`, `auth_audit`).
  - Si existia `app_state` legacy, se migra automaticamente al nuevo esquema por entidad.

## Documentacion recomendada

- Guia completa de ejecucion por entorno: [docs/COMO_EJECUTAR.md](docs/COMO_EJECUTAR.md)
- Backlog de bugs y pendientes: [docs/BUGS_BACKLOG.md](docs/BUGS_BACKLOG.md)

## Ajustes ya aplicados recientes

- Prevencion de doble guardado de direcciones (frontend + backend).
- Prueba de entrega visible para cliente en pedido entregado.
- Correccion visual de boton "Ver productos" en alertas de stock (dashboard admin).
- Tabla de usuarios: `username` siempre visible (no ocultable por filtros de columnas).
- Endurecimiento inicial: `/auth/reset-demo` protegido por rol `ADMIN` y flag de entorno.

## Usuarios demo

- `admin-demo / admin123`
- `cliente-demo / cliente123`
- `driver-juan / driver123`

Catalogo demo actualizado:

- 25 productos de mayoreo (20 nuevos, incluyendo linea de cerveza/alcohol).

## Calidad

```bash
npm run check
```

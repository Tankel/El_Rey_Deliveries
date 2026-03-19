# Bugs y Pendientes (Backlog Priorizado)

Fecha de corte: 2026-03-19.

## Criterio de prioridad

- `P0`: bloquea salida real a produccion o representa riesgo alto (dinero, seguridad, datos, cumplimiento).
- `P1`: necesario para operar bien en entorno real, pero no bloquea primer go-live controlado.
- `P2`: mejora operativa/comercial para escalar.

## P0 - Bloqueantes de produccion (ejecutar primero)

1. Pago real (reemplazar flujo simulado)
- Estado actual: se usa `PAGADO_SIMULADO`.
- Impacto: sin cobro real no hay operacion comercial valida.
- Entregable minimo:
  - Integracion con pasarela real (Stripe/Conekta/Openpay/Mercado Pago).
  - Webhooks para confirmar pago.
  - Reintentos y reversa/reembolso basico.
  - Conciliacion pedido-pago.
- Referencias: `backend/schemas.py`, `app/(client)/payment.tsx`.

2. Seguridad de cuentas y sesiones
- Estado actual: login/logout basico.
- Impacto: riesgo de secuestro de sesion y mala recuperacion de acceso.
- Entregable minimo:
  - `forgot password` + reset token con expiracion.
  - Refresh token y rotacion.
  - Cierre de sesion por dispositivo.
  - Verificacion de email/telefono (minimo uno).
- Referencias: `backend/routes/auth.py`.

3. Hardening de produccion
- Estado actual: hay endpoints de demo y faltan controles operativos.
- Impacto: riesgo de abuso, perdida de datos y baja trazabilidad.
- Entregable minimo:
  - Deshabilitar `/auth/reset-demo` fuera de desarrollo.
  - Rate limiting por IP/usuario.
  - CORS por allowlist (no `*` en prod).
  - Logs estructurados + monitoreo de errores.
  - Backups y restauracion probada.
  - Separacion de ambientes (dev/stage/prod).
- Referencias: `backend/routes/auth.py`, `backend/main.py`.

4. Normalizacion de IDs en Mongo (`_id` vs `id`)
- Estado actual: se guarda duplicado (`_id` y `id`) + `_order`.
- Impacto: deuda tecnica y riesgo de inconsistencias.
- Entregable minimo:
  - Persistir solo `_id` en DB.
  - Mapear `_id -> id` en capa API/respuesta.
  - Script de migracion y compatibilidad.
- Referencias: `backend/repository.py`.

5. Subida real de archivos/fotos de evidencia
- Estado actual: se guarda `photoUri`, no archivo real.
- Impacto: evidencia no confiable/auditable entre dispositivos.
- Entregable minimo:
  - Almacenamiento cloud (S3/Cloudinary/R2).
  - URL firmada o flujo seguro de subida.
  - Persistencia de metadatos (URL, size, mime, timestamp).
  - Regla de borrado/retencion.
- Referencias: `backend/store.py`.

6. Bugs criticos de flujo actual
- Bug A: doble submit al registrar direccion.
- Bug B: cliente no ve prueba de entrega cuando pedido esta entregado.
- Entregable minimo:
  - Bloqueo de boton + idempotencia en backend para direcciones.
  - Render completo de `deliveryProof` en vista cliente.
- Referencias: `app/(client)/checkout-address.tsx`, `src/context/ProfileContext.tsx`, `app/(client)/orders/[id].tsx`, `backend/routes/profiles.py`.

## P1 - Operacion real estable

7. Notificaciones reales al usuario final
- Estado actual: notificaciones internas (admin/driver) solamente.
- Entregable:
  - Push (Expo Notifications), email y/o SMS transaccional.
  - Plantillas por evento: pedido creado, asignado, en camino, entregado.

8. Facturacion real / fiscal (MX)
- Estado actual: UI de facturas sin backend fiscal completo.
- Entregable:
  - CFDI/timbrado (si aplica por regimen).
  - Descarga de comprobantes.
  - Relacion factura-pedido-pago.

9. Roles y permisos granulares (RBAC)
- Estado actual: rol general por tipo (`ADMIN/CLIENT/DRIVER`).
- Entregable:
  - Permisos por accion/modulo.
  - Roles administrativos diferenciados (catalogo, pedidos, finanzas, soporte).

10. Ajustes UX/Performance pendientes
- Bug C: falta lazy load en pantallas/listados.
- Bug D: boton "Ver producto" se desborda visualmente en alertas.
- Bug E: en usuarios (admin), al quitar todos los filtros/columnas visibles solo quedan botones y la tabla pierde utilidad.
- Entregable:
  - Carga incremental/skeletons.
  - Correccion responsive de tarjetas/acciones.
  - En tabla de usuarios, mantener una columna minima obligatoria (`username`) y removerla de los toggles de filtros para que no pueda ocultarse.

## P2 - Escalamiento comercial y logistico

11. Operacion logistica avanzada
- Falta:
  - Zonas de cobertura y costos por zona.
  - Ventanas horarias.
  - SLA y reasignacion automatica de repartidor.

12. Inventario robusto
- Falta:
  - Entradas/compras.
  - Ajustes auditables.
  - Devoluciones.
  - Lotes/caducidad.
  - Multi-almacen.

13. Catalogo comercial mayoreo avanzado
- Falta:
  - Listas de precio por cliente.
  - Promociones por volumen.
  - Minimos por SKU.
  - Disponibilidad por zona.

14. Plataforma de mapas de menor costo
- Falta:
  - Migrar de dependencia fuerte de Google Maps.
  - Evaluar `react-native-maps` + proveedor gratuito para geocodificacion/autocomplete como OpenStreetMap.

## Orden de ejecucion recomendado por bloques

- Bloque A (P0): items `1, 2, 3, 4, 5, 6`.
- Bloque B (P1): items `7, 8, 9, 10`.
- Bloque C (P2): items `11, 12, 13, 14`.

## Nota operativa

- Ya existe persistencia Mongo por coleccion; esta lista prioriza lo faltante para operar en entorno real con seguridad, cobro y trazabilidad.

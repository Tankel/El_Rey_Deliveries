# Bugs y Pendientes (Backlog Priorizado)

Fecha de corte: 2026-03-19.

## Decision de alcance actual

- `Pago real` se mantiene en pausa temporal.
- El foco actual es: estabilidad, UX, seguridad operativa y datos reales.
- Los pagos operan como `contra entrega` (sin pasarela online), y se marcan como pagados al entregar.

## Criterio de prioridad

- `P0`: bloquea operacion estable o pone en riesgo seguridad/datos.
- `P1`: necesario para operar bien con clientes reales.
- `P2`: escalamiento comercial/logistico.
- `PAUSADO`: pendiente intencional fuera del alcance actual.

## P0 - Sprint actual (sin pasarela de pago)

1. Seguridad de cuentas y sesiones
- Estado: `PENDIENTE`.
- Falta:
  - Forgot password con token y expiracion.
  - Refresh token + rotacion.
  - Revocacion por dispositivo.
  - Verificacion email o telefono.
- Referencia: `backend/routes/auth.py`.

2. Hardening de produccion
- Estado: `EN CURSO`.
- Avance hecho:
  - `/auth/reset-demo` ahora se puede deshabilitar por env y requiere rol `ADMIN`.
- Falta:
  - Rate limiting.
  - CORS por allowlist de dominios.
  - Auditoria extendida y observabilidad.
  - Backups/restauracion y ambientes separados.
- Referencias: `backend/routes/auth.py`, `backend/main.py`.

3. Subida real de archivos/fotos de evidencia
- Estado: `PENDIENTE`.
- Falta:
  - Storage cloud (S3/Cloudinary/R2).
  - Subida segura (direct upload o URL firmada).
  - Metadatos + retencion/borrado.
- Referencia: `backend/store.py`.

4. Normalizacion de IDs en Mongo (`_id` vs `id`)
- Estado: `EN CURSO`.
- Avance hecho:
  - Repositorio actualizado para persistir canonico en `_id` y mapear a `id/userId` al leer.
  - Limpieza automatica de campos duplicados legacy (`id`/`userId`) al cargar estado.
- Falta:
  - Verificacion en base ya poblada y script opcional de migracion explicito para ambientes productivos.
- Referencia: `backend/repository.py`.

5. Bugs de UX criticos reportados
- Estado global: `PARCIALMENTE RESUELTO`.
- Bug A (doble submit al guardar direccion): `HECHO`.
  - Front bloquea reintento y backend evita duplicados.
  - Referencias: `app/(client)/checkout-address.tsx`, `backend/store.py`.
- Bug B (cliente no ve prueba de entrega): `HECHO`.
  - Ya se renderiza tarjeta de `deliveryProof` en pedido entregado.
  - Referencia: `app/(client)/orders/[id].tsx`.
- Bug C (boton "Ver producto" se sale del contenedor): `HECHO`.
  - Ajuste responsive aplicado en dashboard admin.
  - Referencia: `app/(admin)/(tabs)/dashboard.tsx`.
- Bug D (filtros de usuarios dejan tabla inutil al ocultar todo): `HECHO`.
  - `username` queda fijo visible y fuera de toggles.
  - Referencia: `app/(admin)/users/index.tsx`.
- Bug E (falta lazy load/listados): `PENDIENTE`.
  - Falta paginacion/carga incremental consistente.

## P1 - Operacion real estable

6. Notificaciones reales al usuario final
- Estado: `PENDIENTE`.
- Falta: push (Expo), email y/o SMS transaccional por eventos clave.

7. Facturacion real / fiscal (MX)
- Estado: `PENDIENTE`.
- Falta: backend fiscal, timbrado CFDI (si aplica) y descarga de comprobantes.

8. RBAC granular
- Estado: `PENDIENTE`.
- Falta: permisos por accion/modulo y roles administrativos especializados.

9. Mapa/costos de proveedor
- Estado: `PENDIENTE`.
- Falta: reducir dependencia de Google Maps y evaluar opciones costo-efectivas (ej. `react-native-maps` + proveedor de geocodificacion).

## P2 - Escalamiento comercial/logistico

10. Operacion logistica avanzada
- Zonas, costos por zona, ventanas horarias, SLA y auto-reasignacion.

11. Inventario robusto
- Compras/recepcion, ajustes auditables, devoluciones, lotes/caducidad, multi-almacen.

12. Catalogo mayoreo avanzado
- Listas de precio por cliente, promos por volumen, minimos por SKU, disponibilidad por zona.

## PAUSADO (por decision actual)

13. Pago online con pasarela (adicional a contra entrega)
- Estado: `PAUSADO`.
- Nota: se reactivara cuando decidas abrir el bloque de pasarela.
- Referencias actuales: `backend/schemas.py`, `app/(client)/payment.tsx`.

## Orden de ejecucion recomendado (bloques)

- Bloque A (P0 tecnico): items `1, 2, 3, 4`.
- Bloque B (P0 UX final): item `5` (cerrar lazy load).
- Bloque C (P1 operacion): items `6, 7, 8, 9`.
- Bloque D (P2 escalamiento): items `10, 11, 12`.
- Bloque E (cuando tu lo decidas): item `13` pago real.

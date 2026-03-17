# Bugs y Pendientes (Backlog)

Fecha de corte: 2026-03-17.

## Bloque 0 - Estabilidad Critica

1. Registro de direccion permite doble tap y duplica guardado.
- Modulo: `app/(client)/checkout-address.tsx`, `src/context/ProfileContext.tsx`, `backend/routes/profiles.py`.
- Problema: durante el POST de direccion el boton se puede presionar varias veces y se crean entradas duplicadas.
- Impacto: datos duplicados, mala UX, ruido en direccion predeterminada.
- Criterio de aceptacion:
  - El boton queda deshabilitado mientras `isSubmitting=true`.
  - Se muestra indicador de carga.
  - El backend evita duplicados exactos en una ventana corta (idempotencia basica).

2. Cliente no ve prueba de entrega cuando el pedido ya fue entregado.
- Modulo: `app/(client)/orders/[id].tsx` y estado de pedidos.
- Problema: la orden contiene `deliveryProof` en backend, pero la vista cliente no lo refleja consistentemente.
- Impacto: baja confianza post-entrega y soporte manual.
- Criterio de aceptacion:
  - Si `status=ENTREGADO` y hay `deliveryProof`, cliente ve nota, receptor, relacion, OTP/foto (si existe).

## Bloque 1 - UX y Performance

3. Falta lazy load en pantallas y/o listados pesados.
- Modulo: catalogo, pedidos admin, historiales.
- Problema: carga inicial pesada y render completo temprano.
- Impacto: pantalla lenta en equipos medios.
- Criterio de aceptacion:
  - Paginacion o carga incremental en listas grandes.
  - Skeleton/loading por seccion.
  - Sin bloqueos visibles al navegar.

4. Boton "Ver producto" se sale visualmente del contenedor en alertas predictivas de stock.
- Modulo: dashboard/admin de alertas.
- Problema: overflow y layout roto en algunos anchos.
- Impacto: UI inconsistente y accion menos accesible.
- Criterio de aceptacion:
  - Boton siempre dentro del card/contenedor en mobile y desktop.
  - Sin overflow horizontal.

## Bloque 2 - Plataforma de Mapas

5. Sustituir dependencia fuerte de Google Maps por alternativa gratuita y `react-native-maps`.
- Modulo: `src/services/maps/*`, flujos de direccion y tracking.
- Problema: hoy la experiencia plena depende de API key de Google.
- Impacto: costo, setup complejo y friccion en QA.
- Propuesta:
  - Mapa base con `react-native-maps`.
  - Geocodificacion/autocomplete con proveedor gratuito (por ejemplo Nominatim/Photon, respetando limites/terminos).
  - Mantener fallback manual actual.
- Criterio de aceptacion:
  - Busqueda y seleccion de direccion funcional sin Google.
  - Tracking visible en mapa con proveedor gratuito.

## Bloque 3 - Datos y Operacion

6. Endurecer capa Mongo (persistencia ya habilitada, falta robustez).
- Modulo: `backend/store.py`, `backend/repository.py`.
- Estado actual: ya persiste estado completo en Mongo cuando `EL_REY_MONGODB_URI` esta configurado.
- Pendiente:
  - Migrar de snapshot unico a colecciones normalizadas (`users`, `products`, `orders`, etc.).
  - Indices y validaciones por coleccion.
  - Estrategia de migraciones/versionado de esquema.

## Notas

- Este backlog concentra los reportes nuevos de UX y los pendientes tecnicos para estabilizar la fase "backend real".
- Prioridad sugerida: cerrar Bloque 0 completo antes de tocar mapas o mejoras visuales.

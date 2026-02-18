# Arquitectura propuesta — El Rey Distribuidora (Expo + React Native)

## 1) Estructura de carpetas profesional

```text
El_Rey_Deliveries/
├── app/                              # Expo Router (rutas por archivo)
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── recover-password.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx                 # Inicio / resumen
│   │   ├── pedidos.tsx
│   │   ├── inventario.tsx
│   │   ├── clientes.tsx
│   │   └── perfil.tsx
│   ├── pedidos/
│   │   ├── [id].tsx
│   │   ├── crear.tsx
│   │   └── historial.tsx
│   ├── entregas/
│   │   ├── [id].tsx
│   │   └── mapa.tsx
│   ├── _layout.tsx
│   └── +not-found.tsx
│
├── src/
│   ├── ui/                           # Capa de presentación (componentes puros)
│   │   ├── components/
│   │   │   ├── atoms/
│   │   │   ├── molecules/
│   │   │   └── organisms/
│   │   ├── layouts/
│   │   └── theme/                    # colores, tipografías, spacing, dark mode
│   │
│   ├── features/                     # Módulos por dominio de negocio
│   │   ├── auth/
│   │   │   ├── screens/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   ├── repository/
│   │   │   ├── models/
│   │   │   └── validators/
│   │   ├── pedidos/
│   │   ├── entregas/
│   │   ├── clientes/
│   │   ├── inventario/
│   │   ├── pagos/
│   │   └── reportes/
│   │
│   ├── core/                         # Cross-cutting concerns
│   │   ├── api/                      # cliente HTTP para futuro backend
│   │   ├── storage/                  # AsyncStorage adapters
│   │   ├── database/                 # persistencia local (JSON serialización)
│   │   ├── navigation/
│   │   ├── errors/
│   │   ├── logger/
│   │   ├── constants/
│   │   └── utils/
│   │
│   ├── state/                        # Estado global (Context + reducers)
│   │   ├── AuthContext.tsx
│   │   ├── SessionContext.tsx
│   │   ├── CartContext.tsx
│   │   ├── SyncContext.tsx
│   │   └── index.tsx                 # AppProviders
│   │
│   ├── services/                     # Casos transversales
│   │   ├── sync/
│   │   ├── notifications/
│   │   ├── permissions/
│   │   └── connectivity/
│   │
│   ├── config/
│   │   ├── env.ts
│   │   ├── appConfig.ts
│   │   └── featureFlags.ts
│   │
│   └── types/
│       ├── api.ts
│       ├── entities.ts
│       └── navigation.ts
│
├── assets/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── scripts/
├── app.json
├── package.json
└── tsconfig.json
```

---

## 2) Separación entre UI, lógica y servicios

### A. UI (presentación)
- Ubicación: `src/ui` + archivos de ruta en `app/`.
- Responsabilidad:
  - Renderizar vistas, inputs, listas, cards y navegación.
  - Emitir eventos (`onPress`, `onSubmit`) sin decidir lógica de negocio.
- Regla clave: componentes **sin acceso directo a AsyncStorage ni fetch/axios**.

### B. Lógica de negocio (aplicación/dominio)
- Ubicación: `src/features/<modulo>/hooks`, `repository`, `models`, `validators`.
- Responsabilidad:
  - Casos de uso: crear pedido, validar stock, cerrar entrega, calcular total.
  - Reglas: estados válidos del pedido, límites de crédito, validaciones.
- Patrón recomendado:
  - `Screen -> useCaseHook -> Repository Interface -> Data Source`.

### C. Servicios e infraestructura
- Ubicación: `src/core` y `src/services`.
- Responsabilidad:
  - Persistencia local (AsyncStorage + JSON).
  - Cliente API para backend futuro.
  - Sincronización offline/online, notificaciones, conectividad.

### D. Estrategia para escalar a backend sin rehacer app
Define contrato por interfaz de repositorio, por ejemplo:

```ts
// src/features/pedidos/repository/PedidosRepository.ts
export interface PedidosRepository {
  getAll(): Promise<Pedido[]>;
  getById(id: string): Promise<Pedido | null>;
  create(data: CreatePedidoDTO): Promise<Pedido>;
  updateStatus(id: string, status: PedidoStatus): Promise<void>;
}
```

Implementaciones:
- `PedidosLocalRepository` (hoy: AsyncStorage/JSON).
- `PedidosRemoteRepository` (futuro: REST/GraphQL).

La UI y casos de uso no cambian; solo cambia el binding en `AppProviders`/DI.

---

## 3) Lista de pantallas necesarias

### Autenticación
1. **Splash / Boot** (carga sesión, config, hidrata storage)
2. **Login**
3. **Recuperar contraseña** (aunque sea mock al inicio)

### Operación principal
4. **Dashboard** (KPIs rápidos: pedidos del día, entregas pendientes)
5. **Pedidos (lista)**
6. **Crear/Editar pedido**
7. **Detalle de pedido**
8. **Entregas (ruta/lista)**
9. **Detalle de entrega**
10. **Mapa de entregas** (opcional fase 2)
11. **Clientes (lista)**
12. **Detalle/editar cliente**
13. **Inventario (lista)**
14. **Movimiento de inventario** (entrada/salida)
15. **Pagos/Cobranzas**
16. **Historial/Reportes**

### Soporte
17. **Notificaciones**
18. **Perfil de usuario**
19. **Configuración** (tema, sync, cerrar sesión)
20. **Estado de sincronización / cola offline**

---

## 4) Contextos globales necesarios

Usa pocos contextos y bien definidos (evitar “mega-context”).

1. **AuthContext**
   - Estado: usuario autenticado, token/sesión, rol.
   - Acciones: `signIn`, `signOut`, `restoreSession`.

2. **SessionContext**
   - Estado: sucursal activa, caja/turno, preferencias operativas.
   - Acciones: abrir/cerrar turno, cambiar sucursal.

3. **SyncContext**
   - Estado: `isOnline`, `lastSyncAt`, `pendingQueue`, `syncStatus`.
   - Acciones: `enqueue`, `syncNow`, `retryFailed`.

4. **Cart/OrderDraftContext** (si la creación de pedido es compleja)
   - Estado temporal del pedido en construcción.
   - Acciones: agregar/quitar producto, aplicar descuento, confirmar.

5. **UIContext (opcional y pequeño)**
   - Estado transversal visual: loading global, toasts, modal manager.

> Si crece la complejidad de estado de servidor, migrar gradualmente a TanStack Query + persistencia local.

---

## 5) Flujo de navegación recomendado

### Propuesta con Expo Router

- `app/_layout.tsx`: proveedor global + stack raíz.
- Flujo:
  1. **Boot** valida sesión y carga datos base.
  2. Si no hay sesión → grupo `(auth)`.
  3. Si hay sesión → grupo principal `(tabs)`.

### Tabs principales
- **Inicio**
- **Pedidos**
- **Entregas**
- **Clientes**
- **Perfil**

### Navegación jerárquica
- Desde `Pedidos`:
  - Lista → Detalle `[id]` → Editar / Estado / Pago.
- Desde `Entregas`:
  - Lista de ruta → Detalle entrega → mapa/firma/foto evidencia.

### Guards recomendados
- `AuthGuard`: bloquea rutas privadas sin sesión.
- `RoleGuard`: restringe módulos por rol (admin, vendedor, repartidor).
- `ConnectivityGuard` (suave): advierte cuando un flujo requiere internet.

### Deep links (futuro)
- `elreydistribuidora://pedido/:id`
- `elreydistribuidora://entrega/:id`

---

## Recomendación de implementación por fases

### Fase 1 (MVP local-first)
- Auth local básica
- CRUD de pedidos/clientes/inventario
- SyncContext con cola local simulada
- Navegación base con tabs + stacks

### Fase 2 (pre-backend)
- Repositorios por interfaz en todos los módulos
- API client desacoplado
- Logging y manejo de errores unificado

### Fase 3 (backend real)
- Cambiar implementaciones `LocalRepository` -> `RemoteRepository`
- Mantener fallback offline para operaciones críticas
- Agregar estrategia de sincronización y resolución de conflictos

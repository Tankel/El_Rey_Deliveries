# El Rey Deliveries

Starter scaffold en **Expo + React Native + Expo Router** basado en la arquitectura propuesta.

## Qué incluye este inicio

- Estructura inicial por rutas (`app/`) y dominios (`src/features`, `src/core`, `src/state`).
- Flujo básico de autenticación local (`AuthContext`).
- Tabs principales: Inicio, Pedidos, Clientes, Inventario y Perfil.
- Ejemplo de módulo de negocio (`pedidos`) con:
  - interfaz de repositorio,
  - implementación local con AsyncStorage,
  - hook de caso de uso (`usePedidos`).

## Requisitos

- Node.js 18+
- npm 9+

## Arrancar el proyecto

```bash
npm install
npm run start
```

Opcional:

```bash
npm run android
npm run ios
npm run web
```

## Primeros pasos recomendados para seguir codificando

1. Implementar `SessionContext` y `SyncContext` en `src/state`.
2. Agregar DTOs/validadores por módulo (`src/features/*/validators`).
3. Crear pantallas detalle/crear para `pedidos` (`app/pedidos`).
4. Agregar tests unitarios de repositorios y hooks en `tests/unit`.
5. Definir capa de API mock en `src/core/api` para preparar Fase 2.

## Documento de arquitectura

Ver el documento base en [`ARQUITECTURA_EL_REY_DISTRIBUIDORA.md`](./ARQUITECTURA_EL_REY_DISTRIBUIDORA.md).

# Frontend Web (React + Vite + Tailwind v4)

Este proyecto vive en `frontend/web` y está pensado para mantener **auth**, **layout** y **features por rol** separados.

## Correr

- Instalar (desde `aplicacion/`): `npm install`
- Dev: `npm run dev:web`
- Build: `npm run build:web`

## Variables de entorno

Archivo: `frontend/web/.env.example`

- `VITE_AUTH_LOGIN_URL`: endpoint para login (POST).
- `VITE_AUTH_FORGOT_PASSWORD_URL`: endpoint para recuperar contraseña (POST).
- `VITE_API_BASE_URL`: base URL del backend para el resto de módulos (ej. ventas/inventario/etc).

## Estructura de carpetas (qué va en cada una)

### `public/`

Archivos públicos servidos tal cual por Vite.

- `public/assets/logo.png`: logo (se usa en Splash/Login).

### `src/`

Código TypeScript/React.

#### `src/pages/`

Pantallas “globales” (no dependen de un rol específico).

- `src/pages/SplashPage.tsx`: splash inicial, decide si va a `/login` o `/app` según sesión local.
- `src/pages/auth/*`: pantallas de autenticación (Login / Forgot Password).
- `src/pages/app/*`: layout general del panel (`AppLayout`) + pantalla inicial (`AppIndexPage`) para elegir rol en modo dev.

#### `src/features/`

**Una carpeta por rol**, para que cada rol tenga sus vistas independientes.

- `src/features/cliente/*`
- `src/features/supervisor/*`
- `src/features/vendedor/*`
- `src/features/transportista/*`
- `src/features/bodeguero/*`

Recomendación dentro de cada feature (cuando crezcan las pantallas):

- `screens/`: páginas/vistas del rol.
- `components/`: componentes solo de ese rol.
- `services/`: llamadas al backend solo de ese rol (ej. `ventasApi.ts`, `inventarioApi.ts`).
- `types/`: tipos del rol (si no van a `shared/types`).

#### `src/routes/`

Enrutado de la app.

- `src/routes/AppRouter.tsx`: define rutas y lazy loading.
- `src/routes/RequireAuth.tsx`: protege `/app/*` si no hay token.

#### `src/context/`

Estado global por contexto.

- `src/context/auth/AuthContext.tsx`: sesión (token), `signIn` / `signOut`.

#### `src/hooks/`

Hooks reutilizables.

- `src/hooks/useAuth.ts`: wrapper para leer el AuthContext.

#### `src/components/`

Componentes reutilizables (shared dentro de web).

- `src/components/ui/*`: UI base (Button, TextField, etc).

#### `src/services/`

Integración con backend y utilidades de infraestructura.

- `src/services/auth/authApi.ts`: login + forgot password (usa URLs de `.env`).
- `src/services/api/http.ts`: helper para consumir el backend por `VITE_API_BASE_URL`.
- `src/services/storage/*`: persistencia local (token y otros).

#### `src/types/`

Tipos del lado web (solo web).

- `src/types/roles.ts`: llaves/labels/rutas de roles (solo para navegación).

#### `src/theme/`

Paleta / tokens visuales.

- `src/theme/colors.ts`: tokens de color (web) basados en `@cafrilosa/shared-types`.

#### `src/styles/`

Estilos globales.

- `src/styles/index.css`: Tailwind v4 + animaciones (splash).

#### `src/utils/`

Utilidades pequeñas.

- `src/utils/cn.ts`: helper para concatenar clases.

## Cómo se conecta con el backend (flujo recomendado)

1. Configura `.env` (copia desde `.env.example`):
   - Auth: `VITE_AUTH_LOGIN_URL`, `VITE_AUTH_FORGOT_PASSWORD_URL`
   - API: `VITE_API_BASE_URL`

2. Login:
   - UI: `src/pages/auth/LoginPage.tsx`
   - Request: `src/services/auth/authApi.ts`
   - Token: `src/context/auth/AuthContext.tsx` → `src/services/storage/tokenStorage.ts`

3. Consumo de API de negocio (ej. ventas/inventario):
   - Crea un cliente dentro de cada rol: `src/features/<rol>/services/*.ts`
   - Usa `src/services/api/http.ts` para llamar al backend con `VITE_API_BASE_URL`.

Nota: si el backend requiere `Authorization: Bearer <token>`, el patrón recomendado es leer el token desde `useAuth()` y pasarlo en headers (o extender `http.ts` para inyectarlo).

## Shared types (recomendado)

`@cafrilosa/shared-types` vive en `shared/types` y se usa para:

- `BRAND_COLORS` (marca) en Tailwind config.
- `credentialsSchema` y tipos de auth compartidos.

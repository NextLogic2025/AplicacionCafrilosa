# Frontend Móvil (Expo + React Native + NativeWind)

Este proyecto vive en `frontend/mobile` y usa Expo para acelerar desarrollo.

## Correr

- Instalar (desde `aplicacion/`): `npm install`
- Dev: `npm run dev:mobile`
- Android: `npm run android:mobile`
- iOS: `npm run ios:mobile`

## Variables de entorno

Archivo: `frontend/mobile/.env.example`

- `EXPO_PUBLIC_AUTH_LOGIN_URL`: endpoint para login (POST).
- `EXPO_PUBLIC_AUTH_FORGOT_PASSWORD_URL`: endpoint para recuperar contraseña (POST).
- `EXPO_PUBLIC_API_BASE_URL`: base URL del backend para módulos (ventas/inventario/etc).

## Estructura de carpetas (qué va en cada una)

### `assets/`

Assets nativos empaquetados por Expo.

- `assets/logo.png`: logo de la app.

### `src/`

Código TypeScript/React Native.

#### `src/features/`

**Una carpeta por dominio/rol** (mantiene el proyecto escalable).

- `src/features/auth/`
  - `screens/`: Splash, Login, ForgotPassword.

- `src/features/app/`
  - `screens/`: pantallas “app-level” como selector de rol (modo dev).
  - `components/`: piezas compartidas entre roles (ej. `RoleShell`).

- `src/features/cliente/`
- `src/features/supervisor/`
- `src/features/vendedor/`
- `src/features/transportista/`
- `src/features/bodeguero/`
  - `screens/`: pantallas del rol.
  - (recomendado) `components/`, `services/`, `types/` según crezca.

#### `src/navigation/`

Tipos y utilidades de navegación.

- `src/navigation/types.ts`: `RootStackParamList` (contrato de rutas).

#### `src/components/`

Componentes reutilizables (shared dentro de móvil).

- `src/components/ui/*`: UI base (PrimaryButton, TextField, etc).

#### `src/services/`

Integración con backend.

- `src/services/auth/authClient.ts`: login + forgot password (usa env `EXPO_PUBLIC_*`).
- `src/services/api/http.ts`: helper para consumir el backend por `EXPO_PUBLIC_API_BASE_URL`.

#### `src/storage/`

Persistencia local.

- `src/storage/authStorage.ts`: token en `expo-secure-store` (con soporte “recordarme”).

#### `src/assets/`

Exports de assets para usar en código.

- `src/assets/logo.ts`: wrapper `require(...)` para RN.

#### `src/theme/`

Paleta / tokens visuales.

- `src/theme/colors.ts`: tokens de color (móvil) basados en `@cafrilosa/shared-types`.

## Cómo se conecta con el backend (flujo recomendado)

1. Configura `.env` (copia desde `.env.example`):
   - Auth: `EXPO_PUBLIC_AUTH_LOGIN_URL`, `EXPO_PUBLIC_AUTH_FORGOT_PASSWORD_URL`
   - API: `EXPO_PUBLIC_API_BASE_URL`

2. Login:
   - UI: `src/features/auth/screens/LoginScreen.tsx`
   - Request: `src/services/auth/authClient.ts`
   - Token: `src/storage/authStorage.ts` (SecureStore)

3. API de negocio:
   - Crea clientes por rol: `src/features/<rol>/services/*.ts`
   - Usa `src/services/api/http.ts` para llamar al backend.

Nota: si necesitas `Authorization: Bearer <token>`, el patrón recomendado es obtener el token desde `src/storage/authStorage.ts` y enviarlo en headers (o extender `http.ts` para inyectarlo).

## Shared types (recomendado)

`@cafrilosa/shared-types` vive en `shared/types` y se usa para:

- `BRAND_COLORS` (marca) en `tailwind.config.js`.
- schemas/tipos de auth compartidos con web.

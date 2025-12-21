# Mobile (Expo + React Native)

App móvil para Cafrilosa (Expo SDK `54.0.6`, compatible con Expo Go).

## Comandos

Desde la raíz del repo:

```bash
npm install
npm run dev:mobile
```

Luego abre Expo Go y escanea el QR.

Variables de entorno (opcional para login real):

- Copia `apps/mobile/.env.example` a `apps/mobile/.env` y configura `EXPO_PUBLIC_AUTH_LOGIN_URL`.

## Estructura

- `App.tsx`: navegación y bootstrap (splash → login).
- `src/screens/`: pantallas (`SplashScreen`, `LoginScreen`).
- `src/services/`: integración (por ahora stub listo para conectar).
- `src/ui/`: componentes de UI.
- `assets/`: logo/splash/icon.

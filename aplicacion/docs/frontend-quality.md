# Calidad de código (Frontend): ESLint + Prettier

Este repo tiene herramientas para mantener el frontend limpio, consistente y fácil de mantener.

## ¿Para qué sirve?

- ESLint: detecta errores y malas prácticas (imports, hooks, variables sin usar, etc.).
- Prettier: formatea el código automáticamente con un estilo consistente (menos conflictos en git).

## Comandos (desde `aplicacion/`)

- Formatear todo: `npm run format`
- Verificar formato (CI): `npm run format:check`
- Lint (frontend + shared types): `npm run lint`
- Lint con auto-fix: `npm run lint:fix`

## Qué archivos revisa

El lint está limitado a:

- `frontend/**/*.{ts,tsx,js,cjs}`
- `shared/types/**/*.{ts,tsx,js,cjs}`

Se ignoran: `node_modules/`, `dist/`, `build/`, `.expo/`, `.cache/`, `coverage/`.

## Notas importantes (Expo / React Native)

- React Native usa sintaxis Flow en algunos módulos de `node_modules`. ESLint no debe analizar eso; por eso el lint evita falsos positivos.
- Assets en RN usan `require()` (ej. `frontend/mobile/src/assets/logo.ts`), por eso está permitido en esa carpeta.
- En `frontend/mobile/index.js` se mantiene `react-native-gesture-handler` al inicio (requisito común de RN).

## Flujo recomendado

Antes de subir cambios:

- `npm run format`
- `npm run lint` (o `npm run lint:fix` si quieres autocorregir)

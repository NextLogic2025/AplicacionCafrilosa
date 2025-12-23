# Aplicación Cafrilosa (Monorepo)

Frontend web y móvil en una sola carpeta (`aplicacion/`).

## Ejecutar

Prerequisitos: Node.js + npm.

- Instalar dependencias: `npm install`
- Web: `npm run dev:web` (o `npm run build:web`)
- Móvil (Expo): `npm run dev:mobile` (`npm run android:mobile` / `npm run ios:mobile`)
- Calidad (frontend): `npm run lint` y `npm run format`

## Estructura (frontend)

- `frontend/web`: React + TypeScript + Tailwind v4
- `frontend/mobile`: React Native + Expo + NativeWind
- `shared/types`: `@cafrilosa/shared-types` (schemas + colores de marca)

Docs:

- Web: `frontend/web/README.md`
- Móvil: `frontend/mobile/README.md`
- Calidad: `docs/frontend-quality.md`

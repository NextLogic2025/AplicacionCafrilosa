# Web (React + Vite)

Frontend web para Cafrilosa.

## Comandos

Desde la raíz del repo:

```bash
npm install
npm run dev:web
```

Variables de entorno: copia `apps/web/.env.example` a `apps/web/.env` y configura `VITE_AUTH_LOGIN_URL`.

## Estilos

Usa Tailwind CSS v4.

## Estructura

- `src/app/`: router y providers globales.
- `src/domains/`: features (ej: `auth`, `ventas`).
- `src/services/`: clientes HTTP (BFF).
- `src/ui/`: componentes reutilizables.
- `src/styles/`: tema global (colores del logo) y estilos base.

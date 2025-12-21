# Aplicación Cafrilosa (Monorepo)

Monorepo con `apps/` (frontends), `services/` (backend) y `packages/` (código compartido).

## Comandos rápidos (frontend)

```bash
npm install
npm run dev:web
npm run dev:mobile
```

## Estructura

- `apps/web/`: React + Vite (splash + login responsive).
- `apps/mobile/`: Expo + React Native (SDK `54.0.6`, splash animado + login).
- `packages/`: tipos/contratos compartidos.
- `services/`: microservicios backend.
- `docs/`: documentación.
- `infra/`: infraestructura.


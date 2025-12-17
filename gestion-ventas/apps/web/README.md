# Web App (React + Vite)

Proyecto `web` basado en Vite + React + TypeScript. Sigue la regla de arquitectura: el frontend solo consume el `bff-service`.

Quick start:

```bash
cd Backend/gestion-ventas/apps/web
nvm use
npm install
npm run dev
```

Estructura propuesta en `src/`:

```
src/
├── app/            # router, guards, providers
├── domains/        # auth, ventas, clientes, etc.
├── ui/             # components, layouts
├── services/       # bff-client, interceptors
├── store/          # state management
└── utils/
```

Regla: No referenciar microservicios desde el frontend — solo `bff`.
# App Web

Carpeta para la aplicación web (front-end). Aquí habrá un proyecto separado (Next.js/Vite/etc.).

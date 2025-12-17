# Mobile App (React Native / Expo)

Recomiendo usar Expo para desarrollo rápido y compatibilidad.

Crear el proyecto con Expo (ejemplo):

```bash
# desde la carpeta apps/mobile
npx create-expo-app .
# o
npx expo init mobile-app
```

Estructura recomendada:

```
src/
├── app/          # navigation, guards, providers
├── domains/      # auth, ventas, clientes, etc.
├── ui/           # components
├── services/     # bff-client (compartir lógica con web)
└── utils/
```

Regla: consumir siempre `bff-service`.
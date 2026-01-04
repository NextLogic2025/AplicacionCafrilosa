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
- `apps/mobile/`: Expo + React Native.
- `packages/`: tipos/contratos compartidos.
- `services/`: microservicios backend.
- `docs/`: documentación.
- `infra/`: infraestructura.


```
AplicacionCafrilosa
├─ aplicacion
│  ├─ .cache
│  │  └─ eslint
│  ├─ .editorconfig
│  ├─ .eslintignore
│  ├─ .eslintrc.cjs
│  ├─ .prettierignore
│  ├─ .prettierrc.json
│  ├─ backend
│  │  └─ services
│  │     ├─ catalog
│  │     │  ├─ .dockerignore
│  │     │  ├─ .eslintrc.js
│  │     │  ├─ .eslintrc.json
│  │     │  ├─ dist
│  │     │  │  ├─ app.module.js
│  │     │  │  ├─ app.module.js.map
│  │     │  │  ├─ asignacion
│  │     │  │  │  ├─ asignacion.controller.js
│  │     │  │  │  ├─ asignacion.controller.js.map
│  │     │  │  │  ├─ asignacion.module.js
│  │     │  │  │  ├─ asignacion.module.js.map
│  │     │  │  │  ├─ asignacion.service.js
│  │     │  │  │  ├─ asignacion.service.js.map
│  │     │  │  │  └─ entities
│  │     │  │  │     ├─ asignacion-vendedores.entity.js
│  │     │  │  │     └─ asignacion-vendedores.entity.js.map
│  │     │  │  ├─ auth
│  │     │  │  │  ├─ jwt.strategy.js
│  │     │  │  │  ├─ jwt.strategy.js.map
│  │     │  │  │  ├─ roles.decorator.js
│  │     │  │  │  ├─ roles.decorator.js.map
│  │     │  │  │  ├─ roles.guard.js
│  │     │  │  │  └─ roles.guard.js.map
│  │     │  │  ├─ categories
│  │     │  │  │  ├─ categories.controller.js
│  │     │  │  │  ├─ categories.controller.js.map
│  │     │  │  │  ├─ categories.module.js
│  │     │  │  │  ├─ categories.module.js.map
│  │     │  │  │  ├─ categories.service.js
│  │     │  │  │  ├─ categories.service.js.map
│  │     │  │  │  └─ entities
│  │     │  │  │     ├─ category.entity.js
│  │     │  │  │     └─ category.entity.js.map
│  │     │  │  ├─ clientes
│  │     │  │  │  ├─ clientes.controller.js
│  │     │  │  │  ├─ clientes.controller.js.map
│  │     │  │  │  ├─ clientes.module.js
│  │     │  │  │  ├─ clientes.module.js.map
│  │     │  │  │  ├─ clientes.service.js
│  │     │  │  │  ├─ clientes.service.js.map
│  │     │  │  │  └─ entities
│  │     │  │  │     ├─ cliente.entity.js
│  │     │  │  │     └─ cliente.entity.js.map
│  │     │  │  ├─ main.js
│  │     │  │  ├─ main.js.map
│  │     │  │  ├─ precios
│  │     │  │  │  ├─ dto
│  │     │  │  │  │  ├─ asignar-precio.dto.js
│  │     │  │  │  │  └─ asignar-precio.dto.js.map
│  │     │  │  │  ├─ entities
│  │     │  │  │  │  ├─ lista-precio.entity.js
│  │     │  │  │  │  ├─ lista-precio.entity.js.map
│  │     │  │  │  │  ├─ precio.entity.js
│  │     │  │  │  │  └─ precio.entity.js.map
│  │     │  │  │  ├─ precios.controller.js
│  │     │  │  │  ├─ precios.controller.js.map
│  │     │  │  │  ├─ precios.module.js
│  │     │  │  │  ├─ precios.module.js.map
│  │     │  │  │  ├─ precios.service.js
│  │     │  │  │  └─ precios.service.js.map
│  │     │  │  ├─ products
│  │     │  │  │  ├─ entities
│  │     │  │  │  │  ├─ product.entity.js
│  │     │  │  │  │  └─ product.entity.js.map
│  │     │  │  │  ├─ products.controller.js
│  │     │  │  │  ├─ products.controller.js.map
│  │     │  │  │  ├─ products.module.js
│  │     │  │  │  ├─ products.module.js.map
│  │     │  │  │  ├─ products.service.js
│  │     │  │  │  └─ products.service.js.map
│  │     │  │  ├─ promociones
│  │     │  │  │  ├─ entities
│  │     │  │  │  │  ├─ campania.entity.js
│  │     │  │  │  │  ├─ campania.entity.js.map
│  │     │  │  │  │  ├─ producto-promocion.entity.js
│  │     │  │  │  │  └─ producto-promocion.entity.js.map
│  │     │  │  │  ├─ promociones.controller.js
│  │     │  │  │  ├─ promociones.controller.js.map
│  │     │  │  │  ├─ promociones.module.js
│  │     │  │  │  ├─ promociones.module.js.map
│  │     │  │  │  ├─ promociones.service.js
│  │     │  │  │  └─ promociones.service.js.map
│  │     │  │  ├─ rutero
│  │     │  │  │  ├─ entities
│  │     │  │  │  │  ├─ rutero-planificado.entity.js
│  │     │  │  │  │  └─ rutero-planificado.entity.js.map
│  │     │  │  │  ├─ rutero.controller.js
│  │     │  │  │  ├─ rutero.controller.js.map
│  │     │  │  │  ├─ rutero.module.js
│  │     │  │  │  ├─ rutero.module.js.map
│  │     │  │  │  ├─ rutero.service.js
│  │     │  │  │  └─ rutero.service.js.map
│  │     │  │  ├─ tsconfig.tsbuildinfo
│  │     │  │  └─ zonas
│  │     │  │     ├─ entities
│  │     │  │     │  ├─ zona.entity.js
│  │     │  │     │  └─ zona.entity.js.map
│  │     │  │     ├─ zonas.controller.js
│  │     │  │     ├─ zonas.controller.js.map
│  │     │  │     ├─ zonas.module.js
│  │     │  │     ├─ zonas.module.js.map
│  │     │  │     ├─ zonas.service.js
│  │     │  │     └─ zonas.service.js.map
│  │     │  ├─ Dockerfile
│  │     │  ├─ package-lock.json
│  │     │  ├─ package.json
│  │     │  ├─ README.md
│  │     │  ├─ src
│  │     │  │  ├─ app.module.ts
│  │     │  │  ├─ asignacion
│  │     │  │  │  ├─ asignacion.controller.ts
│  │     │  │  │  ├─ asignacion.module.ts
│  │     │  │  │  ├─ asignacion.service.ts
│  │     │  │  │  └─ entities
│  │     │  │  │     └─ asignacion-vendedores.entity.ts
│  │     │  │  ├─ auth
│  │     │  │  │  ├─ jwt.strategy.ts
│  │     │  │  │  ├─ roles.decorator.ts
│  │     │  │  │  └─ roles.guard.ts
│  │     │  │  ├─ categories
│  │     │  │  │  ├─ categories.controller.ts
│  │     │  │  │  ├─ categories.module.ts
│  │     │  │  │  ├─ categories.service.ts
│  │     │  │  │  └─ entities
│  │     │  │  │     └─ category.entity.ts
│  │     │  │  ├─ clientes
│  │     │  │  │  ├─ clientes.controller.ts
│  │     │  │  │  ├─ clientes.module.ts
│  │     │  │  │  ├─ clientes.service.ts
│  │     │  │  │  └─ entities
│  │     │  │  │     └─ cliente.entity.ts
│  │     │  │  ├─ main.ts
│  │     │  │  ├─ precios
│  │     │  │  │  ├─ dto
│  │     │  │  │  │  └─ asignar-precio.dto.ts
│  │     │  │  │  ├─ entities
│  │     │  │  │  │  ├─ lista-precio.entity.ts
│  │     │  │  │  │  └─ precio.entity.ts
│  │     │  │  │  ├─ precios.controller.ts
│  │     │  │  │  ├─ precios.module.ts
│  │     │  │  │  └─ precios.service.ts
│  │     │  │  ├─ products
│  │     │  │  │  ├─ entities
│  │     │  │  │  │  └─ product.entity.ts
│  │     │  │  │  ├─ products.controller.ts
│  │     │  │  │  ├─ products.module.ts
│  │     │  │  │  └─ products.service.ts
│  │     │  │  ├─ promociones
│  │     │  │  │  ├─ entities
│  │     │  │  │  │  ├─ campania.entity.ts
│  │     │  │  │  │  └─ producto-promocion.entity.ts
│  │     │  │  │  ├─ promociones.controller.ts
│  │     │  │  │  ├─ promociones.module.ts
│  │     │  │  │  └─ promociones.service.ts
│  │     │  │  ├─ rutero
│  │     │  │  │  ├─ entities
│  │     │  │  │  │  └─ rutero-planificado.entity.ts
│  │     │  │  │  ├─ rutero.controller.ts
│  │     │  │  │  ├─ rutero.module.ts
│  │     │  │  │  └─ rutero.service.ts
│  │     │  │  └─ zonas
│  │     │  │     ├─ entities
│  │     │  │     │  └─ zona.entity.ts
│  │     │  │     ├─ zonas.controller.ts
│  │     │  │     ├─ zonas.module.ts
│  │     │  │     └─ zonas.service.ts
│  │     │  └─ tsconfig.json
│  │     ├─ inventario
│  │     ├─ usuarios
│  │     │  ├─ .dockerignore
│  │     │  ├─ dist
│  │     │  │  ├─ app.module.js
│  │     │  │  ├─ app.module.js.map
│  │     │  │  ├─ auth
│  │     │  │  │  ├─ auth.controller.js
│  │     │  │  │  ├─ auth.controller.js.map
│  │     │  │  │  ├─ auth.module.js
│  │     │  │  │  ├─ auth.module.js.map
│  │     │  │  │  ├─ auth.service.js
│  │     │  │  │  ├─ auth.service.js.map
│  │     │  │  │  ├─ dto
│  │     │  │  │  │  ├─ create-usuario.dto.js
│  │     │  │  │  │  ├─ create-usuario.dto.js.map
│  │     │  │  │  │  ├─ login.dto.js
│  │     │  │  │  │  ├─ login.dto.js.map
│  │     │  │  │  │  ├─ refresh-token.dto.js
│  │     │  │  │  │  └─ refresh-token.dto.js.map
│  │     │  │  │  ├─ jwt.guard.js
│  │     │  │  │  └─ jwt.guard.js.map
│  │     │  │  ├─ entities
│  │     │  │  │  ├─ auth-auditoria.entity.js
│  │     │  │  │  ├─ auth-auditoria.entity.js.map
│  │     │  │  │  ├─ auth-token.entity.js
│  │     │  │  │  ├─ auth-token.entity.js.map
│  │     │  │  │  ├─ dispositivo.entity.js
│  │     │  │  │  ├─ dispositivo.entity.js.map
│  │     │  │  │  ├─ role.entity.js
│  │     │  │  │  ├─ role.entity.js.map
│  │     │  │  │  ├─ usuario.entity.js
│  │     │  │  │  └─ usuario.entity.js.map
│  │     │  │  ├─ main.js
│  │     │  │  ├─ main.js.map
│  │     │  │  └─ shared
│  │     │  │     ├─ redis.service.js
│  │     │  │     └─ redis.service.js.map
│  │     │  ├─ Dockerfile
│  │     │  ├─ package-lock.json
│  │     │  ├─ package.json
│  │     │  ├─ README.md
│  │     │  ├─ src
│  │     │  │  ├─ app.module.ts
│  │     │  │  ├─ auth
│  │     │  │  │  ├─ auth.controller.ts
│  │     │  │  │  ├─ auth.module.ts
│  │     │  │  │  ├─ auth.service.ts
│  │     │  │  │  ├─ dto
│  │     │  │  │  │  ├─ create-usuario.dto.ts
│  │     │  │  │  │  ├─ login.dto.ts
│  │     │  │  │  │  └─ refresh-token.dto.ts
│  │     │  │  │  └─ jwt.guard.ts
│  │     │  │  ├─ entities
│  │     │  │  │  ├─ auth-auditoria.entity.ts
│  │     │  │  │  ├─ auth-token.entity.ts
│  │     │  │  │  ├─ dispositivo.entity.ts
│  │     │  │  │  ├─ role.entity.ts
│  │     │  │  │  └─ usuario.entity.ts
│  │     │  │  ├─ main.ts
│  │     │  │  └─ shared
│  │     │  └─ tsconfig.json
│  │     └─ ventas
│  │        ├─ cloudrun.yaml
│  │        ├─ Dockerfile
│  │        ├─ package.json
│  │        ├─ src
│  │        │  ├─ app.module.ts
│  │        │  ├─ auth
│  │        │  ├─ common
│  │        │  ├─ config
│  │        │  ├─ main.ts
│  │        │  └─ ventas
│  │        │     ├─ dto
│  │        │     ├─ ventas.controller.ts
│  │        │     ├─ ventas.module.ts
│  │        │     └─ ventas.service.ts
│  │        ├─ test
│  │        └─ tsconfig.json
│  ├─ ci-cd
│  ├─ database
│  │  ├─ firestore.rules
│  │  ├─ migrations
│  │  └─ schemas
│  │     ├─ inventario.json
│  │     ├─ usuarios.json
│  │     └─ ventas.json
│  ├─ docker-compose.yml
│  ├─ docs
│  │  ├─ api-contracts.md
│  │  ├─ architecture.md
│  │  ├─ decisions
│  │  │  └─ adr-001-stack.md
│  │  ├─ diagrams
│  │  │  ├─ auth-flow.drawio
│  │  │  ├─ backend-sequence.puml
│  │  │  └─ system-context.drawio
│  │  ├─ frontend-quality.md
│  │  ├─ gcp-setup.md
│  │  └─ roles.md
│  ├─ frontend
│  │  ├─ mobile
│  │  │  ├─ .env.example
│  │  │  ├─ .expo
│  │  │  │  ├─ devices.json
│  │  │  │  ├─ README.md
│  │  │  │  └─ settings.json
│  │  │  ├─ app.json
│  │  │  ├─ App.tsx
│  │  │  ├─ assets
│  │  │  │  └─ logo.png
│  │  │  ├─ babel.config.js
│  │  │  ├─ eas.json
│  │  │  ├─ global.css
│  │  │  ├─ index.js
│  │  │  ├─ metro.config.js
│  │  │  ├─ nativewind-env.d.ts
│  │  │  ├─ package-lock.json
│  │  │  ├─ package.json
│  │  │  ├─ README.md
│  │  │  ├─ src
│  │  │  │  ├─ App.tsx
│  │  │  │  ├─ assets
│  │  │  │  │  └─ logo.ts
│  │  │  │  ├─ components
│  │  │  │  │  └─ ui
│  │  │  │  │     ├─ CartItemRow.tsx
│  │  │  │  │     ├─ CartSummary.tsx
│  │  │  │  │     ├─ CategoryFilter.tsx
│  │  │  │  │     ├─ DeliveryCard.tsx
│  │  │  │  │     ├─ EmptyState.tsx
│  │  │  │  │     ├─ ExpandableFab.tsx
│  │  │  │  │     ├─ GenericList.tsx
│  │  │  │  │     ├─ Header.tsx
│  │  │  │  │     ├─ InvoiceCard.tsx
│  │  │  │  │     ├─ LoadingScreen.tsx
│  │  │  │  │     ├─ OrderCard.tsx
│  │  │  │  │     ├─ PrimaryButton.tsx
│  │  │  │  │     ├─ ProductCard.tsx
│  │  │  │  │     ├─ SearchBar.tsx
│  │  │  │  │     ├─ Snackbar.tsx
│  │  │  │  │     ├─ TabNavigation.tsx
│  │  │  │  │     ├─ TextField.tsx
│  │  │  │  │     ├─ TicketCard.tsx
│  │  │  │  │     └─ Timeline.tsx
│  │  │  │  ├─ config
│  │  │  │  │  └─ env.ts
│  │  │  │  ├─ features
│  │  │  │  │  ├─ app
│  │  │  │  │  │  ├─ components
│  │  │  │  │  │  │  └─ RoleShell.tsx
│  │  │  │  │  │  └─ screens
│  │  │  │  │  │     └─ RoleSelectorScreen.tsx
│  │  │  │  │  ├─ auth
│  │  │  │  │  │  └─ screens
│  │  │  │  │  │     ├─ ForgotPasswordScreen.tsx
│  │  │  │  │  │     ├─ LoginScreen.tsx
│  │  │  │  │  │     ├─ RoleSelectorScreen.tsx
│  │  │  │  │  │     └─ SplashScreen.tsx
│  │  │  │  │  ├─ bodeguero
│  │  │  │  │  │  ├─ components
│  │  │  │  │  │  │  ├─ WarehouseDashboardComponents.tsx
│  │  │  │  │  │  │  └─ WarehouseOrderCard.tsx
│  │  │  │  │  │  └─ screens
│  │  │  │  │  │     ├─ BodegueroScreen.tsx
│  │  │  │  │  │     ├─ WarehouseDispatchScreen.tsx
│  │  │  │  │  │     ├─ WarehouseFabScreens.tsx
│  │  │  │  │  │     ├─ WarehouseHomeScreen.tsx
│  │  │  │  │  │     ├─ WarehouseInventoryScreen.tsx
│  │  │  │  │  │     ├─ WarehouseLotsScreen.tsx
│  │  │  │  │  │     ├─ WarehouseNotificationsScreen.tsx
│  │  │  │  │  │     ├─ WarehouseOrdersScreen.tsx
│  │  │  │  │  │     ├─ WarehousePreparationScreen.tsx
│  │  │  │  │  │     ├─ WarehouseProfileScreen.tsx
│  │  │  │  │  │     └─ WarehouseReturnsScreen.tsx
│  │  │  │  │  ├─ cliente
│  │  │  │  │  │  ├─ components
│  │  │  │  │  │  │  └─ DashboardComponents.tsx
│  │  │  │  │  │  └─ screens
│  │  │  │  │  │     ├─ ClientCartScreen.tsx
│  │  │  │  │  │     ├─ ClientCreateTicketScreen.tsx
│  │  │  │  │  │     ├─ ClienteScreen.tsx
│  │  │  │  │  │     ├─ ClientHomeScreen.tsx
│  │  │  │  │  │     ├─ ClientInvoiceDetailScreen.tsx
│  │  │  │  │  │     ├─ ClientInvoicesScreen.tsx
│  │  │  │  │  │     ├─ ClientNotificationsScreen.tsx
│  │  │  │  │  │     ├─ ClientOrderDetailScreen.tsx
│  │  │  │  │  │     ├─ ClientOrdersScreen.tsx
│  │  │  │  │  │     ├─ ClientProductListScreen.tsx
│  │  │  │  │  │     ├─ ClientProfileScreen.tsx
│  │  │  │  │  │     ├─ ClientPromotionsScreen.tsx
│  │  │  │  │  │     ├─ ClientReturnsScreen.tsx
│  │  │  │  │  │     ├─ ClientSupportScreen.tsx
│  │  │  │  │  │     └─ ClientTrackingScreen.tsx
│  │  │  │  │  ├─ shared
│  │  │  │  │  │  └─ screens
│  │  │  │  │  │     └─ PlaceholderScreen.tsx
│  │  │  │  │  ├─ supervisor
│  │  │  │  │  │  └─ screens
│  │  │  │  │  │     └─ SupervisorScreen.tsx
│  │  │  │  │  ├─ transportista
│  │  │  │  │  │  └─ screens
│  │  │  │  │  │     ├─ TransportistaDeliveriesScreen.tsx
│  │  │  │  │  │     ├─ TransportistaHomeScreen.tsx
│  │  │  │  │  │     ├─ TransportistaOrdersScreen.tsx
│  │  │  │  │  │     ├─ TransportistaPlaceholders.tsx
│  │  │  │  │  │     └─ TransportistaProfileScreen.tsx
│  │  │  │  │  └─ vendedor
│  │  │  │  │     └─ screens
│  │  │  │  │        ├─ SellerClientDetailScreen.tsx
│  │  │  │  │        ├─ SellerClientsScreen.tsx
│  │  │  │  │        ├─ SellerDeliveriesScreen.tsx
│  │  │  │  │        ├─ SellerHomeScreen.tsx
│  │  │  │  │        ├─ SellerInvoicesScreen.tsx
│  │  │  │  │        ├─ SellerNotificationsScreen.tsx
│  │  │  │  │        ├─ SellerOrderHistoryScreen.tsx
│  │  │  │  │        ├─ SellerOrderScreen.tsx
│  │  │  │  │        ├─ SellerProductsScreen.tsx
│  │  │  │  │        ├─ SellerProfileScreen.tsx
│  │  │  │  │        ├─ SellerPromotionsScreen.tsx
│  │  │  │  │        ├─ SellerReturnsScreen.tsx
│  │  │  │  │        └─ VendedorScreen.tsx
│  │  │  │  ├─ hooks
│  │  │  │  │  ├─ useCart.tsx
│  │  │  │  │  └─ useProducts.ts
│  │  │  │  ├─ navigation
│  │  │  │  │  ├─ ClientNavigator.tsx
│  │  │  │  │  ├─ SellerNavigator.tsx
│  │  │  │  │  ├─ TransportistaNavigator.tsx
│  │  │  │  │  ├─ types.ts
│  │  │  │  │  └─ WarehouseNavigator.tsx
│  │  │  │  ├─ services
│  │  │  │  │  ├─ api
│  │  │  │  │  │  ├─ ClientService.ts
│  │  │  │  │  │  ├─ http.ts
│  │  │  │  │  │  ├─ InvoiceService.ts
│  │  │  │  │  │  ├─ NotificationService.ts
│  │  │  │  │  │  ├─ OrderService.ts
│  │  │  │  │  │  ├─ ProductService.ts
│  │  │  │  │  │  ├─ ProfileService.ts
│  │  │  │  │  │  ├─ PromotionsService.ts
│  │  │  │  │  │  ├─ ReturnsService.ts
│  │  │  │  │  │  ├─ SellerService.ts
│  │  │  │  │  │  ├─ SupportService.ts
│  │  │  │  │  │  ├─ TransportistaService.ts
│  │  │  │  │  │  └─ WarehouseService.ts
│  │  │  │  │  └─ auth
│  │  │  │  │     └─ authClient.ts
│  │  │  │  ├─ storage
│  │  │  │  │  └─ authStorage.ts
│  │  │  │  ├─ theme
│  │  │  │  │  └─ colors.ts
│  │  │  │  ├─ types
│  │  │  │  │  └─ global.d.ts
│  │  │  │  └─ utils
│  │  │  │     └─ delay.ts
│  │  │  ├─ tailwind.config.js
│  │  │  └─ tsconfig.json
│  │  └─ web
│  │     ├─ .env.example
│  │     ├─ index.html
│  │     ├─ package-lock.json
│  │     ├─ package.json
│  │     ├─ public
│  │     │  └─ assets
│  │     │     └─ logo.png
│  │     ├─ README.md
│  │     ├─ src
│  │     │  ├─ App.tsx
│  │     │  ├─ components
│  │     │  │  ├─ layout
│  │     │  │  │  └─ RoleLayout.tsx
│  │     │  │  └─ ui
│  │     │  │     ├─ ActionButton.tsx
│  │     │  │     ├─ Alert.tsx
│  │     │  │     ├─ Badge.tsx
│  │     │  │     ├─ Button.tsx
│  │     │  │     ├─ Cards.tsx
│  │     │  │     ├─ DataTable.tsx
│  │     │  │     ├─ EmptyContent.tsx
│  │     │  │     ├─ FilterButton.tsx
│  │     │  │     ├─ FormField.tsx
│  │     │  │     ├─ InfoCard.tsx
│  │     │  │     ├─ LoadingSpinner.tsx
│  │     │  │     ├─ MessageBubble.tsx
│  │     │  │     ├─ Modal.tsx
│  │     │  │     ├─ PageHero.tsx
│  │     │  │     ├─ Pagination.tsx
│  │     │  │     ├─ ProductCard.tsx
│  │     │  │     ├─ SectionHeader.tsx
│  │     │  │     ├─ SidebarNav.tsx
│  │     │  │     ├─ StatCard.tsx
│  │     │  │     ├─ StatusBadge.tsx
│  │     │  │     └─ TextField.tsx
│  │     │  ├─ config
│  │     │  │  ├─ env.ts
│  │     │  │  └─ navigation.ts
│  │     │  ├─ context
│  │     │  │  └─ auth
│  │     │  │     └─ AuthContext.tsx
│  │     │  ├─ features
│  │     │  │  ├─ bodeguero
│  │     │  │  │  ├─ BodegueroPage.tsx
│  │     │  │  │  ├─ hooks
│  │     │  │  │  │  └─ useBodega.ts
│  │     │  │  │  ├─ pages
│  │     │  │  │  │  ├─ Dashboard
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ Despachos
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ Devoluciones
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ index.ts
│  │     │  │  │  │  ├─ Inventario
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ Lotes
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ Notificaciones
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ Pedidos
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ PedidosPendientes
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ Perfil
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ Recepciones
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ Reportes
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  └─ Trazabilidad
│  │     │  │  │  │     └─ index.tsx
│  │     │  │  │  ├─ services
│  │     │  │  │  │  └─ bodegaApi.ts
│  │     │  │  │  └─ types
│  │     │  │  │     └─ index.ts
│  │     │  │  ├─ cliente
│  │     │  │  │  ├─ cart
│  │     │  │  │  │  └─ CartContext.tsx
│  │     │  │  │  ├─ ClientePage.tsx
│  │     │  │  │  ├─ hooks
│  │     │  │  │  │  └─ useCliente.ts
│  │     │  │  │  ├─ pages
│  │     │  │  │  │  ├─ carrito
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ dashboard
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ devoluciones
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ entregas
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ facturas
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ index.ts
│  │     │  │  │  │  ├─ mensajes
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ notificaciones
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ pedidos
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ perfil
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ productos
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ promociones
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  └─ soporte
│  │     │  │  │  │     └─ index.tsx
│  │     │  │  │  ├─ services
│  │     │  │  │  │  └─ mensajes.ts
│  │     │  │  │  └─ types.ts
│  │     │  │  ├─ supervisor
│  │     │  │  │  ├─ pages
│  │     │  │  │  │  ├─ Alertas
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ Bodega
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ Clientes
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ Dashboard
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ Devoluciones
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ Entregas
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ index.ts
│  │     │  │  │  │  ├─ Pedidos
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ Perfil
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ Reportes
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  └─ Vendedores
│  │     │  │  │  │     └─ index.tsx
│  │     │  │  │  └─ SupervisorPage.tsx
│  │     │  │  ├─ transportista
│  │     │  │  │  ├─ pages
│  │     │  │  │  │  ├─ Devoluciones
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ Entregas
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ Historial
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ Inicio
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ Notificaciones
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ PedidosAsignados
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ Perfil
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  └─ Rutas
│  │     │  │  │  │     └─ index.tsx
│  │     │  │  │  └─ TransportistaPage.tsx
│  │     │  │  └─ vendedor
│  │     │  │     ├─ hooks
│  │     │  │     │  └─ useVendedor.ts
│  │     │  │     ├─ pages
│  │     │  │     │  ├─ Clientes
│  │     │  │     │  │  └─ index.tsx
│  │     │  │     │  ├─ CrearPedido
│  │     │  │     │  │  └─ index.tsx
│  │     │  │     │  ├─ Dashboard
│  │     │  │     │  │  └─ index.tsx
│  │     │  │     │  ├─ Devoluciones
│  │     │  │     │  │  └─ index.tsx
│  │     │  │     │  ├─ Entregas
│  │     │  │     │  │  └─ index.tsx
│  │     │  │     │  ├─ Facturas
│  │     │  │     │  │  └─ index.tsx
│  │     │  │     │  ├─ index.ts
│  │     │  │     │  ├─ Notificaciones
│  │     │  │     │  │  └─ index.tsx
│  │     │  │     │  ├─ Pedidos
│  │     │  │     │  │  └─ index.tsx
│  │     │  │     │  ├─ Perfil
│  │     │  │     │  │  └─ index.tsx
│  │     │  │     │  ├─ Productos
│  │     │  │     │  │  └─ index.tsx
│  │     │  │     │  ├─ Promociones
│  │     │  │     │  │  └─ index.tsx
│  │     │  │     │  └─ Reportes
│  │     │  │     │     └─ index.tsx
│  │     │  │     ├─ services
│  │     │  │     │  └─ vendedorApi.ts
│  │     │  │     └─ VendedorPage.tsx
│  │     │  ├─ hooks
│  │     │  │  └─ useAuth.ts
│  │     │  ├─ main.tsx
│  │     │  ├─ pages
│  │     │  │  ├─ app
│  │     │  │  │  ├─ AppIndexPage.tsx
│  │     │  │  │  └─ AppLayout.tsx
│  │     │  │  ├─ auth
│  │     │  │  │  ├─ ForgotPasswordPage.tsx
│  │     │  │  │  └─ LoginPage.tsx
│  │     │  │  └─ SplashPage.tsx
│  │     │  ├─ routes
│  │     │  │  ├─ AppRouter.tsx
│  │     │  │  └─ RequireAuth.tsx
│  │     │  ├─ services
│  │     │  │  ├─ api
│  │     │  │  │  └─ http.ts
│  │     │  │  ├─ auth
│  │     │  │  │  └─ authApi.ts
│  │     │  │  ├─ cliente
│  │     │  │  │  └─ index.ts
│  │     │  │  └─ storage
│  │     │  │     ├─ roleStorage.ts
│  │     │  │     └─ tokenStorage.ts
│  │     │  ├─ styles
│  │     │  │  └─ index.css
│  │     │  ├─ theme
│  │     │  │  └─ colors.ts
│  │     │  ├─ types
│  │     │  │  └─ roles.ts
│  │     │  ├─ utils
│  │     │  │  ├─ cn.ts
│  │     │  │  └─ statusHelpers.ts
│  │     │  └─ vite-env.d.ts
│  │     ├─ tailwind.config.js
│  │     ├─ tsconfig.json
│  │     └─ vite.config.ts
│  ├─ infra
│  │  ├─ gcloud-scripts
│  │  │  ├─ deploy-cloudrun.sh
│  │  │  ├─ deploy-frontend.sh
│  │  │  └─ init-project.sh
│  │  ├─ local-init
│  │  │  ├─ 01-init-dbs.sql
│  │  │  ├─ 02-init-ventas.sql
│  │  │  ├─ 03-init-inventario.sql
│  │  │  └─ 04-init-catalog.sql
│  │  └─ terraform
│  │     ├─ main.tf
│  │     ├─ outputs.tf
│  │     └─ variables.tf
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ README.md
│  ├─ security
│  │  ├─ auth-config
│  │  ├─ iam-policies
│  │  └─ vpc-firewalls
│  ├─ shared
│  │  ├─ constants
│  │  └─ types
│  │     ├─ brandColors.cjs
│  │     ├─ brandColors.json
│  │     ├─ index.d.ts
│  │     ├─ package.json
│  │     └─ src
│  │        ├─ auth
│  │        │  ├─ index.ts
│  │        │  ├─ schemas.ts
│  │        │  └─ types.ts
│  │        ├─ brand
│  │        │  ├─ colors.ts
│  │        │  └─ index.ts
│  │        └─ index.ts
│  └─ tests
│     ├─ e2e
│     └─ integration
└─ README.md

```
```
AplicacionCafrilosa
├─ aplicacion
│  ├─ .cache
│  │  └─ eslint
│  ├─ .editorconfig
│  ├─ .eslintignore
│  ├─ .eslintrc.cjs
│  ├─ .prettierignore
│  ├─ .prettierrc.json
│  ├─ backend
│  │  └─ services
│  │     ├─ catalog
│  │     │  ├─ .dockerignore
│  │     │  ├─ .eslintrc.js
│  │     │  ├─ .eslintrc.json
│  │     │  ├─ dist
│  │     │  │  ├─ app.module.js
│  │     │  │  ├─ app.module.js.map
│  │     │  │  ├─ asignacion
│  │     │  │  │  ├─ asignacion.controller.js
│  │     │  │  │  ├─ asignacion.controller.js.map
│  │     │  │  │  ├─ asignacion.module.js
│  │     │  │  │  ├─ asignacion.module.js.map
│  │     │  │  │  ├─ asignacion.service.js
│  │     │  │  │  ├─ asignacion.service.js.map
│  │     │  │  │  └─ entities
│  │     │  │  │     ├─ asignacion-vendedores.entity.js
│  │     │  │  │     └─ asignacion-vendedores.entity.js.map
│  │     │  │  ├─ auth
│  │     │  │  │  ├─ jwt.strategy.js
│  │     │  │  │  ├─ jwt.strategy.js.map
│  │     │  │  │  ├─ roles.decorator.js
│  │     │  │  │  ├─ roles.decorator.js.map
│  │     │  │  │  ├─ roles.guard.js
│  │     │  │  │  └─ roles.guard.js.map
│  │     │  │  ├─ categories
│  │     │  │  │  ├─ categories.controller.js
│  │     │  │  │  ├─ categories.controller.js.map
│  │     │  │  │  ├─ categories.module.js
│  │     │  │  │  ├─ categories.module.js.map
│  │     │  │  │  ├─ categories.service.js
│  │     │  │  │  ├─ categories.service.js.map
│  │     │  │  │  └─ entities
│  │     │  │  │     ├─ category.entity.js
│  │     │  │  │     └─ category.entity.js.map
│  │     │  │  ├─ clientes
│  │     │  │  │  ├─ clientes.controller.js
│  │     │  │  │  ├─ clientes.controller.js.map
│  │     │  │  │  ├─ clientes.module.js
│  │     │  │  │  ├─ clientes.module.js.map
│  │     │  │  │  ├─ clientes.service.js
│  │     │  │  │  ├─ clientes.service.js.map
│  │     │  │  │  └─ entities
│  │     │  │  │     ├─ cliente.entity.js
│  │     │  │  │     └─ cliente.entity.js.map
│  │     │  │  ├─ main.js
│  │     │  │  ├─ main.js.map
│  │     │  │  ├─ precios
│  │     │  │  │  ├─ dto
│  │     │  │  │  │  ├─ asignar-precio.dto.js
│  │     │  │  │  │  └─ asignar-precio.dto.js.map
│  │     │  │  │  ├─ entities
│  │     │  │  │  │  ├─ lista-precio.entity.js
│  │     │  │  │  │  ├─ lista-precio.entity.js.map
│  │     │  │  │  │  ├─ precio.entity.js
│  │     │  │  │  │  └─ precio.entity.js.map
│  │     │  │  │  ├─ precios.controller.js
│  │     │  │  │  ├─ precios.controller.js.map
│  │     │  │  │  ├─ precios.module.js
│  │     │  │  │  ├─ precios.module.js.map
│  │     │  │  │  ├─ precios.service.js
│  │     │  │  │  └─ precios.service.js.map
│  │     │  │  ├─ products
│  │     │  │  │  ├─ entities
│  │     │  │  │  │  ├─ product.entity.js
│  │     │  │  │  │  └─ product.entity.js.map
│  │     │  │  │  ├─ products.controller.js
│  │     │  │  │  ├─ products.controller.js.map
│  │     │  │  │  ├─ products.module.js
│  │     │  │  │  ├─ products.module.js.map
│  │     │  │  │  ├─ products.service.js
│  │     │  │  │  └─ products.service.js.map
│  │     │  │  ├─ promociones
│  │     │  │  │  ├─ entities
│  │     │  │  │  │  ├─ campania.entity.js
│  │     │  │  │  │  ├─ campania.entity.js.map
│  │     │  │  │  │  ├─ producto-promocion.entity.js
│  │     │  │  │  │  └─ producto-promocion.entity.js.map
│  │     │  │  │  ├─ promociones.controller.js
│  │     │  │  │  ├─ promociones.controller.js.map
│  │     │  │  │  ├─ promociones.module.js
│  │     │  │  │  ├─ promociones.module.js.map
│  │     │  │  │  ├─ promociones.service.js
│  │     │  │  │  └─ promociones.service.js.map
│  │     │  │  ├─ rutero
│  │     │  │  │  ├─ entities
│  │     │  │  │  │  ├─ rutero-planificado.entity.js
│  │     │  │  │  │  └─ rutero-planificado.entity.js.map
│  │     │  │  │  ├─ rutero.controller.js
│  │     │  │  │  ├─ rutero.controller.js.map
│  │     │  │  │  ├─ rutero.module.js
│  │     │  │  │  ├─ rutero.module.js.map
│  │     │  │  │  ├─ rutero.service.js
│  │     │  │  │  └─ rutero.service.js.map
│  │     │  │  ├─ tsconfig.tsbuildinfo
│  │     │  │  └─ zonas
│  │     │  │     ├─ entities
│  │     │  │     │  ├─ zona.entity.js
│  │     │  │     │  └─ zona.entity.js.map
│  │     │  │     ├─ zonas.controller.js
│  │     │  │     ├─ zonas.controller.js.map
│  │     │  │     ├─ zonas.module.js
│  │     │  │     ├─ zonas.module.js.map
│  │     │  │     ├─ zonas.service.js
│  │     │  │     └─ zonas.service.js.map
│  │     │  ├─ Dockerfile
│  │     │  ├─ package-lock.json
│  │     │  ├─ package.json
│  │     │  ├─ README.md
│  │     │  ├─ src
│  │     │  │  ├─ app.module.ts
│  │     │  │  ├─ asignacion
│  │     │  │  │  ├─ asignacion.controller.ts
│  │     │  │  │  ├─ asignacion.module.ts
│  │     │  │  │  ├─ asignacion.service.ts
│  │     │  │  │  └─ entities
│  │     │  │  │     └─ asignacion-vendedores.entity.ts
│  │     │  │  ├─ auth
│  │     │  │  │  ├─ jwt.strategy.ts
│  │     │  │  │  ├─ roles.decorator.ts
│  │     │  │  │  └─ roles.guard.ts
│  │     │  │  ├─ categories
│  │     │  │  │  ├─ categories.controller.ts
│  │     │  │  │  ├─ categories.module.ts
│  │     │  │  │  ├─ categories.service.ts
│  │     │  │  │  └─ entities
│  │     │  │  │     └─ category.entity.ts
│  │     │  │  ├─ clientes
│  │     │  │  │  ├─ clientes.controller.ts
│  │     │  │  │  ├─ clientes.module.ts
│  │     │  │  │  ├─ clientes.service.ts
│  │     │  │  │  └─ entities
│  │     │  │  │     └─ cliente.entity.ts
│  │     │  │  ├─ main.ts
│  │     │  │  ├─ precios
│  │     │  │  │  ├─ dto
│  │     │  │  │  │  └─ asignar-precio.dto.ts
│  │     │  │  │  ├─ entities
│  │     │  │  │  │  ├─ lista-precio.entity.ts
│  │     │  │  │  │  └─ precio.entity.ts
│  │     │  │  │  ├─ precios.controller.ts
│  │     │  │  │  ├─ precios.module.ts
│  │     │  │  │  └─ precios.service.ts
│  │     │  │  ├─ products
│  │     │  │  │  ├─ entities
│  │     │  │  │  │  └─ product.entity.ts
│  │     │  │  │  ├─ products.controller.ts
│  │     │  │  │  ├─ products.module.ts
│  │     │  │  │  └─ products.service.ts
│  │     │  │  ├─ promociones
│  │     │  │  │  ├─ entities
│  │     │  │  │  │  ├─ campania.entity.ts
│  │     │  │  │  │  └─ producto-promocion.entity.ts
│  │     │  │  │  ├─ promociones.controller.ts
│  │     │  │  │  ├─ promociones.module.ts
│  │     │  │  │  └─ promociones.service.ts
│  │     │  │  ├─ rutero
│  │     │  │  │  ├─ entities
│  │     │  │  │  │  └─ rutero-planificado.entity.ts
│  │     │  │  │  ├─ rutero.controller.ts
│  │     │  │  │  ├─ rutero.module.ts
│  │     │  │  │  └─ rutero.service.ts
│  │     │  │  └─ zonas
│  │     │  │     ├─ entities
│  │     │  │     │  └─ zona.entity.ts
│  │     │  │     ├─ zonas.controller.ts
│  │     │  │     ├─ zonas.module.ts
│  │     │  │     └─ zonas.service.ts
│  │     │  └─ tsconfig.json
│  │     ├─ inventario
│  │     ├─ usuarios
│  │     │  ├─ .dockerignore
│  │     │  ├─ dist
│  │     │  │  ├─ app.module.js
│  │     │  │  ├─ app.module.js.map
│  │     │  │  ├─ auth
│  │     │  │  │  ├─ auth.controller.js
│  │     │  │  │  ├─ auth.controller.js.map
│  │     │  │  │  ├─ auth.module.js
│  │     │  │  │  ├─ auth.module.js.map
│  │     │  │  │  ├─ auth.service.js
│  │     │  │  │  ├─ auth.service.js.map
│  │     │  │  │  ├─ dto
│  │     │  │  │  │  ├─ create-usuario.dto.js
│  │     │  │  │  │  ├─ create-usuario.dto.js.map
│  │     │  │  │  │  ├─ login.dto.js
│  │     │  │  │  │  ├─ login.dto.js.map
│  │     │  │  │  │  ├─ refresh-token.dto.js
│  │     │  │  │  │  └─ refresh-token.dto.js.map
│  │     │  │  │  ├─ jwt.guard.js
│  │     │  │  │  └─ jwt.guard.js.map
│  │     │  │  ├─ entities
│  │     │  │  │  ├─ auth-auditoria.entity.js
│  │     │  │  │  ├─ auth-auditoria.entity.js.map
│  │     │  │  │  ├─ auth-token.entity.js
│  │     │  │  │  ├─ auth-token.entity.js.map
│  │     │  │  │  ├─ dispositivo.entity.js
│  │     │  │  │  ├─ dispositivo.entity.js.map
│  │     │  │  │  ├─ role.entity.js
│  │     │  │  │  ├─ role.entity.js.map
│  │     │  │  │  ├─ usuario.entity.js
│  │     │  │  │  └─ usuario.entity.js.map
│  │     │  │  ├─ main.js
│  │     │  │  ├─ main.js.map
│  │     │  │  └─ shared
│  │     │  │     ├─ redis.service.js
│  │     │  │     └─ redis.service.js.map
│  │     │  ├─ Dockerfile
│  │     │  ├─ package-lock.json
│  │     │  ├─ package.json
│  │     │  ├─ README.md
│  │     │  ├─ src
│  │     │  │  ├─ app.module.ts
│  │     │  │  ├─ auth
│  │     │  │  │  ├─ auth.controller.ts
│  │     │  │  │  ├─ auth.module.ts
│  │     │  │  │  ├─ auth.service.ts
│  │     │  │  │  ├─ dto
│  │     │  │  │  │  ├─ create-usuario.dto.ts
│  │     │  │  │  │  ├─ login.dto.ts
│  │     │  │  │  │  └─ refresh-token.dto.ts
│  │     │  │  │  └─ jwt.guard.ts
│  │     │  │  ├─ entities
│  │     │  │  │  ├─ auth-auditoria.entity.ts
│  │     │  │  │  ├─ auth-token.entity.ts
│  │     │  │  │  ├─ dispositivo.entity.ts
│  │     │  │  │  ├─ role.entity.ts
│  │     │  │  │  └─ usuario.entity.ts
│  │     │  │  ├─ main.ts
│  │     │  │  └─ shared
│  │     │  └─ tsconfig.json
│  │     └─ ventas
│  │        ├─ cloudrun.yaml
│  │        ├─ Dockerfile
│  │        ├─ package.json
│  │        ├─ src
│  │        │  ├─ app.module.ts
│  │        │  ├─ auth
│  │        │  ├─ common
│  │        │  ├─ config
│  │        │  ├─ main.ts
│  │        │  └─ ventas
│  │        │     ├─ dto
│  │        │     ├─ ventas.controller.ts
│  │        │     ├─ ventas.module.ts
│  │        │     └─ ventas.service.ts
│  │        ├─ test
│  │        └─ tsconfig.json
│  ├─ ci-cd
│  ├─ database
│  │  ├─ firestore.rules
│  │  ├─ migrations
│  │  └─ schemas
│  │     ├─ inventario.json
│  │     ├─ usuarios.json
│  │     └─ ventas.json
│  ├─ docker-compose.yml
│  ├─ docs
│  │  ├─ api-contracts.md
│  │  ├─ architecture.md
│  │  ├─ decisions
│  │  │  └─ adr-001-stack.md
│  │  ├─ diagrams
│  │  │  ├─ auth-flow.drawio
│  │  │  ├─ backend-sequence.puml
│  │  │  └─ system-context.drawio
│  │  ├─ frontend-quality.md
│  │  ├─ gcp-setup.md
│  │  └─ roles.md
│  ├─ frontend
│  │  ├─ mobile
│  │  │  ├─ .env.example
│  │  │  ├─ .expo
│  │  │  │  ├─ devices.json
│  │  │  │  ├─ README.md
│  │  │  │  └─ settings.json
│  │  │  ├─ app.json
│  │  │  ├─ App.tsx
│  │  │  ├─ assets
│  │  │  │  └─ logo.png
│  │  │  ├─ babel.config.js
│  │  │  ├─ eas.json
│  │  │  ├─ global.css
│  │  │  ├─ index.js
│  │  │  ├─ metro.config.js
│  │  │  ├─ nativewind-env.d.ts
│  │  │  ├─ package-lock.json
│  │  │  ├─ package.json
│  │  │  ├─ README.md
│  │  │  ├─ src
│  │  │  │  ├─ App.tsx
│  │  │  │  ├─ assets
│  │  │  │  │  └─ logo.ts
│  │  │  │  ├─ components
│  │  │  │  │  └─ ui
│  │  │  │  │     ├─ CartItemRow.tsx
│  │  │  │  │     ├─ CartSummary.tsx
│  │  │  │  │     ├─ CategoryFilter.tsx
│  │  │  │  │     ├─ DeliveryCard.tsx
│  │  │  │  │     ├─ EmptyState.tsx
│  │  │  │  │     ├─ ExpandableFab.tsx
│  │  │  │  │     ├─ GenericList.tsx
│  │  │  │  │     ├─ Header.tsx
│  │  │  │  │     ├─ InvoiceCard.tsx
│  │  │  │  │     ├─ LoadingScreen.tsx
│  │  │  │  │     ├─ OrderCard.tsx
│  │  │  │  │     ├─ PrimaryButton.tsx
│  │  │  │  │     ├─ ProductCard.tsx
│  │  │  │  │     ├─ SearchBar.tsx
│  │  │  │  │     ├─ Snackbar.tsx
│  │  │  │  │     ├─ TabNavigation.tsx
│  │  │  │  │     ├─ TextField.tsx
│  │  │  │  │     ├─ TicketCard.tsx
│  │  │  │  │     └─ Timeline.tsx
│  │  │  │  ├─ config
│  │  │  │  │  └─ env.ts
│  │  │  │  ├─ features
│  │  │  │  │  ├─ app
│  │  │  │  │  │  ├─ components
│  │  │  │  │  │  │  └─ RoleShell.tsx
│  │  │  │  │  │  └─ screens
│  │  │  │  │  │     └─ RoleSelectorScreen.tsx
│  │  │  │  │  ├─ auth
│  │  │  │  │  │  └─ screens
│  │  │  │  │  │     ├─ ForgotPasswordScreen.tsx
│  │  │  │  │  │     ├─ LoginScreen.tsx
│  │  │  │  │  │     ├─ RoleSelectorScreen.tsx
│  │  │  │  │  │     └─ SplashScreen.tsx
│  │  │  │  │  ├─ bodeguero
│  │  │  │  │  │  ├─ components
│  │  │  │  │  │  │  ├─ WarehouseDashboardComponents.tsx
│  │  │  │  │  │  │  └─ WarehouseOrderCard.tsx
│  │  │  │  │  │  └─ screens
│  │  │  │  │  │     ├─ BodegueroScreen.tsx
│  │  │  │  │  │     ├─ WarehouseDispatchScreen.tsx
│  │  │  │  │  │     ├─ WarehouseFabScreens.tsx
│  │  │  │  │  │     ├─ WarehouseHomeScreen.tsx
│  │  │  │  │  │     ├─ WarehouseInventoryScreen.tsx
│  │  │  │  │  │     ├─ WarehouseLotsScreen.tsx
│  │  │  │  │  │     ├─ WarehouseNotificationsScreen.tsx
│  │  │  │  │  │     ├─ WarehouseOrdersScreen.tsx
│  │  │  │  │  │     ├─ WarehousePreparationScreen.tsx
│  │  │  │  │  │     ├─ WarehouseProfileScreen.tsx
│  │  │  │  │  │     └─ WarehouseReturnsScreen.tsx
│  │  │  │  │  ├─ cliente
│  │  │  │  │  │  ├─ components
│  │  │  │  │  │  │  └─ DashboardComponents.tsx
│  │  │  │  │  │  └─ screens
│  │  │  │  │  │     ├─ ClientCartScreen.tsx
│  │  │  │  │  │     ├─ ClientCreateTicketScreen.tsx
│  │  │  │  │  │     ├─ ClienteScreen.tsx
│  │  │  │  │  │     ├─ ClientHomeScreen.tsx
│  │  │  │  │  │     ├─ ClientInvoiceDetailScreen.tsx
│  │  │  │  │  │     ├─ ClientInvoicesScreen.tsx
│  │  │  │  │  │     ├─ ClientNotificationsScreen.tsx
│  │  │  │  │  │     ├─ ClientOrderDetailScreen.tsx
│  │  │  │  │  │     ├─ ClientOrdersScreen.tsx
│  │  │  │  │  │     ├─ ClientProductListScreen.tsx
│  │  │  │  │  │     ├─ ClientProfileScreen.tsx
│  │  │  │  │  │     ├─ ClientPromotionsScreen.tsx
│  │  │  │  │  │     ├─ ClientReturnsScreen.tsx
│  │  │  │  │  │     ├─ ClientSupportScreen.tsx
│  │  │  │  │  │     └─ ClientTrackingScreen.tsx
│  │  │  │  │  ├─ shared
│  │  │  │  │  │  └─ screens
│  │  │  │  │  │     └─ PlaceholderScreen.tsx
│  │  │  │  │  ├─ supervisor
│  │  │  │  │  │  └─ screens
│  │  │  │  │  │     └─ SupervisorScreen.tsx
│  │  │  │  │  ├─ transportista
│  │  │  │  │  │  └─ screens
│  │  │  │  │  │     ├─ TransportistaDeliveriesScreen.tsx
│  │  │  │  │  │     ├─ TransportistaHomeScreen.tsx
│  │  │  │  │  │     ├─ TransportistaOrdersScreen.tsx
│  │  │  │  │  │     ├─ TransportistaPlaceholders.tsx
│  │  │  │  │  │     └─ TransportistaProfileScreen.tsx
│  │  │  │  │  └─ vendedor
│  │  │  │  │     └─ screens
│  │  │  │  │        ├─ SellerClientDetailScreen.tsx
│  │  │  │  │        ├─ SellerClientsScreen.tsx
│  │  │  │  │        ├─ SellerDeliveriesScreen.tsx
│  │  │  │  │        ├─ SellerHomeScreen.tsx
│  │  │  │  │        ├─ SellerInvoicesScreen.tsx
│  │  │  │  │        ├─ SellerNotificationsScreen.tsx
│  │  │  │  │        ├─ SellerOrderHistoryScreen.tsx
│  │  │  │  │        ├─ SellerOrderScreen.tsx
│  │  │  │  │        ├─ SellerProductsScreen.tsx
│  │  │  │  │        ├─ SellerProfileScreen.tsx
│  │  │  │  │        ├─ SellerPromotionsScreen.tsx
│  │  │  │  │        ├─ SellerReturnsScreen.tsx
│  │  │  │  │        └─ VendedorScreen.tsx
│  │  │  │  ├─ hooks
│  │  │  │  │  ├─ useCart.tsx
│  │  │  │  │  └─ useProducts.ts
│  │  │  │  ├─ navigation
│  │  │  │  │  ├─ ClientNavigator.tsx
│  │  │  │  │  ├─ SellerNavigator.tsx
│  │  │  │  │  ├─ TransportistaNavigator.tsx
│  │  │  │  │  ├─ types.ts
│  │  │  │  │  └─ WarehouseNavigator.tsx
│  │  │  │  ├─ services
│  │  │  │  │  ├─ api
│  │  │  │  │  │  ├─ ClientService.ts
│  │  │  │  │  │  ├─ http.ts
│  │  │  │  │  │  ├─ InvoiceService.ts
│  │  │  │  │  │  ├─ NotificationService.ts
│  │  │  │  │  │  ├─ OrderService.ts
│  │  │  │  │  │  ├─ ProductService.ts
│  │  │  │  │  │  ├─ ProfileService.ts
│  │  │  │  │  │  ├─ PromotionsService.ts
│  │  │  │  │  │  ├─ ReturnsService.ts
│  │  │  │  │  │  ├─ SellerService.ts
│  │  │  │  │  │  ├─ SupportService.ts
│  │  │  │  │  │  ├─ TransportistaService.ts
│  │  │  │  │  │  └─ WarehouseService.ts
│  │  │  │  │  └─ auth
│  │  │  │  │     └─ authClient.ts
│  │  │  │  ├─ storage
│  │  │  │  │  └─ authStorage.ts
│  │  │  │  ├─ theme
│  │  │  │  │  └─ colors.ts
│  │  │  │  ├─ types
│  │  │  │  │  └─ global.d.ts
│  │  │  │  └─ utils
│  │  │  │     └─ delay.ts
│  │  │  ├─ tailwind.config.js
│  │  │  └─ tsconfig.json
│  │  └─ web
│  │     ├─ .env.example
│  │     ├─ index.html
│  │     ├─ package-lock.json
│  │     ├─ package.json
│  │     ├─ public
│  │     │  └─ assets
│  │     │     └─ logo.png
│  │     ├─ README.md
│  │     ├─ src
│  │     │  ├─ App.tsx
│  │     │  ├─ components
│  │     │  │  ├─ layout
│  │     │  │  │  └─ RoleLayout.tsx
│  │     │  │  └─ ui
│  │     │  │     ├─ ActionButton.tsx
│  │     │  │     ├─ Alert.tsx
│  │     │  │     ├─ Badge.tsx
│  │     │  │     ├─ Button.tsx
│  │     │  │     ├─ Cards.tsx
│  │     │  │     ├─ DataTable.tsx
│  │     │  │     ├─ EmptyContent.tsx
│  │     │  │     ├─ FilterButton.tsx
│  │     │  │     ├─ FormField.tsx
│  │     │  │     ├─ InfoCard.tsx
│  │     │  │     ├─ LoadingSpinner.tsx
│  │     │  │     ├─ MessageBubble.tsx
│  │     │  │     ├─ Modal.tsx
│  │     │  │     ├─ PageHero.tsx
│  │     │  │     ├─ Pagination.tsx
│  │     │  │     ├─ ProductCard.tsx
│  │     │  │     ├─ SectionHeader.tsx
│  │     │  │     ├─ SidebarNav.tsx
│  │     │  │     ├─ StatCard.tsx
│  │     │  │     ├─ StatusBadge.tsx
│  │     │  │     └─ TextField.tsx
│  │     │  ├─ config
│  │     │  │  ├─ env.ts
│  │     │  │  └─ navigation.ts
│  │     │  ├─ context
│  │     │  │  └─ auth
│  │     │  │     └─ AuthContext.tsx
│  │     │  ├─ features
│  │     │  │  ├─ bodeguero
│  │     │  │  │  ├─ BodegueroPage.tsx
│  │     │  │  │  ├─ hooks
│  │     │  │  │  │  └─ useBodega.ts
│  │     │  │  │  ├─ pages
│  │     │  │  │  │  ├─ Dashboard
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ Despachos
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ Devoluciones
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ index.ts
│  │     │  │  │  │  ├─ Inventario
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ Lotes
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ Notificaciones
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ Pedidos
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ PedidosPendientes
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ Perfil
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ Recepciones
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ Reportes
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  └─ Trazabilidad
│  │     │  │  │  │     └─ index.tsx
│  │     │  │  │  ├─ services
│  │     │  │  │  │  └─ bodegaApi.ts
│  │     │  │  │  └─ types
│  │     │  │  │     └─ index.ts
│  │     │  │  ├─ cliente
│  │     │  │  │  ├─ cart
│  │     │  │  │  │  └─ CartContext.tsx
│  │     │  │  │  ├─ ClientePage.tsx
│  │     │  │  │  ├─ hooks
│  │     │  │  │  │  └─ useCliente.ts
│  │     │  │  │  ├─ pages
│  │     │  │  │  │  ├─ carrito
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ dashboard
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ devoluciones
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ entregas
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ facturas
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ index.ts
│  │     │  │  │  │  ├─ mensajes
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ notificaciones
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ pedidos
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ perfil
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ productos
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ promociones
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  └─ soporte
│  │     │  │  │  │     └─ index.tsx
│  │     │  │  │  ├─ services
│  │     │  │  │  │  └─ mensajes.ts
│  │     │  │  │  └─ types.ts
│  │     │  │  ├─ supervisor
│  │     │  │  │  ├─ pages
│  │     │  │  │  │  ├─ Alertas
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ Bodega
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ Clientes
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ Dashboard
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ Devoluciones
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ Entregas
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ index.ts
│  │     │  │  │  │  ├─ Pedidos
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ Perfil
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ Reportes
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  └─ Vendedores
│  │     │  │  │  │     └─ index.tsx
│  │     │  │  │  └─ SupervisorPage.tsx
│  │     │  │  ├─ transportista
│  │     │  │  │  ├─ pages
│  │     │  │  │  │  ├─ Devoluciones
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ Entregas
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ Historial
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ Inicio
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ Notificaciones
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ PedidosAsignados
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  ├─ Perfil
│  │     │  │  │  │  │  └─ index.tsx
│  │     │  │  │  │  └─ Rutas
│  │     │  │  │  │     └─ index.tsx
│  │     │  │  │  └─ TransportistaPage.tsx
│  │     │  │  └─ vendedor
│  │     │  │     ├─ hooks
│  │     │  │     │  └─ useVendedor.ts
│  │     │  │     ├─ pages
│  │     │  │     │  ├─ Clientes
│  │     │  │     │  │  └─ index.tsx
│  │     │  │     │  ├─ CrearPedido
│  │     │  │     │  │  └─ index.tsx
│  │     │  │     │  ├─ Dashboard
│  │     │  │     │  │  └─ index.tsx
│  │     │  │     │  ├─ Devoluciones
│  │     │  │     │  │  └─ index.tsx
│  │     │  │     │  ├─ Entregas
│  │     │  │     │  │  └─ index.tsx
│  │     │  │     │  ├─ Facturas
│  │     │  │     │  │  └─ index.tsx
│  │     │  │     │  ├─ index.ts
│  │     │  │     │  ├─ Notificaciones
│  │     │  │     │  │  └─ index.tsx
│  │     │  │     │  ├─ Pedidos
│  │     │  │     │  │  └─ index.tsx
│  │     │  │     │  ├─ Perfil
│  │     │  │     │  │  └─ index.tsx
│  │     │  │     │  ├─ Productos
│  │     │  │     │  │  └─ index.tsx
│  │     │  │     │  ├─ Promociones
│  │     │  │     │  │  └─ index.tsx
│  │     │  │     │  └─ Reportes
│  │     │  │     │     └─ index.tsx
│  │     │  │     ├─ services
│  │     │  │     │  └─ vendedorApi.ts
│  │     │  │     └─ VendedorPage.tsx
│  │     │  ├─ hooks
│  │     │  │  └─ useAuth.ts
│  │     │  ├─ main.tsx
│  │     │  ├─ pages
│  │     │  │  ├─ app
│  │     │  │  │  ├─ AppIndexPage.tsx
│  │     │  │  │  └─ AppLayout.tsx
│  │     │  │  ├─ auth
│  │     │  │  │  ├─ ForgotPasswordPage.tsx
│  │     │  │  │  └─ LoginPage.tsx
│  │     │  │  └─ SplashPage.tsx
│  │     │  ├─ routes
│  │     │  │  ├─ AppRouter.tsx
│  │     │  │  └─ RequireAuth.tsx
│  │     │  ├─ services
│  │     │  │  ├─ api
│  │     │  │  │  └─ http.ts
│  │     │  │  ├─ auth
│  │     │  │  │  └─ authApi.ts
│  │     │  │  ├─ cliente
│  │     │  │  │  └─ index.ts
│  │     │  │  └─ storage
│  │     │  │     ├─ roleStorage.ts
│  │     │  │     └─ tokenStorage.ts
│  │     │  ├─ styles
│  │     │  │  └─ index.css
│  │     │  ├─ theme
│  │     │  │  └─ colors.ts
│  │     │  ├─ types
│  │     │  │  └─ roles.ts
│  │     │  ├─ utils
│  │     │  │  ├─ cn.ts
│  │     │  │  └─ statusHelpers.ts
│  │     │  └─ vite-env.d.ts
│  │     ├─ tailwind.config.js
│  │     ├─ tsconfig.json
│  │     └─ vite.config.ts
│  ├─ infra
│  │  ├─ gcloud-scripts
│  │  │  ├─ deploy-cloudrun.sh
│  │  │  ├─ deploy-frontend.sh
│  │  │  └─ init-project.sh
│  │  ├─ local-init
│  │  │  ├─ 01-init-dbs.sql
│  │  │  ├─ 02-init-ventas.sql
│  │  │  ├─ 03-init-inventario.sql
│  │  │  └─ 04-init-catalog.sql
│  │  └─ terraform
│  │     ├─ main.tf
│  │     ├─ outputs.tf
│  │     └─ variables.tf
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ README.md
│  ├─ security
│  │  ├─ auth-config
│  │  ├─ iam-policies
│  │  └─ vpc-firewalls
│  ├─ shared
│  │  ├─ constants
│  │  └─ types
│  │     ├─ brandColors.cjs
│  │     ├─ brandColors.json
│  │     ├─ index.d.ts
│  │     ├─ package.json
│  │     └─ src
│  │        ├─ auth
│  │        │  ├─ index.ts
│  │        │  ├─ schemas.ts
│  │        │  └─ types.ts
│  │        ├─ brand
│  │        │  ├─ colors.ts
│  │        │  └─ index.ts
│  │        └─ index.ts
│  └─ tests
│     ├─ e2e
│     └─ integration
└─ README.md

```
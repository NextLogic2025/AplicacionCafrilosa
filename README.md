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
│  ├─ backend
│  │  └─ services
│  │     ├─ auth
│  │     │  ├─ .dockerignore
│  │     │  ├─ .eslintrc.js
│  │     │  ├─ .eslintrc.json
│  │     │  ├─ Dockerfile
│  │     │  ├─ package-lock.json
│  │     │  ├─ package.json
│  │     │  ├─ src
│  │     │  │  ├─ app.module.ts
│  │     │  │  ├─ auth
│  │     │  │  │  ├─ auth.controller.ts
│  │     │  │  │  ├─ auth.module.ts
│  │     │  │  │  ├─ auth.service.ts
│  │     │  │  │  ├─ dto
│  │     │  │  │  │  ├─ create-usuario.dto.ts
│  │     │  │  │  │  ├─ index.ts
│  │     │  │  │  │  ├─ login.dto.ts
│  │     │  │  │  │  └─ refresh-token.dto.ts
│  │     │  │  │  ├─ jwt.guard.ts
│  │     │  │  │  ├─ roles.decorator.ts
│  │     │  │  │  └─ roles.guard.ts
│  │     │  │  ├─ entities
│  │     │  │  │  ├─ auth-auditoria.entity.ts
│  │     │  │  │  ├─ auth-token.entity.ts
│  │     │  │  │  ├─ dispositivo.entity.ts
│  │     │  │  │  ├─ role.entity.ts
│  │     │  │  │  └─ usuario.entity.ts
│  │     │  │  └─ main.ts
│  │     │  └─ tsconfig.json
│  │     ├─ catalog
│  │     │  ├─ .dockerignore
│  │     │  ├─ .eslintrc.js
│  │     │  ├─ .eslintrc.json
│  │     │  ├─ Catalogo_README.md
│  │     │  ├─ Dockerfile
│  │     │  ├─ package-lock.json
│  │     │  ├─ package.json
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
│  │     │  │  │  ├─ entities
│  │     │  │  │  │  └─ cliente.entity.ts
│  │     │  │  │  └─ sucursales
│  │     │  │  │     ├─ dto
│  │     │  │  │     │  ├─ create-sucursal.dto.ts
│  │     │  │  │     │  └─ update-sucursal.dto.ts
│  │     │  │  │     ├─ entities
│  │     │  │  │     │  └─ sucursal.entity.ts
│  │     │  │  │     ├─ sucursales.controller.ts
│  │     │  │  │     ├─ sucursales.module.ts
│  │     │  │  │     └─ sucursales.service.ts
│  │     │  │  ├─ main.ts
│  │     │  │  ├─ precios
│  │     │  │  │  ├─ dto
│  │     │  │  │  │  ├─ create-lista-precio.dto.ts
│  │     │  │  │  │  └─ create-precio.dto.ts
│  │     │  │  │  ├─ entities
│  │     │  │  │  │  ├─ lista-precio.entity.ts
│  │     │  │  │  │  └─ precio.entity.ts
│  │     │  │  │  ├─ precios.controller.ts
│  │     │  │  │  ├─ precios.module.ts
│  │     │  │  │  └─ precios.service.ts
│  │     │  │  ├─ precios.rar
│  │     │  │  ├─ products
│  │     │  │  │  ├─ dto
│  │     │  │  │  │  └─ create-product.dto.ts
│  │     │  │  │  ├─ entities
│  │     │  │  │  │  └─ product.entity.ts
│  │     │  │  │  ├─ products.controller.ts
│  │     │  │  │  ├─ products.module.ts
│  │     │  │  │  └─ products.service.ts
│  │     │  │  ├─ promociones
│  │     │  │  │  ├─ dto
│  │     │  │  │  │  ├─ asign-cliente-promo.dto.ts
│  │     │  │  │  │  ├─ asign-producto-promo.dto.ts
│  │     │  │  │  │  ├─ create-campania.dto.ts
│  │     │  │  │  │  └─ update-campania.dto.ts
│  │     │  │  │  ├─ entities
│  │     │  │  │  │  ├─ campania.entity.ts
│  │     │  │  │  │  ├─ producto-promocion.entity.ts
│  │     │  │  │  │  └─ promocion-cliente-permitido.entity.ts
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
│  │     ├─ orders
│  │     │  ├─ .dockerignore
│  │     │  ├─ .eslintrc.js
│  │     │  ├─ .eslintrc.json
│  │     │  ├─ Dockerfile
│  │     │  ├─ Orders_README.md
│  │     │  ├─ package-lock.json
│  │     │  ├─ package.json
│  │     │  ├─ src
│  │     │  │  ├─ app.module.ts
│  │     │  │  ├─ auth
│  │     │  │  │  ├─ auth.module.ts
│  │     │  │  │  ├─ jwt.strategy.ts
│  │     │  │  │  ├─ roles.decorator.ts
│  │     │  │  │  └─ roles.guard.ts
│  │     │  │  ├─ main.ts
│  │     │  │  └─ orders
│  │     │  │     ├─ entities
│  │     │  │     │  ├─ carrito-cabecera.entity.ts
│  │     │  │     │  ├─ carrito-item.entity.ts
│  │     │  │     │  ├─ detalle-pedido.entity.ts
│  │     │  │     │  ├─ estado-pedido.entity.ts
│  │     │  │     │  ├─ historial-estado.entity.ts
│  │     │  │     │  └─ pedido.entity.ts
│  │     │  │     ├─ orders.controller.ts
│  │     │  │     ├─ orders.module.ts
│  │     │  │     └─ orders.service.ts
│  │     │  └─ tsconfig.json
│  │     ├─ usuarios
│  │     │  ├─ .dockerignore
│  │     │  ├─ Dockerfile
│  │     │  ├─ package-lock.json
│  │     │  ├─ package.json
│  │     │  ├─ src
│  │     │  │  ├─ app.module.ts
│  │     │  │  ├─ auth
│  │     │  │  │  ├─ auth.controller.ts
│  │     │  │  │  ├─ auth.module.ts
│  │     │  │  │  ├─ auth.service.ts
│  │     │  │  │  ├─ dto
│  │     │  │  │  │  └─ update-usuario.dto.ts
│  │     │  │  │  ├─ jwt.guard.ts
│  │     │  │  │  ├─ roles.decorator.ts
│  │     │  │  │  └─ roles.guard.ts
│  │     │  │  ├─ entities
│  │     │  │  │  ├─ role.entity.ts
│  │     │  │  │  └─ usuario.entity.ts
│  │     │  │  └─ main.ts
│  │     │  ├─ tsconfig.json
│  │     │  └─ Usuario_README.md
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
│  │  │  ├─ .env
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
│  │  │  │  ├─ app.d.ts
│  │  │  │  ├─ App.tsx
│  │  │  │  ├─ assets
│  │  │  │  │  └─ logo.ts
│  │  │  │  ├─ components
│  │  │  │  │  ├─ profile
│  │  │  │  │  │  └─ UserProfileTemplate.tsx
│  │  │  │  │  └─ ui
│  │  │  │  │     ├─ BadgeSelector.tsx
│  │  │  │  │     ├─ CartItemRow.tsx
│  │  │  │  │     ├─ CartSummary.tsx
│  │  │  │  │     ├─ CategoryFilter.tsx
│  │  │  │  │     ├─ ClientProductCard.tsx
│  │  │  │  │     ├─ DeliveryCard.tsx
│  │  │  │  │     ├─ EmptyState.tsx
│  │  │  │  │     ├─ ExpandableFab.tsx
│  │  │  │  │     ├─ FeedbackModal.tsx
│  │  │  │  │     ├─ GenericItemCard.tsx
│  │  │  │  │     ├─ GenericList.tsx
│  │  │  │  │     ├─ GenericModal.tsx
│  │  │  │  │     ├─ GenericTabs.tsx
│  │  │  │  │     ├─ Header.tsx
│  │  │  │  │     ├─ InfoCard.tsx
│  │  │  │  │     ├─ InvoiceCard.tsx
│  │  │  │  │     ├─ KpiCard.tsx
│  │  │  │  │     ├─ LoadingScreen.tsx
│  │  │  │  │     ├─ OrderCard.tsx
│  │  │  │  │     ├─ PrimaryButton.tsx
│  │  │  │  │     ├─ ProductCard.tsx
│  │  │  │  │     ├─ ProductPriceDisplay.tsx
│  │  │  │  │     ├─ QuickActionsGrid.tsx
│  │  │  │  │     ├─ SearchBar.tsx
│  │  │  │  │     ├─ SectionHeader.tsx
│  │  │  │  │     ├─ Snackbar.tsx
│  │  │  │  │     ├─ StatusBadge.tsx
│  │  │  │  │     ├─ TabNavigation.tsx
│  │  │  │  │     ├─ TextField.tsx
│  │  │  │  │     ├─ TicketCard.tsx
│  │  │  │  │     ├─ Timeline.tsx
│  │  │  │  │     └─ ToastNotification.tsx
│  │  │  │  ├─ config
│  │  │  │  │  └─ env.ts
│  │  │  │  ├─ context
│  │  │  │  │  └─ ToastContext.tsx
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
│  │  │  │  │  │     ├─ ClientProductDetailScreen.tsx
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
│  │  │  │  │  │  ├─ adapters
│  │  │  │  │  │  │  └─ DashboardAdapter.ts
│  │  │  │  │  │  ├─ components
│  │  │  │  │  │  │  ├─ ClientWizardStep1.tsx
│  │  │  │  │  │  │  ├─ ClientWizardStep2.tsx
│  │  │  │  │  │  │  ├─ ClientWizardStep3.tsx
│  │  │  │  │  │  │  ├─ RouteItemEditModal.tsx
│  │  │  │  │  │  │  ├─ RoutePlanningList.tsx
│  │  │  │  │  │  │  ├─ RoutePlanningMap.tsx
│  │  │  │  │  │  │  ├─ SavedRoutesSummary.tsx
│  │  │  │  │  │  │  └─ WizardProgress.tsx
│  │  │  │  │  │  └─ screens
│  │  │  │  │  │     ├─ SupervisorAlertsScreen.tsx
│  │  │  │  │  │     ├─ SupervisorAuditScreen.tsx
│  │  │  │  │  │     ├─ SupervisorCatalogScreen.tsx
│  │  │  │  │  │     ├─ SupervisorCategoriesScreen.tsx
│  │  │  │  │  │     ├─ SupervisorClientFormScreen.tsx
│  │  │  │  │  │     ├─ SupervisorClientsScreen.tsx
│  │  │  │  │  │     ├─ SupervisorDashboardScreen.tsx
│  │  │  │  │  │     ├─ SupervisorDeliveriesScreen.tsx
│  │  │  │  │  │     ├─ SupervisorOrdersScreen.tsx
│  │  │  │  │  │     ├─ SupervisorPriceListsScreen.tsx
│  │  │  │  │  │     ├─ SupervisorProductDetailScreen.tsx
│  │  │  │  │  │     ├─ SupervisorProductFormScreen.tsx
│  │  │  │  │  │     ├─ SupervisorProfileScreen.tsx
│  │  │  │  │  │     ├─ SupervisorPromotionFormScreen.tsx
│  │  │  │  │  │     ├─ SupervisorPromotionsScreen.tsx
│  │  │  │  │  │     ├─ SupervisorReportsScreen.tsx
│  │  │  │  │  │     ├─ SupervisorReturnsScreen.tsx
│  │  │  │  │  │     ├─ SupervisorRoutesScreen.tsx
│  │  │  │  │  │     ├─ SupervisorTeamDetailScreen.tsx
│  │  │  │  │  │     ├─ SupervisorTeamScreen.tsx
│  │  │  │  │  │     ├─ SupervisorWarehouseScreen.tsx
│  │  │  │  │  │     ├─ SupervisorZoneDetailScreen.tsx
│  │  │  │  │  │     ├─ SupervisorZoneMapScreen.tsx
│  │  │  │  │  │     └─ SupervisorZonesScreen.tsx
│  │  │  │  │  ├─ transportista
│  │  │  │  │  │  └─ screens
│  │  │  │  │  │     ├─ TransportistaDeliveriesScreen.tsx
│  │  │  │  │  │     ├─ TransportistaHistoryScreen.tsx
│  │  │  │  │  │     ├─ TransportistaHomeScreen.tsx
│  │  │  │  │  │     ├─ TransportistaNotificationsScreen.tsx
│  │  │  │  │  │     ├─ TransportistaOrderDetailScreen.tsx
│  │  │  │  │  │     ├─ TransportistaOrdersScreen.tsx
│  │  │  │  │  │     ├─ TransportistaProfileScreen.tsx
│  │  │  │  │  │     ├─ TransportistaReturnsScreen.tsx
│  │  │  │  │  │     └─ TransportistaRoutesScreen.tsx
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
│  │  │  │  │  ├─ navigationRef.ts
│  │  │  │  │  ├─ SellerNavigator.tsx
│  │  │  │  │  ├─ SupervisorNavigator.tsx
│  │  │  │  │  ├─ TransportistaNavigator.tsx
│  │  │  │  │  ├─ types.ts
│  │  │  │  │  └─ WarehouseNavigator.tsx
│  │  │  │  ├─ services
│  │  │  │  │  ├─ api
│  │  │  │  │  │  ├─ AssignmentService.ts
│  │  │  │  │  │  ├─ CatalogService.ts
│  │  │  │  │  │  ├─ client.ts
│  │  │  │  │  │  ├─ ClientService.ts
│  │  │  │  │  │  ├─ http.ts
│  │  │  │  │  │  ├─ InvoiceService.ts
│  │  │  │  │  │  ├─ NotificationService.ts
│  │  │  │  │  │  ├─ OrderService.ts
│  │  │  │  │  │  ├─ PriceService.ts
│  │  │  │  │  │  ├─ ProductService.ts
│  │  │  │  │  │  ├─ ProfileService.ts
│  │  │  │  │  │  ├─ PromotionService.ts
│  │  │  │  │  │  ├─ ReturnsService.ts
│  │  │  │  │  │  ├─ RouteService.ts
│  │  │  │  │  │  ├─ SellerService.ts
│  │  │  │  │  │  ├─ SucursalService.ts
│  │  │  │  │  │  ├─ SupervisorService.ts
│  │  │  │  │  │  ├─ SupportService.ts
│  │  │  │  │  │  ├─ TransportistaService.ts
│  │  │  │  │  │  ├─ UserService.ts
│  │  │  │  │  │  ├─ WarehouseService.ts
│  │  │  │  │  │  └─ ZoneService.ts
│  │  │  │  │  └─ auth
│  │  │  │  │     └─ authClient.ts
│  │  │  │  ├─ storage
│  │  │  │  │  └─ authStorage.ts
│  │  │  │  ├─ theme
│  │  │  │  │  └─ colors.ts
│  │  │  │  ├─ types
│  │  │  │  │  └─ global.d.ts
│  │  │  │  └─ utils
│  │  │  │     ├─ delay.ts
│  │  │  │     └─ errorHandlers.ts
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
│  │     │  │  ├─ extensionErrorHandler.ts
│  │     │  │  └─ statusHelpers.ts
│  │     │  └─ vite-env.d.ts
│  │     ├─ tailwind.config.js
│  │     ├─ tsconfig.json
│  │     └─ vite.config.ts
│  ├─ infra
│  │  ├─ gcloud-scripts
│  │  │  └─ setup.sh
│  │  ├─ local-init
│  │  │  ├─ 01-init-dbs.sql
│  │  │  ├─ 04-init-catalog.sql
│  │  │  └─ 05-init-orders.sql
│  │  └─ terraform
│  │     ├─ main.tf
│  │     ├─ modules
│  │     │  ├─ api_gateway
│  │     │  │  ├─ main.tf
│  │     │  │  └─ variables.tf
│  │     │  ├─ artifact_registry
│  │     │  │  ├─ main.tf
│  │     │  │  └─ variables.tf
│  │     │  ├─ cloud_build
│  │     │  │  ├─ main.tf
│  │     │  │  └─ variables.tf
│  │     │  ├─ cloud_run
│  │     │  │  ├─ main.tf
│  │     │  │  └─ variables.tf
│  │     │  ├─ database
│  │     │  │  ├─ main.tf
│  │     │  │  └─ variables.tf
│  │     │  └─ networking
│  │     │     ├─ main.tf
│  │     │     └─ variables.tf
│  │     ├─ terraform.tfvars
│  │     └─ variables.tf
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
├─ cloudbuild-infra.yaml
└─ README.md

```
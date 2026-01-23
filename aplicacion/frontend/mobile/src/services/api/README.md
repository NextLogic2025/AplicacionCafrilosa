# API Services

Este directorio agrupa servicios por dominio (carrito, catálogos, picking, etc.) y está cimentado sobre tres piezas centrales:

1. `apiRequest`: cliente HTTP de bajo nivel que agrega headers, refresca tokens y sanitiza respuestas antes de levantarlas.
2. `ApiService`: helpers (`get`, `post`, `put`, `patch`, `delete`) construidos encima de `apiRequest` y encargados de serializar los cuerpos.
3. `createService`: envoltorio que captura errores por método y centraliza el logging/contexto; así los servicios no repiten `try/catch`.

## Endpoints como única fuente

Todas las rutas vienen de `src/services/api/endpoints.ts`. Cada servicio debe importar el path que necesita (p.ej. `endpoints.catalog.products`) y no concatenar bases manualmente. Si necesitas nuevas rutas:

1. Añádela a `endpoints.ts` bajo el dominio adecuado.
2. Usa esa función/constante desde el servicio; esto mantiene coherencia cuando se cambia la base URL o se introduce versionado.

## Servicios funcionales

Los siguientes archivos ya implementan llamadas reales y deberían seguir el patrón descrito:

- `AlmacenService.ts`
- `AssignmentService.ts`
- `CartService.ts`
- `CatalogService.ts`
- `ClientService.ts`
- `ConductorService.ts`
- `DespachosService.ts`
- `InvoiceService.ts`
- `LoteService.ts`
- `OrderService.ts`
- `PickingService.ts`
- `PriceService.ts`
- `ProductService.ts`
- `PromotionService.ts`
- `ReservationService.ts`
- `RouteService.ts`
- `StockService.ts`
- `SucursalService.ts`
- `UbicacionService.ts`
- `UserService.ts`
- `VehicleService.ts`
- `ZoneService.ts`

## Servicios pendientes / stubs

Hay algunos archivos que hoy no consumen un endpoint real, se mantienen como stubs o listas de errores. Lo ideal es:

1. Marcar claramente el servicio como pendiente (`// TODO: conectar a XXX`).
2. Cuando el backend suministre la ruta, implementar el método usando `ApiService` + `createService`.

Servicios en esta categoría:

- `NotificationService.ts`
- `ReturnsService.ts`
- `SellerService.ts`
- `SupervisorService.ts`
- `SupportService.ts`
- `TransportistaService.ts`
- `WarehouseService.ts`

## Cómo añadir un nuevo servicio

1. Importa `ApiService`, `createService` y las rutas de `endpoints.ts` necesarias.
2. Implementa la lógica sin `try/catch` (la captura la hace `createService`) y reutiliza `ApiService.<método>`.
3. Envuelve el objeto con `export const MiServicio = createService('MiServicio', rawService)`.
4. Expón los tipos relevantes desde `src/services/api/index.ts` para que el resto de la app los consuma.

Ejemplo:

```ts
const rawService = {
  fetchData: async () => ApiService.get<Something>(endpoints.catalog.health)
}

export const SomethingService = createService('SomethingService', rawService)
```

Con este patrón, cualquier mejora (autenticación, reintentos, logging) se aplica una sola vez y los servicios siguen siendo fáciles de mantener y testear.

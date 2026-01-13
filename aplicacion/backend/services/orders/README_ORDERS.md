# Orders Service — API Reference (actualizado)

## Resumen
Servicio `orders` — gestión de carritos y creación de pedidos. El flujo actual implica que:
- El frontend administra el carrito (agregar/editar/quitar líneas).
- El servidor es la fuente de verdad para precios y promociones: cualquier precio que venga del cliente es ignorado y recalculado por el servicio usando el Catalog.
- Los pedidos deben crearse a partir del carrito (`POST /orders/from-cart/:userId`) para garantizar snapshots y consistencia.

Base path: `/orders`

## Autenticación
- `Authorization: Bearer <token>` (JWT con `userId` y `role`).
- Internamente, las llamadas S2S a `catalog` usan `SERVICE_TOKEN` (configurado en env/docker-compose).

## Comportamiento clave
- Precio y promoción son calculados y aplicados por el servidor consultando Catalog (endpoint interno batch `/products/internal/batch` y resoluciones de promociones).
- El carrito mantiene snapshots por línea: `precio_unitario_ref` y `precio_original_snapshot`, además de `campania_aplicada_id` y `motivo_descuento`.
- Al cargar el carrito, el servidor elimina solamente las líneas afectadas por promociones expiradas o cambios de campaña y devuelve `removed_items` con detalle.
- Flujo preferido: frontend sólo envía identificadores (`producto_id`, `cantidad`, `campania_aplicada_id?`, `referido_id?`) y delega cálculo al servidor.

---

## Endpoints — Cart

### GET /orders/cart/:userId
- Roles: `admin`, `cliente`, `vendedor`.
- Qué hace: devuelve (o crea) el carrito del `userId`. Valida precios/promos vía Catalog y, si detecta líneas con campañas inválidas, las elimina y devuelve `removed_items`.
- Respuesta (ejemplo):
```json
{
  "id": "...",
  "usuario_id": "...",
  "cliente_id": "...",      
  "items": [
    {
      "id": "...",
      "producto_id": "...",
      "cantidad": 2,
      "precio_unitario_ref": 125.5,
      "precio_original_snapshot": 150.0,
      "campania_aplicada_id": 123,
      "motivo_descuento": "Oferta Verano"
    }
  ],
  "total_estimado": 251.0,
  "removed_items": [{ "producto_id": "...", "campania_aplicada_id": 123 }],
  "warnings": [{ "issue": "catalog_batch_unavailable" }]
}
```

### POST /orders/cart/:userId
- Roles: `admin`, `cliente`, `vendedor`.
- Qué hace: upsert (insert o update) de una línea del carrito. El servidor consulta Catalog (batch) para obtener precio/promo y sobrescribe snapshots.
- Body (`UpdateCartItemDto`):
  - `producto_id` (UUID) — obligatorio
  - `cantidad` (number, ≥ 0.1) — obligatorio
  - `campania_aplicada_id` (int) — opcional (el servidor validará su vigencia)
  - `motivo_descuento` (string) — opcional
  - `referido_id` (UUID) — opcional

Ejemplo:
```json
{
  "producto_id": "a1b2c3d4-...",
  "cantidad": 2
}
```

Notas:
- El servidor guarda `precio_unitario_ref` y `precio_original_snapshot` en la línea al consultar Catalog.
- Si Catalog no está disponible, el servidor puede dejar la línea con warnings y usar valores previos si existen.

### DELETE /orders/cart/:userId
- Roles: `admin`, `cliente`, `vendedor`.
- Vacía el carrito (borra items y resetea `total_estimado`).

### DELETE /orders/cart/:userId/item/:productId
- Roles: `admin`, `cliente`, `vendedor`.
- Elimina una línea específica del carrito.

---

## Endpoints — Orders

### POST /orders/from-cart/:userId
- Roles: `admin`, `cliente`, `vendedor`.
- Qué hace: crea un pedido a partir del carrito asociado a `userId`.
  - Si el actor es `vendedor`, el servidor usa el `userId` del token como `vendedor_id` (el vendedor puede crear pedidos para clientes seleccionados en la UI al haber fijado `cliente_id` en el carrito).
  - Si el actor es `cliente`, el servidor resuelve el `cliente_id` y —si existe— el `vendedor_asignado_id` del cliente desde Catalog (`/internal/clients/:id`) y asigna `vendedor_id` al pedido.
  - El servidor recalcula precios y promociones antes de persistir; guarda snapshots en `detalles_pedido`.

Ejemplo (cliente crea su pedido desde su carrito):
Request:
POST /orders/from-cart/<<userId>>

Response esperado: 201 con el `pedido` creado (cabecera y `detalles`).

### GET /orders
- Roles: `admin`, `cliente`, `vendedor`.
- Lista pedidos; si el actor es `cliente` devuelve pedidos del cliente; si `vendedor` devuelve pedidos del vendedor.

### GET /orders/:id
- Roles: `admin`, `cliente`, `vendedor`.
- Devuelve cabecera y `detalles` del pedido.

### GET /orders/:id/detail
- Roles: `admin`, `cliente`, `vendedor`.
- Versión enriquecida para UI/profesional que incluye historial y campos calculados.

### GET /orders/:id/tracking
- Roles: `admin`, `cliente`, `vendedor`.
- Devuelve timeline/status del pedido.

### PATCH /orders/:id/cancel
- Roles: `admin`, `cliente`, `vendedor`.
- Cancela pedido (pasa a `ANULADO`) si está en `PENDIENTE` o `APROBADO` y registra historial.

### PATCH /orders/:id/status
- Roles: `admin`, `bodeguero`.
- Cambia estado del pedido y crea entrada en historial (para Bodega/Transporte/Admins).

---

## Reglas y validaciones importantes
- El servidor siempre recalcula precios/promociones consultando Catalog; el cliente nunca debe enviar precios finales para su procesamiento.
- Si el frontend envía `campania_aplicada_id`, el servidor verificará su vigencia para la línea y rechazará el pedido si la campaña no es válida (409 Conflict) o eliminará la línea al cargar el carrito.
- `createFromCart` es transaccional: si algo falla el pedido no se persiste y el carrito no se vacía; si se crea correctamente, el carrito se limpia.

## Endpoints internos de Catalog usados por Orders
- `POST /products/internal/batch` — recibe `{ ids: [...], cliente_id? }` y devuelve metadata + precios + mejor promoción por producto.
- `GET /internal/clients/:id` — devuelve `{ id, lista_precios_id, vendedor_asignado_id }` para resolver cliente/vendedor en creación desde carrito.

## Endpoints eliminados / comportamiento ya no soportado
- `POST /orders` (creación manual desde payload del frontend) — eliminado: use `POST /orders/from-cart/:userId`.
- `POST /orders/cart/:userId/cliente` — eliminado: el cliente se asocia típicamente en UI o se resuelve en `from-cart`.

## Errores comunes
- `400 Bad Request`: validación DTO.
- `401 Unauthorized`: token inválido o faltante.
- `403 Forbidden`: ownership o permisos.
- `404 Not Found`: recurso no existe.
- `409 Conflict`: inconsistencia de precio/campaña.

Ejemplo de 409:
```json
{
  "message": "Inconsistencias en precios/promociones",
  "details": [
    { "producto_id": "...", "reason": "campania_mismatch", "expected_campaign": 456, "actual_campaign": 123 }
  ]
}
```

---

## Dónde mirar en el código
- Controladores: `src/orders/controllers`
- DTOs: `src/orders/dto/requests` y `src/orders/dto/responses`
- Servicios: `src/orders/services/cart.service.ts`, `src/orders/services/orders.service.ts`
- Entidades: `src/orders/entities`
- SQL autoritativo: `aplicacion/infra/local-init/05-init-orders.sql`

---

## Cómo probar localmente
```bash
cd aplicacion/backend/services/orders
npm install
npm run build
npm run test
```

Levantar con Docker Compose (desde la raíz del repo):
```bash
cd aplicacion
docker-compose up -d --build orders-service catalog-service
```

---

¿Quieres que genere la colección Postman JSON con requests y ejemplos listos para importar? 
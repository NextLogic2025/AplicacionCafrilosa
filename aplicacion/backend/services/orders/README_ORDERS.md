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
  - El servidor resuelve automáticamente la ubicación del pedido:
    - Si se proporciona `sucursal_id`, usa la ubicación de la sucursal.
    - Si no, usa la ubicación del cliente.
  - Calcula correctamente `descuento_total` basado en los descuentos de cada línea (precio_original - precio_final) × cantidad.

**Body (CreateFromCartDto):**
```json
{
  "condicion_pago": "CONTADO",
  "sucursal_id": "opcional-uuid-de-sucursal"
}
```

**Parámetros:**
- `condicion_pago` (string, **REQUERIDO**) — valores válidos: `CONTADO`, `CREDITO`, `TRANSFERENCIA`, `CHEQUE`
- `sucursal_id` (UUID, opcional) — si se proporciona, el pedido va a esta sucursal; si no, va al cliente.

**Respuesta (201 Created):**
```json
{
  "id": "803d950e-8540-4f7c-bc0b-69ac31246221",
  "codigo_visual": 8,
  "cliente_id": "30829120-4713-4a33-9cb8-4f439df20f63",
  "vendedor_id": "cd2dcd26-8a1e-47f9-b1bf-01a0e49e7dc2",
  "sucursal_id": null,
  "estado_actual": "PENDIENTE",
  "subtotal": "124.00",
  "descuento_total": "6.00",
  "impuestos_total": "14.16",
  "total_final": "132.16",
  "monto_pagado": "0.00",
  "estado_pago": "PENDIENTE",
  "condicion_pago": "CONTADO",
  "fecha_entrega_solicitada": null,
  "origen_pedido": "FROM_CART",
  "ubicacion_pedido": "0101000020E6100000...",
  "observaciones_entrega": null,
  "created_at": "2026-01-14T03:48:59.492Z",
  "updated_at": "2026-01-14T03:48:59.492Z",
  "deleted_at": null,
  "detalles": [
    {
      "id": "6811abb8-12bb-4e91-9c70-28e555f0efec",
      "pedido_id": "803d950e-8540-4f7c-bc0b-69ac31246221",
      "producto_id": "21bd1bf4-191b-4f23-947f-0f4362f4437a",
      "codigo_sku": "MORT-BOLO",
      "nombre_producto": "Mortadela Bolognia",
      "cantidad": "2.00",
      "unidad_medida": "UN",
      "precio_lista": "45.00",
      "precio_final": "45.00",
      "es_bonificacion": false,
      "motivo_descuento": null,
      "campania_aplicada_id": null,
      "subtotal_linea": "90.00",
      "created_at": "2026-01-14T03:48:59.492Z",
      "updated_at": "2026-01-14T03:48:59.492Z"
    },
    {
      "id": "fc7f9675-e1ac-42ac-9c03-2c092febe953",
      "pedido_id": "803d950e-8540-4f7c-bc0b-69ac31246221",
      "producto_id": "db849318-82de-49a4-b086-2b8fff9d2d07",
      "codigo_sku": "MORT-POLLO",
      "nombre_producto": "Mortadela de Pollo",
      "cantidad": "2.00",
      "unidad_medida": "UN",
      "precio_lista": "20.00",
      "precio_final": "17.00",
      "es_bonificacion": false,
      "motivo_descuento": "Descuento Navidad",
      "campania_aplicada_id": 1,
      "subtotal_linea": "34.00",
      "created_at": "2026-01-14T03:48:59.492Z",
      "updated_at": "2026-01-14T03:48:59.492Z"
    }
  ]
}
```

**Ejemplo (cliente crea su pedido desde su carrito):**
```bash
POST /orders/from-cart/cd2dcd26-8a1e-47f9-b1bf-01a0e49e7dc2
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "condicion_pago": "CONTADO"
}
```

**Ejemplo (vendedor crea pedido para cliente con sucursal específica):**
```bash
POST /orders/from-cart/30829120-4713-4a33-9cb8-4f439df20f63
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "condicion_pago": "CREDITO",
  "sucursal_id": "12345678-1234-1234-1234-123456789012"
}
```

**Notas importantes:**
- `condicion_pago` es **obligatorio**; si no se proporciona recibirás un error de validación 400.
- El servidor enriquece automáticamente los detalles del pedido con `codigo_sku` y `nombre_producto` desde Catalog.
- El carrito se vacía automáticamente después de crear el pedido exitosamente.
- Los descuentos se calculan correctamente basado en la diferencia entre `precio_lista` y `precio_final` de cada línea.
- La ubicación del pedido se resuelve automáticamente: sucursal si existe, cliente si no.

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
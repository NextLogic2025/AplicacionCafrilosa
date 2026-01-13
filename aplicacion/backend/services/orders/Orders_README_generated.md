# Orders microservice — Resumen operativo

Este servicio gestiona carritos y pedidos (orders). Implementa el patrón "Trust but Verify": el frontend envía snapshots de precios, pero el backend valida precios y promociones antes de persistir.

Archivo de inicialización de DB: [aplicacion/infra/local-init/05-init-orders.sql](aplicacion/infra/local-init/05-init-orders.sql)

**Comandos rápidos**
- **Instalar / Desarrollar:**
  ```bash
  cd aplicacion/backend/services/orders
  npm install
  npm run start:dev
  ```
- **Build:** `npm run build`

**Docker (ejemplo)**
```bash
docker build -t orders-service .
docker run -e DATABASE_URL=postgres://admin:root@host:5432/orders_db -p 3000:3000 orders-service
```

---

## 1) Resumen del flujo (alto nivel)

1. Usuario (cliente o vendedor) mantiene su carrito con `POST /orders/cart/:userId`.
2. Frontend envía `POST /orders` con el `CreateOrderDto` (snapshots por item: nombre, sku, precio_original, precio_unitario y opcional `campania_aplicada_id`).
3. Backend recalcula todos los totales (subtotal, impuestos, total_final) — autoridad del backend.
4. Si hay `campania_aplicada_id`, el servicio valida la vigencia y aplicación de la campaña en Catalog (HTTP a `CATALOG_SERVICE_URL` o consulta directa según despliegue).
5. La creación usa transacción (QueryRunner). Si cualquier validación o guardado falla se hace rollback.
6. Al finalizar con éxito se borra el carrito (`CartService.clearCart`) y se devuelve resumen `{ id, codigo, total }`.

---

## 2) Roles y responsabilidades

- **cliente**: crear/consultar carrito, crear pedido propio, cancelar pedido en `PENDIENTE` o `APROBADO`, ver sólo sus pedidos.
- **vendedor**: crear pedidos en nombre de clientes (asignar `cliente_id` al carrito), ver sus pedidos y los de sus clientes.
- **admin / supervisor**: acceso total (listar, ver, cambiar estados, auditar historiales).
- **bodeguero / transportista**: cambiar estados operativos (`EN_RUTA`, `ENTREGADO`, etc.) mediante `PATCH /orders/:id/status`.

---

## 3) Endpoints principales (resumen)

- **GET /orders/client/:userId** — Listar pedidos relacionados (cliente o vendedor). Roles: `admin`, `cliente`, `vendedor`.
- **GET /orders/:id** — Obtener pedido con detalles. Roles: `admin`, `vendedor`, `cliente`, `bodeguero`.
- **GET /orders/:id/detail** — DTO profesional con `OrderResponseDto`. Roles: `admin`, `vendedor`, `cliente`.
- **GET /orders/:id/tracking** — Timeline / historial del pedido. Roles: `admin`, `cliente`, `vendedor`.
- **POST /orders** — Crear pedido (transaccional). Guards: `OrderOwnershipGuard`. Roles: `admin`, `vendedor`, `cliente`.
- **PATCH /orders/:id/cancel** — Cancelar pedido (PENDIENTE o APROBADO → ANULADO). Roles: `admin`, `cliente`, `vendedor`.
- **PATCH /orders/:id/status** — Cambiar estado (ej: `EN_RUTA`). Roles: `admin`, `bodeguero` (configurable).

Cart endpoints (centralizados en `CartController`):
- **GET /orders/cart/:userId** — Obtener carrito.
- **POST /orders/cart/:userId** — Upsert item en carrito.
- **DELETE /orders/cart/:userId** — Vaciar carrito.
- **DELETE /orders/cart/:userId/item/:productId** — Eliminar item.
- **POST /orders/cart/:userId/cliente** — Asignar cliente al carrito (para vendedores).

---

## 4) DTOs / Payloads (ejemplos)

- **CreateOrderDto (resumen)** — enviar array `items` con campos mínimos por item:

```json
{
  "cliente_id": "uuid",
  "vendedor_id": "uuid",
  "sucursal_id": "uuid|null",
  "items": [
    {
      "producto_id": "uuid",
      "cantidad": 2,
      "precio_unitario": 12.5,
      "precio_original": 15.0,
      "codigo_sku": "SKU-1",
      "nombre_producto": "Producto A",
      "unidad_medida": "UN",
      "motivo_descuento": "Promoción X",
      "campania_aplicada_id": 123
    }
  ],
  "observaciones_entrega": "...",
  "condicion_pago": "CONTADO",
  "fecha_entrega_solicitada": "YYYY-MM-DD",
  "origen_pedido": "APP_MOVIL",
  "ubicacion": { "lat": -0.12, "lng": -78.12 }
}
```

- **UpdateCartItemDto (ejemplo)**

```json
{ "producto_id": "uuid", "cantidad": 1.5, "precio_unitario_ref": 10.0 }
```

---

## 5) Validaciones y comportamiento esperado

- Validaciones con `class-validator` (UUIDs, mínimos, formatos de fecha).
- Backend recalcula: `subtotal = sum(precio_unitario * cantidad)`, `impuestos_total = (subtotal - descuento_total) * 0.12`, `total_final = subtotal - descuento_total + impuestos_total`.
- Si `campania_aplicada_id` está presente, el servicio verifica que la campaña siga vigente y que el producto pertenezca a la campaña; si no es válida, devuelve `409 Conflict`.
- Persistencia transaccional: se usan `QueryRunner` y cascades para asegurar ACID.

---

## 6) Códigos HTTP importantes

- `200` / `201`: OK / creado.
- `409 Conflict`: promoción inválida o expirada — frontend debe refrescar catálogo/carrito.
- `400` / `422`: error de validación en DTO.
- `403`: acceso denegado por rol/ownership.
- `404`: recurso no encontrado.

---

## 7) Checklist para el frontend antes de `POST /orders`

- Incluir snapshots por item: `nombre_producto`, `codigo_sku`, `precio_original`.
- Si usa promociones, incluir `campania_aplicada_id` por item y manejar `409` refrescando catálogo.
- Enviar token JWT válido en `Authorization`.

---

Si quieres, genero una **colección Postman** con estas peticiones y variables (`{{baseUrl}}`, `{{token}}`).
# Orders microservice

Este módulo gestiona pedidos (orders), carritos (cart) y el flujo relacionado (historial de estados, promociones aplicadas, etc.).

La inicialización de la DB está en: `aplicacion/infra/local-init/05-init-orders.sql`

## Comandos básicos:

```bash
cd aplicacion/backend/services/orders
npm install
npm run build
npm run start:dev
```

## Docker (ejemplo):

```bash
docker build -t orders-service .
docker run -e DB_HOST=host.docker.internal -e DB_USER=admin -e DB_PASSWORD=root -e DB_NAME=orders_db -p 3000:3000 orders-service
```

**Resumen de cómo funciona (alto nivel)**
- El controlador `OrdersController` expone rutas bajo `/orders`.
- Todas las rutas usan `@UseGuards(AuthGuard('jwt'), RolesGuard)` (JWT + validación de roles).
- Algunas rutas usan `OrderOwnershipGuard` para validar que el `userId` de la ruta coincide con el usuario autenticado (a menos que sea admin).
- `CartService` maneja la lógica del carrito: creación lazy, upsert de items, recálculo de totales, vaciado.
- `OrdersService` crea pedidos dentro de transacciones (QueryRunner), guarda detalles de pedido, aplica promociones y escribe entradas de historial.

## Rutas disponibles (resumen con ejemplos para Postman)

Base URL de ejemplo: `http://localhost:3000`

- `GET /orders/client/:userId`
  - Descripción: Listar pedidos relacionados con `userId` (cliente o vendedor).
  - Roles: `admin`, `cliente`, `vendedor`
  - Ejemplo (GET): `GET http://localhost:3000/orders/client/11111111-1111-4111-8111-111111111111`

- `GET /orders/:id`
  - Descripción: Obtener cabecera del pedido (con `detalles`).
  - Roles: `admin`, `vendedor`, `cliente`, `bodeguero`
  - Ejemplo: `GET http://localhost:3000/orders/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa`

- `GET /orders/:id/detail`
  - Descripción: Detalle profesional del pedido (transformado a `OrderResponseDto`).
  - Roles: `admin`, `vendedor`, `cliente`
  - Ejemplo: `GET /orders/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/detail`

- `GET /orders/:id/tracking`
  - Descripción: Timeline/historial ordenado del pedido.
  - Roles: `admin`, `cliente`, `vendedor`

- `POST /orders`
  - Descripción: Crear un pedido (la creación se realiza en transacción; calcula subtotal, impuestos, total, guarda detalles y promociones aplicadas).
  - Guards: `OrderOwnershipGuard` valida que `createOrderDto.vendedor_id` (o cliente) pertenezca al usuario cuando aplique.
  - Roles: `admin`, `vendedor`, `cliente`
  - Body: `CreateOrderDto` (ejemplo abajo)

- `GET /orders/cart/:userId`
  - Descripción: Obtener o crear lazy el carrito del usuario.
  - Roles: `admin`, `cliente`, `vendedor`

- `POST /orders/cart/:userId`
  - Descripción: Agrega o actualiza (upsert) un item en el carrito.
  - Body: `UpdateCartItemDto` (ejemplo abajo)
  - Roles: `admin`, `cliente`, `vendedor`

- `DELETE /orders/cart/:userId`
  - Descripción: Vacía el carrito (elimina items y resetea total).
  - Roles: `admin`, `cliente`, `vendedor`

- `DELETE /orders/cart/:userId/item/:productId`
  - Descripción: Elimina un item específico del carrito.
  - Roles: `admin`, `cliente`, `vendedor`

- `POST /orders/cart/:userId/cliente`
  - Descripción: Asigna/actualiza `cliente_id` al carrito (útil para vendedores que crean pedido para un cliente).
  - Body: `{ "cliente_id": "<uuid>" }`

- `PATCH /orders/:id/cancel`
  - Descripción: Cancela un pedido (pasa a `ANULADO`) si estaba en `PENDIENTE` o `APROBADO`.
  - Roles: `admin`, `cliente`, `vendedor`
  - Body opcional: `{ "motivo": "razón de la cancelación" }`

## Headers para Postman (recomendado)
- `Authorization: Bearer {{token}}`  (JWT válido)
- `Content-Type: application/json`

Recomendación para colección Postman / variables de entorno:
- `{{baseUrl}} = http://localhost:3000`
- `{{token}} = <JWT Aquí>`

## Cuerpos de ejemplo (JSON) para Postman

- Agregar / actualizar item en carrito (POST /orders/cart/:userId):

```json
{
  "producto_id": "22222222-2222-4222-8222-222222222222",
  "cantidad": 2,
  "precio_unitario_ref": 12.5
}
```

- Crear pedido (POST /orders):

```json
{
  "cliente_id": "33333333-3333-4333-8333-333333333333",
  "vendedor_id": "11111111-1111-4111-8111-111111111111",
  "sucursal_id": null,
  "items": [
    {
      "producto_id": "22222222-2222-4222-8222-222222222222",
      "cantidad": 2,
      "precio_unitario": 12.5,
      "precio_original": 15.0,
      "codigo_sku": "SKU-001",
      "nombre_producto": "Producto A",
      "unidad_medida": "UN",
      "motivo_descuento": "Promoción X",
      "campania_aplicada_id": 123
    }
  ],
  "observaciones_entrega": "Dejar en portería",
  "condicion_pago": "CONTADO",
  "fecha_entrega_solicitada": "2026-01-20",
  "origen_pedido": "APP_MOVIL",
  "ubicacion": { "lat": -0.12345, "lng": -78.12345 },
  "descuento_total": 5.0
}
```

- Cancelar pedido (PATCH /orders/:id/cancel):

```json
{ "motivo": "Cliente cambió de opinión" }
```

## Notas de validación y comportamiento
- Los DTOs usan `class-validator`:
  - `UpdateCartItemDto.producto_id` debe ser UUID.
  - `cantidad` mínima 0.1 (permite ventas por peso).
  - `CreateOrderDto.items` es un arreglo con `producto_id`, `cantidad`, `precio_unitario` obligatorios.
- La creación de pedidos se ejecuta en una transacción: si falla cualquier paso (detalle, promoción), se revierte.
- Los totales se calculan localmente en `OrdersService.create`:
  - `subtotal = sum(precio_unitario * cantidad)`
  - `impuestos_total = (subtotal - descuento_total) * 0.12`
  - `total_final = subtotal - descuento_total + impuestos_total`
- `CartService.addItem` realiza upsert: si el producto ya existe, actualiza cantidad y precio de referencia; de lo contrario crea el item.

## Códigos de respuesta esperados (ejemplos)
- 200: Operación exitosa (GET, POST donde devuelve entidad).
- 201: Creación (si aplica en tu configuración).
- 204: Sin contenido (en algunos DELETE, aunque aquí devuelven objeto success true).
- 400: Validación inválida (UUID mal formado, cantidad inválida, FK no existe).
- 403: Forbidden (OrderOwnershipGuard o RolesGuard bloquea la petición).
- 404: Not Found (pedido o carrito no encontrado).

## Pruebas rápidas con Postman (pasos)
1. Configurar variable `{{baseUrl}} = http://localhost:3000` y `{{token}}` con un JWT válido.
2. Obtener/crear carrito del usuario (GET): `GET {{baseUrl}}/orders/cart/11111111-1111-4111-8111-111111111111`.
3. Agregar item al carrito (POST): `POST {{baseUrl}}/orders/cart/11111111-1111-4111-8111-111111111111` con body JSON del ejemplo `UpdateCartItemDto`.
4. Crear pedido desde el frontend o Postman (POST {{baseUrl}}/orders) usando `CreateOrderDto` de ejemplo.
5. Consultar `GET {{baseUrl}}/orders/:id/detail` para validar respuesta transformada.
6. Cancelar pedido (PATCH {{baseUrl}}/orders/:id/cancel) con body `{ "motivo": "..." }`.

Si quieres, puedo generar una colección Postman con estas peticiones (exportada) y ejemplos pre-llenados. Dime si la quieres y te la creo.

---

## Flujo Operativo (Resumen "Trust but Verify")

1. Cliente/Vendedor crea o actualiza su carrito con `POST /orders/cart/:userId`.
  - Enviar: `{ producto_id, cantidad, precio_unitario_ref }`.
  - Validaciones: `producto_id` UUID, `cantidad` >= 0.1.
  - Resultado: carrito con totales recalculados.

2. Cuando el frontend crea el pedido `POST /orders` envía el `CreateOrderDto` con el snapshot de cada item (nombre, sku, precio_unitario, precio_original, campania_aplicada_id opcional).
  - El backend recalcula `subtotal`, `impuestos_total` y `total_final` (no confiar en valores calculados en cliente).

3. Verificación de promociones (Trust but Verify):
  - Si un item incluye `campania_aplicada_id`, `OrdersService` comprobará consultando el `Catalog` (via HTTP a `CATALOG_SERVICE_URL` o consultando BD según despliegue) que la campaña esté activa y que el producto pertenezca a la campaña.
  - Si la verificación falla, la creación del pedido falla con `409 Conflict` y el frontend debe refrescar catálogo/carrito.

4. Persistencia transaccional:
  - La creación de pedido usa `QueryRunner` para asegurar ACID: si cualquier detalle/promo falla, se hace rollback y no se guarda nada.
  - Al finalizar exitosamente se limpia el carrito (`CartService.clearCart`) y se devuelve `{ id, codigo, total }`.

5. Notificaciones y seguimiento:
  - Los cambios de estado crean entradas en `historial_estados` y pueden disparar notifications (pg_notify o servicios asíncronos según infra).

## Roles y responsabilidades

- `cliente`:
  - Crear/consultar su carrito y pedir. Puede cancelar su pedido cuando esté en `PENDIENTE` o `APROBADO`.
  - Ver solo sus pedidos (guardias y `OrderOwnershipGuard` aplican).

- `vendedor`:
  - Crear pedidos en nombre de clientes (puede asignar `cliente_id` al carrito y crear pedido).
  - Consultar pedidos propios y de clientes asignados.

- `admin` / `supervisor`:
  - Acceso completo: listar, ver, actualizar estados, eliminar/restaurar recursos de apoyo (productos, campañas) y ver historiales.

- `bodeguero` / `transportista`:
  - Cambiar estados relevantes (`EN_RUTA`, `ENTREGADO`, etc.) mediante `PATCH /orders/:id/status` (roles permitidos configurables).

## Qué enviar (Checklist para frontend)

- Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`.
- Para crear pedido (`POST /orders`): enviar `CreateOrderDto` completo con snapshots de producto (nombre, sku, precio_original) y, si aplica, `campania_aplicada_id`.
- Para cambiar estado: `PATCH /orders/:id/status` body `{ "status": "EN_RUTA" }` y usar token con rol permitido.

## Respuestas y códigos esperados (recap)

- `201` / `200`: pedido creado / recurso retornado.
- `409 Conflict`: promoción inválida/expirada — frontend debe refrescar carrito/catálogos.
- `400` / `422`: validación fallida en DTOs.
- `403`: acceso denegado por roles/ownership.
- `404`: recurso no encontrado.

---

Archivo actualizado: [aplicacion/backend/services/orders/Orders_README_generated.md](aplicacion/backend/services/orders/Orders_README_generated.md)

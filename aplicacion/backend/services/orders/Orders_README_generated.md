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

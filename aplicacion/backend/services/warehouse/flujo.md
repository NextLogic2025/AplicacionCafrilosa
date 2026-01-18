# Flujo: Cliente → Pedido → Reserva → Picking

Este documento resume, paso a paso, el flujo que sigue un pedido desde que un cliente arma el carrito hasta que se genera la orden de picking en `warehouse`.

1) Cliente arma el carrito (Frontend)
  - Rutas usadas (Orders service):
    - `GET /orders/cart/me` — obtener carrito
    - `POST /orders/cart/me` — agregar producto
    - `DELETE /orders/cart/me` — vaciar carrito

2) Cliente crea pedido desde carrito
  - Frontend llama a `POST /orders/from-cart/me` (o `POST /orders/from-cart/client/:clienteId` para vendedor).
  - `OrdersService.createFromCart()` arma un `CreateOrderDto` con items, resuelve precios y nombres desde `catalog` y luego llama internamente a `OrdersService.create()`.

3) Reserva síncrona en Warehouse (antes de persistir el pedido)
  - Dentro de `OrdersService.create()` se llama a `POST {WAREHOUSE_SERVICE_URL}/api/reservations` con:
    - `items` (producto_id, cantidad)
    - `temp_id` (identificador temporal del pedido)
  - Warehouse crea filas en `reservations` y `reservation_items`, y actualiza `stock_ubicacion.cantidad_reservada` para bloquear stock.
  - Si la reserva falla (stock insuficiente) `Orders.create()` devuelve error y el pedido no se crea.
  - Si la reserva se crea, la respuesta contiene `reservation_id` y `Orders` lo guarda en `pedidos.reservation_id` al persistir el pedido.
  - En caso de rollback (error posterior a la reserva) `Orders.create()` intenta liberar la reserva llamando `DELETE /api/reservations/:reservationId` (compensación).

4) Pedido persistido en Orders
  - Pedido queda con estado `PENDIENTE` y `reservation_id` apuntando a la reserva en Warehouse.

5) Aprobación por supervisor/admin
  - Supervisor usa `PATCH /orders/:id/status` para cambiar el estado a `APROBADO` (endpoint protegido por roles).
  - `OrdersService.updateStatus()` escribe el nuevo estado y registra una entrada en `historial_estados`.
  - El trigger en la base de datos (`notify_pedido_aprobado`) emite `pg_notify('pedido-aprobado', pedidoId)` cuando el estado cambia a `APROBADO`.

6) OrderListener notifica a Warehouse
  - `OrderListenerService` (escuchando `pedido-aprobado`) recibe la notificación y consulta `pedidos.reservation_id`.
  - Llama a `POST {WAREHOUSE_SERVICE_URL}/api/picking/confirm` con `{ pedido_id, reservation_id }` si `reservation_id` existe, o con `{ pedido_id }` si no.

7) Warehouse crea la orden de picking
  - `PickingController.confirm()` llama `PickingService.confirmFromReservation(pedidoId, reservationId)`.
  - `confirmFromReservation()` realiza:
    - Carga la `reservation` y sus `items`.
    - Construye `items` para picking: `{ productoId, cantidad }`.
    - Calcula `effectivePedidoId = pedidoId || reservation.tempId || reservation.id` para cumplir restricciones DB.
    - Llama a `create({ pedidoId: effectivePedidoId, items })` del `PickingService`:
      - Sugiere ubicación/lote por `sugerirUbicacionLote()`.
      - Crea `picking_ordenes` y `picking_items`.
      - Incrementa `stock_ubicacion.cantidad_reservada` donde corresponda.
    - Marca la reserva como `CONFIRMED`.
  - Si ya existe una orden para el `pedido_id`, `create()` devuelve 400 "Ya existe una orden de picking para este pedido" (idempotencia básica).

8) Ciclo del picking (bodeguero)
  - Endpoints (Warehouse) para el bodeguero:
    - `GET /picking` — listar
    - `GET /picking/mis-ordenes` — pickings asignados
    - `POST /picking/:id/asignar` — asignar (admin/supervisor)
    - `POST /picking/:id/iniciar` — iniciar (bodeguero)
    - `POST /picking/:id/items/:itemId/pickear` — registrar pickeo de línea
    - `POST /picking/:id/completar` — completar: decrementa `cantidad_fisica`, decrementa `cantidad_reservada`, genera `kardex` y marca `COMPLETADO`.

9) Qué ocurre si NO se aprueba el pedido
  - Si el pedido permanece `PENDIENTE` o es `ANULADO`, no se ejecuta el flujo de confirmación → no se crea picking.
  - La reserva en Warehouse queda `ACTIVE` y mantiene `cantidad_reservada` ocupada.

10) Recuperación / liberación de reservas (recomendado)
  - Implementado: `OrdersService.cancelOrder()` y `OrdersService.updateStatus()` ya intentan `DELETE /api/reservations/:reservationId` cuando se anula un pedido (compensación en cancelación y anulación por supervisor).
  - Recomendaciones adicionales:
    - Añadir TTL/garbage collector en Warehouse para expirar reservas `ACTIVE` no confirmadas.
    - Añadir idempotencia más robusta y retries con backoff para llamadas inter-servicio.
    - Añadir tests E2E: crear pedido → reserva → aprobar → confirmar picking → completar picking.

11) Notas operativas
  - Todos los endpoints inter-servicio usan `SERVICE_TOKEN` (Auth S2S). `POST /picking/confirm` y `POST /reservations` están protegidos por JWT/roles en producción; hay endpoints `internal/*` sin guardia para pruebas locales.
  - Tablas principales: `reservations`, `reservation_items`, `picking_ordenes`, `picking_items`, `stock_ubicacion`, `kardex_movimientos`, `pedidos`.

Si quieres, puedo generar un diagrama de secuencia simplificado o ejemplos `curl` para cada paso (creación de pedido, aprobación, confirmación-por-OrderListener, completado de picking). Indica cuál prefieres.

# Orders service — Documentación (español)

Este documento describe cómo funciona el servicio de `orders`: modelo de carrito, creación de pedidos, estados, roles/permisos, endpoints principales, validaciones e integraciones con otros microservicios (por ejemplo `catalog` y `usuarios`). Está pensado al estilo de `ZONA_ROUTING_LOGIC.md` (resumido y con ejemplos operativos).

## Resumen

El servicio gestiona carritos (carts), pedidos (orders) y su ciclo de vida. Un usuario (cliente o vendedor) puede mantener un carrito que puede convertirse en pedido. Los roles (admin, supervisor, vendedor, bodeguero, transportista, cliente) controlan qué operaciones están permitidas y sobre qué recursos.

## Estructura de datos (resumen)

- Carrito (cart): cabecera con `user_id`, totales y items.
- CarritoItem: `producto_id`, `cantidad`, `precio_unitario` (referencia en el momento), `descuento`.
- Pedido (order): cabecera con `cliente_id`, `vendedor_id`, `total`, dirección, estado.
- DetallePedido: items asociados al pedido.
- EstadoPedido / HistorialEstado: registro de cambios de estado.

Las tablas y entidades principales están en los archivos de la carpeta `src/orders/entities`.

## Roles y permisos (ORDERS)

Rol,Permisos
Admin,"Crear/editar/eliminar pedidos, cambiar estados, ver todo, auditoría."
Supervisor,"Aprobar/rechazar/anular pedidos, cambiar estados, ver todos los pedidos, historial, auditoría."
Bodeguero,"Ver pedidos pendientes de preparación, no cambiar estados."
Vendedor,"Crear/editar carritos/pedidos (suyos), ver sus pedidos, aplicar promociones."
Transportista,"Ver pedidos en ruta (asignados), no editar."
Cliente,"Crear/editar carritos, Ver sus pedidos, estados, no editar."

Nota sobre stock y verificación

- En estas bases NO tenemos stock local: el inventario se gestiona en el servicio `almacen`/`catalog` centralizado.
- Por tanto, por ahora NO realizamos verificación o reserva de stock desde `orders`. Si en el futuro se integra `almacen`, se podrá activar la lógica de `check/reserve/commit` descrita más arriba.
- Si quieres que `orders` haga alguna comprobación simple (por ejemplo consultar disponibilidad rápida en `catalog` sin reservar), lo implemento, pero por defecto dejaremos la verificación de stock al servicio de `almacen`.

## Flujo principal: Carrito → Pedido

1. Crear/obtener carrito (auto-upsert)
	- Endpoint: `GET /cart/:userId` — obtiene el carrito del usuario.
	- Si no existe, el backend puede devolver `null` o crear uno vacío al primer `POST`.

2. Añadir/actualizar artículos
	- Endpoint: `POST /cart/:userId/items` (o `POST /cart/:userId`) — añade o actualiza items.
	- El servicio debe validar `producto_id` consultando `catalog` para obtener precio y disponibilidad.
	- Calcular totales: subtotal, impuestos, descuentos, total.

3. Remover artículo
	- Endpoint: `DELETE /cart/:userId/items/:itemId` — elimina item y recalcula totales.


4. Convertir carrito a pedido
	- Endpoint: `POST /orders` con referencia al `cartId` o enviando el contenido del carrito.
	- Validaciones:
	  - Verificar stock y precios actuales vía `catalog`.
	  - Verificar que el `vendedor_id` (si aplica) esté autorizado para crear pedido para ese `cliente`.
	- Acciones:
	  - Crear `order` y sus `detalles` (snapshot de precios y descuentos).
	  - Generar primer `estado` (p.ej. `CREADO` o `PENDIENTE` según flujo).
	  - Vaciar (o marcar) carrito como convertido.


	Cómo verificar stock (detalle)

	- Nota: la explicación y los ejemplos de verificación/reserva de stock en esta sección son conceptuales. En el código de este repositorio `orders` utiliza un cliente simulado de `almacen` (ver `src/orders/clients/almacen.client.ts`). Si se configura `ALMACEN_URL` el cliente podrá adaptarse para llamar al servicio real.

	- Objetivo: garantizar que, antes de crear el `order`, hay suficiente stock para cada `producto_id` y reservarlo/consumirlo de forma segura.

	Estrategias comunes (elige según capacidad del servicio `catalog`/inventario):
	- Comprobación sin reserva (read-only) + decrement posterior síncrono: primero preguntar disponibilidad y luego, justo antes de crear el pedido, llamar al endpoint de decremento reservado para disminuir stock. Requiere manejo de fallos/compensaciones.
	- Reserva (recommended): pedir al inventario que haga una `reserva` (hold) por `orderId` o `reservationId` y luego confirmar o liberar la reserva según resultado del pago/flujo.
	- Optimistic decrement con versionado: usar un campo `version` o `stock_version` y actualizar con condición (WHERE stock >= qty AND version = X) para evitar sobreventa.
	- Cola / procesamiento asíncrono: aceptar pedido y procesar reserva en background con compensaciones si falla (menos ideal para UX si no se comunica correctamente).

	Endpoint sugeridos en `catalog`/inventario (ejemplos):
	- `POST /productos/stock/check` — body: `{ items: [{ producto_id, cantidad }] }` → devuelve disponibilidad por item.
	- `POST /productos/stock/reserve` — body: `{ reservationId, items }` → intenta reservar y devuelve `ok`/`errors`.
	- `POST /productos/stock/commit` — confirma la reserva (consume stock).
	- `POST /productos/stock/release` — libera la reserva si se cancela.

	Flujo recomendado al convertir carrito a pedido (sincronizado, robusto):
	1. Obtener snapshot del carrito y normalizar items (producto_id, cantidad).
	2. Llamar `POST /productos/stock/check` en `catalog` para validar precios y disponibilidad.
	3. Si todo disponible, llamar `POST /productos/stock/reserve` con un `reservationId` único (p.ej. `order:<uuid>`).
	4. Si la reserva es exitosa, iniciar transacción DB y crear `order` + `detalle_pedido` (guardar snapshot de precio y `reservationId`).
	5. Commit DB local. Después del commit, llamar `POST /productos/stock/commit` para consumir definitivamente el stock.
	6. Si algo falla entre pasos (reserva ok pero DB falla), llamar `POST /productos/stock/release` para liberar la reserva. Usar retries e idempotencia.

	Ejemplo HTTP de verificación y reserva (curl):

	```bash
	# 1) check availability
	curl -X POST -H "Content-Type: application/json" -d '{"items": [{"producto_id":"sku-1","cantidad":2},{"producto_id":"sku-2","cantidad":1}]}' \
	  https://<catalog>/productos/stock/check

	# 2) reserve
	curl -X POST -H "Content-Type: application/json" -d '{"reservationId":"order-<uuid>","items":[{"producto_id":"sku-1","cantidad":2}]}' \
	  https://<catalog>/productos/stock/reserve
	```

	Pseudocódigo (NestJS) en `orders.service.ts`:

	```ts
	async createOrderFromCart(userId: string, cartId: string, payload: any) {
	  const cart = await this.cartService.get(cartId);
	  const items = cart.items.map(i => ({ producto_id: i.producto_id, cantidad: i.cantidad }));

	  // 1) check
	  const check = await this.catalogClient.post('/productos/stock/check', { items });
	  if (check.data.errors && check.data.errors.length) throw new BadRequestException('Stock insuficiente');

	  // 2) reserve
	  const reservationId = `order:${uuidv4()}`;
	  const reserve = await this.catalogClient.post('/productos/stock/reserve', { reservationId, items });
	  if (!reserve.data.ok) throw new ConflictException('No se pudo reservar stock');

	  // 3) crear order dentro de transacción local
	  try {
	    await this.db.transaction(async (em) => {
	      const order = await em.save(OrderEntity.create({ ...snapshot, reservationId }));
	      // crear detalle_pedido con snapshot de precio
	    });
	  } catch (err) {
	    // 4) si falla, liberar reserva
	    await this.catalogClient.post('/productos/stock/release', { reservationId });
	    throw err;
	  }

	  // 5) confirmar reserva (commit)
	  await this.catalogClient.post('/productos/stock/commit', { reservationId });
	  return { success: true };
	}
	```

	Consideraciones operativas
	- Idempotencia: usa `reservationId`/`requestId` en todas las llamadas hacia `catalog` para poder reintentar sin duplicar reservas.
	- Timeouts y TTL: las reservas deben expirar si no se confirman en X minutos.
	- Monitoreo: alertas para reservas que quedan liberadas por fallos frecuentes.
	- Consistencia eventual: si usas colas o procesos asíncronos, muestra estado claro al usuario (p.ej. `EN_PROCESO_DE_RESERVA`).

	Si quieres, implemento un ejemplo real en `src/orders/services/orders.service.ts` y tests simples que simulen respuestas del `catalog`.

5. Pago / Confirmación
	- Si hay integración de pagos, el pedido puede pasar a `PAGADO` tras confirmación.

6. Preparación / Envío / Entrega
	- Transiciones de estados controladas por roles según el flujo (ver sección de estados).

## Máquina de estados (ejemplo)

- `CREADO` → `CONFIRMADO` → `EN_PREPARACION` → `LISTO_PARA_ENVIO` → `EN_RUTA` → `ENTREGADO`
- `CREADO` → `CANCELADO`
- `CONFIRMADO` → `RECHAZADO`

Quién puede disparar transiciones (ejemplo):
- `Vendedor`: puede crear (`CREADO`) y en algunos flujos confirmar (`CONFIRMADO`) si está permitido.
- `Bodeguero`: mover a `EN_PREPARACION` y `LISTO_PARA_ENVIO`.
- `Transportista`: asignarse y marcar `EN_RUTA`/`ENTREGADO`.
- `Admin/Supervisor`: forzar cualquier transición y auditoría.

## Endpoints principales (resumen)

- `GET /cart/:userId` — Obtener carrito (roles: cliente/vendedor propio, admin/supervisor).
- `POST /cart/:userId/items` — Añadir/actualizar item (cliente/vendedor propio).
- `DELETE /cart/:userId/items/:itemId` — Eliminar item.
- `POST /orders` — Crear pedido desde carrito (cliente/vendedor/admin).
- `GET /orders` — Listar pedidos (admin/supervisor; vendedor solo los suyos; cliente solo los suyos).
- `GET /orders/:id` — Obtener pedido (con checks de pertenencia).
- `PATCH /orders/:id` — Actualizar pedido (según estado/rol).
- `PATCH /orders/:id/state` — Cambiar estado (roles según flujo).

En el código se encuentran controladores y servicios en:

- [aplicacion/backend/services/orders/src/orders/controllers/orders.controller.ts](aplicacion/backend/services/orders/src/orders/controllers/orders.controller.ts)
- [aplicacion/backend/services/orders/src/orders/services/orders.service.ts](aplicacion/backend/services/orders/src/orders/services/orders.service.ts)
- [aplicacion/backend/services/orders/src/orders/services/cart.service.ts](aplicacion/backend/services/orders/src/orders/services/cart.service.ts)
- Guards y estrategias de autenticación en: [aplicacion/backend/services/orders/src/auth](aplicacion/backend/services/orders/src/auth)

## Validaciones y checks de pertenencia

- Los endpoints que manipulan pedidos deben comprobar que `req.user.userId` coincide con `pedido.vendedor_id` o `pedido.cliente_id` cuando corresponda. Ver guardias/ownership en `src/common/guards`.
- Las llamadas a `catalog` deben realizarse para asegurar que el `producto_id` existe y para tomar el `precio_unitario` actual.

## Integraciones

- `catalog` para datos de producto y stock.
- `usuarios-service` para validar `cliente_id` y obtener datos de usuario (nombre, teléfono).
- Opcional: servicio de pagos para procesar cobros.

## Auditoría y triggers DB

Se sugiere mantener triggers DB para auditoría y un campo `current_user` en transacciones (como se hace en otros servicios). Ver `infra/local-init/05-init-orders.sql` para scripts iniciales y ejemplos.

## Ejemplos prácticos (curl)

1) Obtener carrito:

```bash
curl -H "Authorization: Bearer <TOKEN>" \
  https://<baseURL>/cart/<USER_ID>
```

2) Añadir item al carrito:

```bash
curl -X POST -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{"producto_id": "sku-123", "cantidad": 2}' \
  https://<baseURL>/cart/<USER_ID>/items
```

3) Convertir carrito a pedido:

```bash
curl -X POST -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{"cartId": "<CART_ID>", "direccion_entrega": "Calle Falsa 123"}' \
  https://<baseURL>/orders
```

## Comandos para desarrollo

```bash
cd aplicacion/backend/services/orders
npm install
npm run build
npm run start:dev
```

Docker (ejemplo):

```bash
docker build -t orders-service .
docker run -e DB_HOST=host.docker.internal -e DB_USER=admin -e DB_PASSWORD=root -e DB_NAME=orders_db -p 3000:3000 orders-service
```

## Pruebas recomendadas

- Tests unitarios para `cart.service` y `orders.service` (validaciones de negocio).
- Tests de integración simulando `catalog` y `usuarios` (mocks o servicios locales).
- Tests de permisos: asegurar que cada rol ve/edita lo que le corresponde.

## Notas finales

- Mantener snapshots de precios en `DetallePedido` para evitar diferencias por cambios de precio posteriores.
- Documentar claramente las restricciones de cada estado en el código y en la API.

Si quieres, puedo añadir ejemplos concretos de payloads, tests Jest iniciales o un diagrama de estados más detallado.


Orders microservice

This service implements Orders, Carts and related tables.

Database initialization script is at: `aplicacion/infra/local-init/05-init-orders.sql`.

Basic commands:

```bash
cd aplicacion/backend/services/orders
npm install
npm run build
npm run start:dev
```

Docker build/run:

```bash
docker build -t orders-service .
docker run -e DB_HOST=host.docker.internal -e DB_USER=admin -e DB_PASSWORD=root -e DB_NAME=orders_db -p 3000:3000 orders-service
```

Roles y permisos (resumen)
--------------------------------
- Admin: Crear/editar/eliminar pedidos, cambiar estados, ver todo, auditoría.
- Supervisor: Aprobar/rechazar/anular pedidos, cambiar estados, ver historial y auditoría.
- Bodeguero: Ver pedidos pendientes de preparación, no puede cambiar estados.
- Vendedor: Crear/editar carritos y pedidos propios, ver sus pedidos, aplicar promociones y crear pedidos para clientes.
- Transportista: Ver pedidos en ruta asignados, no editar.
- Cliente: Ver sus pedidos y estado, crear/editar su carrito y convertirlo en pedido (no editar pedidos de otros).

Endpoints principales y permisos
--------------------------------
- `GET /orders` — Listar pedidos (Admin, Supervisor; vendedores ven solo los suyos; transportista/cliente filtrado).
- `GET /orders/:id` — Ver pedido (roles con acceso según relación usuario-pedido o privilegios).
- `POST /orders` — Crear pedido (Vendedor para sus clientes, Cliente para su cuenta, Admin/Supervisor para crear manualmente).
- `PATCH /orders/:id` — Actualizar pedido (Admin permite editar; Vendedor solo si es suyo y estado lo permite).
- `PATCH /orders/:id/state` — Cambiar estado (Admin y Supervisor; Bodeguero/Transportista solo en acciones permitidas por flujo).
- `POST /orders/:id/detalles` — Añadir detalle a pedido (Vendedor/Cliente sobre su pedido o Admin).
- `GET /cart/:userId` — Obtener carrito del usuario (Vendedor/Cliente propio; Admin/Supervisor ver todo).
- `POST /cart/:userId` — Añadir/actualizar artículo en carrito (Cliente/Vendedor propio).

Cómo empezar a implementar esto en los microservicios
-----------------------------------------------------
1. Autenticación y roles:
	- Todos los servicios usan JWT firmado por `usuarios-service`.
	- El `roles` o `rolId` debe estar presente en el payload del token.
	- Implementar un `RolesGuard` compartido (ya existe en `catalog`/`usuarios`) que compruebe roles y permita rutas.

2. En `orders`:
	- Añadir guards en los controladores: `@UseGuards(AuthGuard('jwt'), RolesGuard)` y `@Roles(...)` en las rutas según la tabla anterior.
	- Para operaciones que dependen de la relación usuario-pedido (p. ej. vendedor solo ve/edita sus pedidos), comprobar `req.user.userId` frente a `pedido.vendedor_id`.

3. Integración con `catalog` y `usuarios`:
	- `orders` consultará `catalog` para obtener información de producto (precio referencia, SKU) si es necesario.
	- `orders` puede validar que un `cliente_id` o `vendedor_id` exista consultando `usuarios-service` o usando datos locales sincronizados.
	- Preferir llamadas HTTP internas con credenciales de servicio (o un JWT de servicio) para validaciones entre microservicios.

4. Auditoría y triggers DB:
	- La base de datos del servicio incluye triggers de auditoría (ver `infra/local-init/05-init-orders.sql`).
	- Asegurar que las operaciones que requieren `app.current_user` o similar pasen el contexto (por ejemplo usando `SET LOCAL app.current_user = '<uuid>'` antes de transacciones si se usa DB-level auditing).

5. Pruebas y despliegue:
	- Añadir tests para permisos (asegurar que cada rol solo pueda lo permitido).
	- Levantar en Docker Compose junto a `database`, `usuarios-service` y `catalog-service` para pruebas integradas.

Siguientes pasos recomendados
----------------------------
- Implementar `RolesGuard` y decoradores en `orders` si aún no existen.
- Añadir validaciones en controladores para chequear pertenencia (vendedor/cliente) antes de modificar pedidos.
- Crear endpoints de rutero y notificaciones (pg_notify) cuando el pedido cambie a `EN_RUTA` o `ENTREGADO`.


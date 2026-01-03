Servicio de Catálogo (svc-catalog)

Prefijo de la API: `/api`

Este README documenta las rutas principales y las reglas de acceso por roles añadidas al microservicio de catálogo.

Ejecución rápida
----------------

```bash
cd aplicacion/backend/services/catalog
npm install
npm run start:dev
```

Variables de entorno
--------------------
- `DB_HOST` (por defecto: `database`)
- `DB_PORT` (por defecto: `5432`)
- `DB_USER` (por defecto: `admin`)
- `DB_PASSWORD` (por defecto: `root`)
- `DB_NAME` (por defecto: `catalog_db`)
- `JWT_SECRET` — secreto compartido con el servicio `usuarios`

Resumen de la API (rutas importantes)
------------------------------------

Categorías
- `GET /api/categories` — listar categorías (público)
- `GET /api/categories/:id` — obtener categoría por id (público)
- `POST /api/categories` — crear (requiere `supervisor` o `admin`)
- `PUT /api/categories/:id` — actualizar (requiere rol)
- `DELETE /api/categories/:id` — eliminación lógica (requiere `admin`)

Productos
- `GET /api/products` — listar productos (lectura permitida para ciertos roles como `bodeguero`)
- `GET /api/products/:id` — obtener producto por UUID (acceso de solo lectura para roles permitidos)
- `POST /api/products` — crear producto (requiere `supervisor`/`admin`)
- `PUT /api/products/:id` — actualizar producto (requiere `supervisor`/`admin`)
- `DELETE /api/products/:id` — eliminación lógica (requiere `supervisor`/`admin`)

Precios
- `POST /api/precios` — asignar o actualizar un precio para la combinación (productoId + listaId). Requiere `supervisor` o `admin`.
- `GET /api/precios/producto/:id` — ver precios de un producto.
  - Reglas de acceso: `admin`, `supervisor` y `vendedor` pueden ver todos los precios del producto.
  - Si el solicitante es `cliente`, la respuesta se limita a los precios de la `lista_precios_id` asignada al cliente (si no tiene lista asignada devuelve `[]`).

Promociones
- `GET /api/promociones` — listar campañas (legible por `admin`, `supervisor`, `vendedor` y `cliente`)
- `GET /api/promociones/:id` — obtener detalles de la campaña (legible por los mismos roles)
- `GET /api/promociones/:id/productos` — listar productos en una campaña (legible por los mismos roles)
- `POST/PUT/DELETE` — requieren `supervisor` o `admin` según el endpoint.

Rutero (visitas planificadas)
- `GET /api/rutero` — listar todas las entradas del rutero (uso interno)
- `GET /api/rutero/cliente/:id` — entradas del rutero para un cliente específico
- `GET /api/rutero/mio` — devuelve el rutero planificado para el `vendedor` autenticado (rol `vendedor`). Requiere autenticación.

Clientes
- `GET /api/clientes` — listar clientes (legible por `admin`, `supervisor`, `transportista`)
- `GET /api/clientes/:id` — detalles de cliente (legible por `admin`, `supervisor`, `vendedor`, `transportista`)
- `GET /api/clientes/mis` — devuelve los clientes asignados al `vendedor` autenticado (rol `vendedor`). Requiere autenticación.
- Crear/actualizar/eliminar requieren `supervisor`/`admin` según el endpoint.

Zonas
- `GET /api/zonas` y `GET /api/zonas/:id` — legible por `admin`, `supervisor`, `transportista`.

Roles y mapeo numérico (IDs usados por el servicio `usuarios`)
- `admin` = 1
- `supervisor` = 2
- `bodeguero` = 3 (acceso de solo lectura a productos para gestión de stock)
- `vendedor` = 4 (puede ver productos, precios, promociones, clientes asignados y su rutero)
- `transportista` = 5 (puede ver clientes y zonas para entregas)
- `cliente` = 6 (puede ver productos, promociones y precios limitados a su lista de precios asignada)

Autenticación
-------------
El servicio valida JWT firmados por el servicio `usuarios`. Los endpoints protegidos requieren la cabecera:

```
Authorization: Bearer <access_token>
```

Ejemplos
--------

Obtener rutero del vendedor (reemplazar TOKEN):

```bash
curl -H "Authorization: Bearer <TOKEN>" http://localhost:3000/api/rutero/mio
```

Obtener precios como cliente (se limitarán a la lista asignada):

```bash
curl -H "Authorization: Bearer <CLIENT_TOKEN>" http://localhost:3000/api/precios/producto/<PRODUCT_ID>
```

Notas
-----
- Los triggers de auditoría en la base de datos esperan que las operaciones propaguen el usuario actor (desde el JWT) cuando sea necesario.
- En la configuración local con Docker Compose, el servicio `catalog` suele exponerse en el puerto de host `3002` (contenedor 3000).

Contacto
-------
Para dudas o mejoras, abra un issue o contacte al equipo de backend.


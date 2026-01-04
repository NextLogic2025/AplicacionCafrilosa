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

Adicionales (CRUD listas y listados avanzados)
- `GET /api/precios/listas` — listar todas las listas de precios. Requiere `admin` o `supervisor`.
- `POST /api/precios/listas` — crear una nueva lista de precios. Requiere `admin`.
- `PATCH /api/precios/listas/:id` — actualizar nombre de lista. Requiere `admin`.
- `DELETE /api/precios/listas/:id` — eliminar lista. Requiere `admin`.
- `GET /api/precios/lista/:id/productos` — listar sólo los productos que tengan precio definido en la lista `:id` (INNER JOIN). Útil para clientes que sólo quieren ver productos con precio en su lista.
- `GET /api/precios/lista/:id/productos-all` — listar todos los productos del catálogo y, si existe, el precio correspondiente para la lista `:id` (LEFT JOIN). Diseñado para supervisores que necesitan ver todo el catálogo con su precio asignado cuando aplique.

Ejemplos de uso (JSON)

Aquí tienes ejemplos de payloads JSON para los endpoints más usados. En los endpoints protegidos añade cabecera `Authorization: Bearer <ACCESS_TOKEN>` y `Content-Type: application/json`.

- Crear categoría — `POST /api/categories`

```json
{
  "nombre": "Mortadelas",
  "descripcion": "Línea de mortadelas clásicas y gourmet",
  "imagen_url": "https://cdn.ejemplo.com/img/mortadela.jpg",
  "activo": true
}
```

- Actualizar categoría — `PUT /api/categories/:id`

```json
{
  "nombre": "Mortadelas Premium",
  "descripcion": "Actualizado",
  "activo": true
}
```

- Crear producto — `POST /api/products`

```json
{
  "codigo_sku": "MORT-ESPEC",
  "nombre": "Mortadela Especial",
  "descripcion": "Mortadela clásica en piezas",
  "categoria_id": 1,
  "peso_unitario_kg": 4.5,
  "requiere_frio": true,
  "unidad_medida": "KG",
  "imagen_url": "https://cdn.ejemplo.com/img/prod.png"
}
```

- Actualizar producto — `PUT /api/products/:id`

```json
{
  "nombre": "Mortadela Especial (nuevo empaque)",
  "peso_unitario_kg": 4.6,
  "activo": true
}
```

- Asignar/actualizar precio — `POST /api/precios`

```json
{
  "productoId": "a1b2c3d4-1111-2222-3333-uuid-del-producto",
  "listaId": 2,
  "precio": 12500.50
}
```

- Crear lista de precios — `POST /api/precios/listas`

```json
{
  "nombre": "Mayorista"
}
```

- Actualizar lista de precios — `PATCH /api/precios/listas/:id`

```json
{
  "nombre": "Mayorista - Renovada"
}
```

- Listar sólo productos con precio en una lista — `GET /api/precios/lista/:id/productos` (no body)

- Listar todos los productos con precio asignado cuando aplique — `GET /api/precios/lista/:id/productos-all` (no body)

- Crear promoción — `POST /api/promociones`

```json
{
  "nombre": "Promo Verano",
  "descripcion": "10% en productos seleccionados",
  "fecha_inicio": "2026-01-10T00:00:00Z",
  "fecha_fin": "2026-01-31T23:59:59Z",
  "tipo_descuento": "porcentaje",
  "valor_descuento": 10.0,
  "activo": true
}
```

- Crear cliente — `POST /api/clientes`

```json
{
  "identificacion": "1234567890",
  "tipo_identificacion": "RUC",
  "razon_social": "Cliente S.A.",
  "nombre_comercial": "ClienteCom",
  "lista_precios_id": 2,
  "vendedor_asignado_id": "b2c3d4e5-aaaa-bbbb-cccc-uuid-vendedor",
  "zona_comercial_id": 1,
  "direccion_texto": "Av. Principal 123"
}
```

- Crear entrada de rutero — `POST /api/rutero`

```json
{
  "cliente_id": "a1b2c3d4-1111-2222-3333-uuid-del-cliente",
  "zona_id": 1,
  "dia_semana": 2,
  "frecuencia": "SEMANAL",
  "hora_estimada_arribo": "09:30:00"
}
```

Ejemplo de headers para endpoints protegidos:

```
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json
```

Notas de seguridad
- Todos los endpoints protegidos requieren cabecera `Authorization: Bearer <access_token>` con un token que contenga roles o `rolId` correcto.
- Para listados que dependen del rol (`cliente` vs `supervisor`), la API determina la visibilidad leyendo el `role` o `rolId` del JWT.

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


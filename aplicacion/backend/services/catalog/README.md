Catalog microservice (svc-catalog)

- API prefix: `/api`
- Endpoints:
  - `GET /api/products`
  - `GET /api/products/:id`
  - `POST /api/products`
  - `PUT /api/products/:id`
  - `DELETE /api/products/:id` (soft delete)
  - `GET /api/categories` etc.

Env vars:
- `DB_HOST` (default: `database`)
- `DB_PORT` (default: `5432`)
- `DB_USER` (default: `admin`)
- `DB_PASSWORD` (default: `root`)
- `DB_NAME` (default: `catalog_db`)

To run locally:

```bash
cd backend/services/catalog
npm install
npm run start:dev
```

Endpoints (details)

- Categories
  - `GET /api/categories` — list active categories (no auth required)
  - `GET /api/categories/:id` — get one category by numeric id
  - `POST /api/categories` — create category (requires JWT role `supervisor` or `admin`)
    - Body JSON: { "nombre": "Bebidas", "descripcion": "Bebidas frías", "imagen_url": "https://...", "activo": true }
  - `PUT /api/categories/:id` — update category (requires role)
    - Body: partial same as above
  - `DELETE /api/categories/:id` — soft-delete (requires role)

- Products
  - `GET /api/products` — list products (excludes soft-deleted)
  - `GET /api/products/:id` — get product by UUID
  - `POST /api/products` — create product (requires auth role: `supervisor`/`admin`)
    - Body JSON example:
      {
        "codigo_sku": "SKU-1001",
        Servicio Catalog (svc-catalog)

        Breve descripción
        ------------------
        Servicio micro de catálogo para gestionar productos, categorías y listas de precios. Expone una API REST bajo el prefijo `/api` y valida JWT emitidos por el servicio `usuarios`.

        Requisitos
        ----------
        - Node.js 18+ (recomendado)
        - PostgreSQL (la composición local usa PostGIS en `database`)

        Variables de entorno
        --------------------
        - `DB_HOST` (por defecto: `database`)
        - `DB_PORT` (por defecto: `5432`)
        - `DB_USER` (por defecto: `admin`)
        - `DB_PASSWORD` (por defecto: `root`)
        - `DB_NAME` (por defecto: `catalog_db`)
        - `JWT_SECRET` — secreto compartido con el servicio `usuarios` para validar access tokens

        Instalación y ejecución local
        -----------------------------
        1. Instalar dependencias:

        ```bash
        cd aplicacion/backend/services/catalog
        npm install
        ```

        2. Ejecutar en modo desarrollo:

        ```bash
        npm run start:dev
        ```

        Con Docker Compose (desde la raíz `aplicacion`):

        ```bash
        docker compose up --build
        ```

        Rutas principales
        ------------------
        Prefijo de la API: `/api`

        Categorías
        - `GET /api/categories` — listar categorías activas (pública)
        - `GET /api/categories/:id` — obtener categoría por id numérico
        - `POST /api/categories` — crear categoría (requiere JWT con rol `supervisor` o `admin`)
        - `PUT /api/categories/:id` — actualizar categoría (requiere rol)
        - `DELETE /api/categories/:id` — eliminación lógica (requiere rol)

        Productos
        - `GET /api/products` — listar productos (excluye borrados lógicos)
        - `GET /api/products/:id` — obtener producto por UUID
        - `POST /api/products` — crear producto (requiere rol `supervisor`/`admin`)
        - `PUT /api/products/:id` — actualizar producto (requiere rol)
        - `DELETE /api/products/:id` — eliminación lógica (requiere rol)

        Precios (nuevo módulo)
        - `POST /api/precios` — asignar o actualizar un precio para una combinación (productoId + listaId). Requiere JWT con rol `supervisor` o `admin`.
          - Body JSON: { "productoId": "UUID-DE-TU-PRODUCTO", "listaId": 2, "precio": 0.85 }
        - `GET /api/precios/producto/:id` — obtener todos los precios asignados a un producto (incluye nombre de la lista). Público por defecto.

        Ejemplo de cuerpo para crear/actualizar precio
        ```json
        {
          "productoId": "UUID-DE-TU-BOTELLA",
          "listaId": 2,
          "precio": 0.85
        }
        ```

        Ejemplo de cuerpo para crear producto
        ```json
        {
          "codigo_sku": "SKU-1001",
          "nombre": "Coca Cola 500ml",
          "descripcion": "Refresco",
          "categoria_id": 1,
          "peso_unitario_kg": 0.5,
          "volumen_m3": 0.0005,
          "requiere_frio": false,
          "unidad_medida": "UNIDAD",
          "imagen_url": null,
          "activo": true
        }
        ```

        Autenticación
        --------------
        El servicio valida JWT firmados por el servicio `usuarios`. Los endpoints protegidos requieren el header:

        ```
        Authorization: Bearer <access_token>
        ```

        En la configuración local de `docker-compose` el servicio `catalog` suele exponerse en el puerto `3002` del host (mappeado al `3000` del contenedor).

        Flujo rápido (Postman / curl)
        ----------------------------
        1) Obtener token (desde el servicio `usuarios`):

        - POST http://localhost:3001/auth/login
        - Body (JSON): { "email": "supervisor@example.com", "password": "secret" }
        - Copiar `access_token` del response

        2) Crear una categoría (con token):

        - POST http://localhost:3002/api/categories
        - Headers: `Authorization: Bearer <access_token>` y `Content-Type: application/json`
        - Body: usar el JSON de ejemplo de categoría

        3) Crear/actualizar precio (con token):

        - POST http://localhost:3002/api/precios
        - Headers: `Authorization: Bearer <access_token>` y `Content-Type: application/json`
        - Body: usar el JSON de ejemplo de precio

        Ejemplo curl para asignar precio (Mayorista listaId=2)
        ```bash
        curl -X POST http://localhost:3002/api/precios \
          -H "Authorization: Bearer <TOKEN>" \
          -H "Content-Type: application/json" \
          -d '{"productoId":"UUID-DE-TU-BOTELLA","listaId":2,"precio":0.85}'
        ```

        Ejemplo curl para listar precios de un producto (público)
        ```bash
        curl http://localhost:3002/api/precios/producto/<UUID-PRODUCTO>
        ```

        Notas y recomendaciones
        -----------------------
        - Auditoría: el esquema de BD incluye triggers para auditoría. Para que el campo `changed_by` registre al usuario, las operaciones deben propagar la información del usuario validado (desde el JWT) al crear/actualizar registros.
        - Seguridad: en producción gestione `JWT_SECRET` con un gestor de secretos (Secret Manager, Vault) y considere mecanismos adicionales para invalidación inmediata de access tokens (blacklist con Redis o uso de `jti` más corto).

        Contacto
        -------
        Para dudas o mejoras, abra un issue o contacte al equipo backend.

        Licencia
        -------
        Código y configuración interna del proyecto.

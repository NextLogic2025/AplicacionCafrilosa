# Warehouse Service - Cafrilosa

Microservicio de gestión de almacén para el sistema Cafrilosa.

## Características

- ✅ Gestión completa de almacenes y ubicaciones
- ✅ Control de lotes con FEFO (First Expired, First Out)
- ✅ Stock en tiempo real con reservas
- ✅ Sistema de picking con sugerencias inteligentes
- ✅ Kardex completo de movimientos
- ✅ Gestión de devoluciones
- ✅ Auditoría automática
- ✅ Autenticación JWT
- ✅ Control de permisos por rol

## Tecnologías

- **NestJS 10** - Framework backend
- **TypeORM 0.3** - ORM para PostgreSQL
- **PostgreSQL 14+** - Base de datos principal
- **Passport JWT** - Autenticación
- **Class Validator** - Validación de DTOs
- **Docker** - Containerización

## Instalación

### 1. Crear base de datos

Conectarse a PostgreSQL y ejecutar:

```sql
-- Ejecutar el script almacen.sql proporcionado
-- Este crea todas las tablas, índices, triggers y funciones necesarias
```

### 2. Configurar variables de entorno

Copiar `.env.example` a `.env` y configurar:

```bash
NODE_ENV=development
PORT=3005
DATABASE_URL=postgresql://admin:root@localhost:5432/warehouse_db
JWT_SECRET=MiSecretoSuperSeguro2025
JWT_EXPIRES_IN=1h
CATALOG_SERVICE_URL=http://catalog-service:3000
ORDERS_SERVICE_URL=http://orders-service:3000
```

### 3. Instalar dependencias

```bash
npm install
```

### 4. Ejecutar en desarrollo

```bash
npm run start:dev
```

El servicio estará disponible en `http://localhost:3005/api`

## Despliegue con Docker

### Actualizar docker-compose.yml

Agregar al archivo `docker-compose.yml` existente:

```yaml
  warehouse-service:
    build:
      context: ./backend/services/warehouse
      dockerfile: Dockerfile
    container_name: warehouse-service
    restart: on-failure
    ports:
      - "3005:3000"
    environment:
      - NODE_ENV=development
      - PORT=3000
      - DATABASE_URL=postgres://admin:root@database:5432/warehouse_db
      - JWT_SECRET=MiSecretoSuperSeguro2025
      - JWT_EXPIRES_IN=1h
      - CATALOG_SERVICE_URL=http://catalog-service:3000
      - ORDERS_SERVICE_URL=http://orders-service:3000
    depends_on:
      - database
    networks:
      - app-network
```

### Levantar servicios

```bash
docker-compose up -d warehouse-service
```

## Testing con Postman

### 1. Importar colección

Importar el archivo JSON de la colección de Postman proporcionada.

### 2. Flujo de prueba completo

#### Paso 1: Autenticación

```http
POST {{auth_url}}/auth/login
Content-Type: application/json

{
  "email": "admin@cafrilosa.com",
  "password": "admin123"
}
```

El token se guarda automáticamente en la variable `access_token`.

#### Paso 2: Crear Almacén

```http
POST {{base_url}}/almacenes
Authorization: Bearer {{access_token}}

{
  "nombre": "Almacén Principal",
  "codigoRef": "ALM-001",
  "requiereFrio": false,
  "direccionFisica": "Av. Principal 123, Guayaquil"
}
```

#### Paso 3: Crear Ubicaciones

```http
POST {{base_url}}/ubicaciones
Authorization: Bearer {{access_token}}

{
  "almacenId": 1,
  "codigoVisual": "A-01-01",
  "tipo": "RACK",
  "capacidadMaxKg": 500,
  "esCuarentena": false
}
```

#### Paso 4: Crear Lotes

```http
POST {{base_url}}/lotes
Authorization: Bearer {{access_token}}

{
  "productoId": "11111111-1111-1111-1111-111111111111",
  "numeroLote": "LOT-2025-001",
  "fechaFabricacion": "2025-01-01",
  "fechaVencimiento": "2025-12-31",
  "estadoCalidad": "LIBERADO"
}
```

#### Paso 5: Registrar Stock

```http
POST {{base_url}}/stock
Authorization: Bearer {{access_token}}

{
  "ubicacionId": "{{ubicacion_id}}",
  "loteId": "{{lote_id}}",
  "cantidadFisica": 100
}
```

#### Paso 6: Crear Orden de Picking

```http
POST {{base_url}}/picking
Authorization: Bearer {{access_token}}

{
  "pedidoId": "33333333-3333-3333-3333-333333333333",
  "items": [
    {
      "productoId": "11111111-1111-1111-1111-111111111111",
      "cantidad": 10
    }
  ]
}
```

#### Paso 7: Procesar Picking

1. **Asignar bodeguero:**
```http
PUT {{base_url}}/picking/{{picking_id}}/asignar
{
  "bodegueroId": "44444444-4444-4444-4444-444444444444"
}
```

2. **Iniciar picking:**
```http
POST {{base_url}}/picking/{{picking_id}}/iniciar
```

3. **Completar picking:**
```http
POST {{base_url}}/picking/{{picking_id}}/completar
```

#### Paso 8: Verificar Kardex

```http
GET {{base_url}}/kardex/producto/11111111-1111-1111-1111-111111111111
Authorization: Bearer {{access_token}}
```

## Endpoints Disponibles

### Almacenes
- `GET /api/almacenes` - Listar almacenes
- `GET /api/almacenes/:id` - Obtener almacén
- `POST /api/almacenes` - Crear almacén (Admin)
- `PUT /api/almacenes/:id` - Actualizar almacén (Admin)
- `DELETE /api/almacenes/:id` - Eliminar almacén (Admin)

### Ubicaciones
- `GET /api/ubicaciones` - Listar ubicaciones
- `GET /api/ubicaciones?almacen_id=1` - Ubicaciones por almacén
- `GET /api/ubicaciones/:id` - Obtener ubicación
- `POST /api/ubicaciones` - Crear ubicación (Admin/Supervisor)
- `PUT /api/ubicaciones/:id` - Actualizar ubicación
- `DELETE /api/ubicaciones/:id` - Eliminar ubicación

### Lotes
- `GET /api/lotes` - Listar lotes
- `GET /api/lotes?producto_id=uuid` - Lotes por producto
- `GET /api/lotes/:id` - Obtener lote
- `POST /api/lotes` - Crear lote (Bodeguero)
- `PUT /api/lotes/:id` - Actualizar lote
- `DELETE /api/lotes/:id` - Eliminar lote

### Stock
- `GET /api/stock` - Listar stock
- `GET /api/stock/producto/:id` - Stock por producto
- `GET /api/stock/ubicacion/:id` - Stock por ubicación
- `POST /api/stock` - Registrar stock inicial (Bodeguero)
- `POST /api/stock/ajustar` - Ajustar stock (Bodeguero)

### Picking
- `GET /api/picking` - Listar ordenes
- `GET /api/picking/mis-ordenes` - Mis ordenes (Bodeguero)
- `GET /api/picking/:id` - Obtener orden
- `POST /api/picking` - Crear orden (Supervisor)
- `PUT /api/picking/:id/asignar` - Asignar bodeguero
- `POST /api/picking/:id/iniciar` - Iniciar picking
- `POST /api/picking/:id/completar` - Completar picking
- `POST /api/picking/:id/items/:itemId/pickear` - Pickear item

### Kardex
- `GET /api/kardex` - Consultar kardex
- `GET /api/kardex/producto/:id` - Kardex por producto
- `GET /api/kardex/lote/:id` - Kardex por lote
- `GET /api/kardex/tipo/:tipo` - Kardex por tipo

### Devoluciones
- `GET /api/devoluciones` - Listar devoluciones
- `GET /api/devoluciones/:id` - Obtener devolución
- `POST /api/devoluciones` - Registrar devolución
- `PUT /api/devoluciones/:id/procesar` - Procesar devolución
- `DELETE /api/devoluciones/:id` - Eliminar devolución

## Permisos por Rol

| Rol | Permisos |
|-----|----------|
| **Admin** | Acceso completo a todo |
| **Supervisor** | Crear/editar almacenes, ubicaciones, asignar picking, aprobar devoluciones, ver auditoría |
| **Bodeguero** | Realizar picking, registrar stock, actualizar lotes, procesar devoluciones |
| **Vendedor** | Solo consultar stock disponible |
| **Transportista** | Sin acceso |
| **Cliente** | Sin acceso |

## Arquitectura

```
src/
├── almacenes/          # Gestión de almacenes físicos
├── ubicaciones/        # Gestión de ubicaciones (racks, etc)
├── lotes/              # Control de lotes y vencimientos
├── stock/              # Inventario en tiempo real
├── picking/            # Órdenes de preparación
├── kardex/             # Registro de movimientos
├── devoluciones/       # Gestión de devoluciones
├── auth/               # Guards y strategies JWT
├── config/             # Configuración global
├── health/             # Health check
├── app.module.ts
└── main.ts
```

## Buenas Prácticas Implementadas

✅ **Seguridad:**
- JWT en todos los endpoints protegidos
- Validación de roles granular
- Validación de DTOs con class-validator
- SQL injection prevention via TypeORM

✅ **Performance:**
- Índices optimizados en BD
- Consultas con eager loading selectivo
- Paginación donde corresponde

✅ **Mantenibilidad:**
- Arquitectura modular
- Separación de concerns
- Código limpio sin comentarios basura
- DTOs tipados

✅ **Trazabilidad:**
- Kardex automático
- Auditoría de cambios
- Registro de usuario responsable

## Troubleshooting

### Error: "Cannot connect to database"
Verificar que:
1. PostgreSQL está corriendo
2. La base de datos `warehouse_db` existe
3. Las credenciales en `.env` son correctas

### Error: "Unauthorized"
- Verificar que el token JWT sea válido
- Hacer login nuevamente para obtener un token fresco

### Error: "Stock insuficiente"
- Verificar el stock disponible: `cantidad_fisica - cantidad_reservada`
- Ajustar stock si es necesario con el endpoint `/api/stock/ajustar`

## Soporte

Para reportar issues o solicitar features, contactar al equipo de desarrollo.
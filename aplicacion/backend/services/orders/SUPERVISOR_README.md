# Guía de Supervisor - Servicio de Órdenes

## 📋 Descripción General

El rol **Supervisor** en el servicio de órdenes tiene permisos para gestionar, revisar y autorizar pedidos en el sistema. Los supervisores pueden ver todos los pedidos del sistema, aprobar o rechazar órdenes, y cambiar sus estados.

---

## 🔐 Permisos del Supervisor

El supervisor tiene acceso a los siguientes endpoints:

### 1. **Listar Todos los Pedidos**
```
GET /orders
```

**Descripción:** Obtiene una lista de todos los pedidos del sistema.

**Headers requeridos:**
```
Authorization: Bearer <JWT_TOKEN_SUPERVISOR>
Content-Type: application/json
```

**Respuesta exitosa (200):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "cliente_id": "550e8400-e29b-41d4-a716-446655440001",
    "vendedor_id": "550e8400-e29b-41d4-a716-446655440002",
    "estado_actual": "PENDIENTE",
    "total": 1500.00,
    "descuento_total": 150.00,
    "impuesto_total": 180.00,
    "condicion_pago": "CREDITO",
    "ubicacion_pedido": "Calle Principal 123, Zona 1",
    "created_at": "2026-01-14T10:30:00.000Z",
    "updated_at": "2026-01-14T10:30:00.000Z",
    "detalles": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440003",
        "producto_id": "550e8400-e29b-41d4-a716-446655440004",
        "codigo_sku": "SKU-001",
        "nombre_producto": "Café Premium",
        "cantidad": 10,
        "precio_original": 100.00,
        "precio_unitario": 90.00,
        "descuento": 10.00
      }
    ]
  }
]
```

---

### 2. **Ver Todos los Pedidos de un Cliente**
```
GET /orders/client/:userId
```

**Descripción:** Obtiene todos los pedidos asociados a un cliente específico (como cliente o como vendedor).

**Parámetros:**
- `:userId` - UUID del cliente

**Ejemplo:**
```
GET /orders/client/550e8400-e29b-41d4-a716-446655440001
```

**Respuesta exitosa (200):** Array de pedidos del cliente

---

### 3. **Ver Detalles de un Pedido Específico**
```
GET /orders/:id
```

**Descripción:** Obtiene la información completa de un pedido incluyendo sus detalles de línea.

**Parámetros:**
- `:id` - UUID del pedido

**Ejemplo:**
```
GET /orders/550e8400-e29b-41d4-a716-446655440000
```

**Respuesta exitosa (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "cliente_id": "550e8400-e29b-41d4-a716-446655440001",
  "vendedor_id": "550e8400-e29b-41d4-a716-446655440002",
  "estado_actual": "PENDIENTE",
  "total": 1500.00,
  "descuento_total": 150.00,
  "impuesto_total": 180.00,
  "condicion_pago": "CREDITO",
  "ubicacion_pedido": "Calle Principal 123, Zona 1",
  "created_at": "2026-01-14T10:30:00.000Z",
  "updated_at": "2026-01-14T10:30:00.000Z",
  "detalles": [...]
}
```

---

### 4. **Ver Detalles Profesionales de un Pedido**
```
GET /orders/:id/detail
```

**Descripción:** Obtiene los detalles de un pedido en formato profesional con información transformada para reportes.

**Parámetros:**
- `:id` - UUID del pedido

**Ejemplo:**
```
GET /orders/550e8400-e29b-41d4-a716-446655440000/detail
```

**Respuesta exitosa (200):** Pedido con formato profesional (DTO transformado)

---

### 5. **Ver Seguimiento de un Pedido**
```
GET /orders/:id/tracking
```

**Descripción:** Obtiene el historial de cambios de estado de un pedido con timeline completo.

**Parámetros:**
- `:id` - UUID del pedido

**Ejemplo:**
```
GET /orders/550e8400-e29b-41d4-a716-446655440000/tracking
```

**Respuesta exitosa (200):**
```json
{
  "orderId": "550e8400-e29b-41d4-a716-446655440000",
  "currentStatus": "PENDIENTE",
  "lastUpdate": "2026-01-14T10:30:00.000Z",
  "timeline": [
    {
      "status": "PENDIENTE",
      "time": "2026-01-14T10:30:00.000Z",
      "message": "Pedido creado"
    },
    {
      "status": "APROBADO",
      "time": "2026-01-14T11:00:00.000Z",
      "message": "Aprobado por supervisor"
    }
  ]
}
```

---

### 6. **Cambiar Estado de un Pedido** ⭐ **FUNCIÓN PRINCIPAL**
```
PATCH /orders/:id/status
```

**Descripción:** Cambia el estado de un pedido. Esta es la función principal del supervisor para aprobar o rechazar órdenes.

**Parámetros:**
- `:id` - UUID del pedido

**Body requerido:**
```json
{
  "status": "APROBADO"
}
```

**Estados válidos:**
- `PENDIENTE` - Estado inicial
- `APROBADO` - Aprobado por supervisor ✅
- `EN_PREPARACION` - En preparación en bodega
- `FACTURADO` - Facturado
- `EN_RUTA` - En ruta de entrega
- `ENTREGADO` - Entregado al cliente
- `ANULADO` - Cancelado

**Ejemplo de aprobación:**
```bash
curl -X PATCH http://localhost:3000/orders/550e8400-e29b-41d4-a716-446655440000/status \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"status": "APROBADO"}'
```

**Respuesta exitosa (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "estado_actual": "APROBADO",
  "updated_at": "2026-01-14T11:00:00.000Z",
  "mensaje": "Estado del pedido actualizado a APROBADO"
}
```

**Errores posibles:**
- `404` - Pedido no encontrado
- `400` - Estado inválido
- `403` - Sin permisos (no es admin, supervisor o bodeguero)

---

## 📊 Flujo de Trabajo del Supervisor

```
1. Listar todos los pedidos
   GET /orders

2. Ver detalles de un pedido pendiente
   GET /orders/:id

3. Revisar historial de cambios
   GET /orders/:id/tracking

4. Aprobar o rechazar el pedido
   PATCH /orders/:id/status
   { "status": "APROBADO" }

5. Ver seguimiento posterior
   GET /orders/:id/tracking
```

---

## 🔑 Autenticación

Todos los endpoints requieren un JWT token con:
- `role: "supervisor"`
- Token válido y no expirado

**Ejemplo de header:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📱 Uso en Postman/Cliente HTTP

### Headers Comunes
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Ejemplos cURL

**1. Listar todos los pedidos:**
```bash
curl -X GET http://localhost:3000/orders \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json"
```

**2. Ver un pedido específico:**
```bash
curl -X GET http://localhost:3000/orders/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

**3. Cambiar estado a APROBADO:**
```bash
curl -X PATCH http://localhost:3000/orders/550e8400-e29b-41d4-a716-446655440000/status \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"status": "APROBADO"}'
```

**4. Cambiar estado a EN_PREPARACION:**
```bash
curl -X PATCH http://localhost:3000/orders/550e8400-e29b-41d4-a716-446655440000/status \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"status": "EN_PREPARACION"}'
```

---

## ⚙️ Configuración Requerida

Para que el supervisor funcione correctamente:

1. **JWT Token debe incluir:**
   - `role: "supervisor"`
   - Campo `userId` o `sub` con el ID del usuario

2. **Base de datos debe tener:**
   - Tabla `pedidos` con columnas: id, cliente_id, vendedor_id, estado_actual, etc.
   - Tabla `detalle_pedido` con detalles de línea
   - Tabla `historial_estado` con registro de cambios

3. **Variables de entorno:**
   - `JWT_SECRET` - Para verificar tokens
   - `DATABASE_URL` - Conexión a PostgreSQL

---

## 🎯 Resumen de Permisos

| Acción | Endpoint | Método | Permisos |
|--------|----------|--------|----------|
| Listar todos | `/orders` | GET | admin, supervisor, bodeguero |
| Ver pedidos de cliente | `/orders/client/:userId` | GET | admin, cliente, vendedor, supervisor |
| Ver detalles | `/orders/:id` | GET | admin, vendedor, cliente, bodeguero, supervisor |
| Ver detalles profesionales | `/orders/:id/detail` | GET | admin, vendedor, cliente, supervisor |
| Ver seguimiento | `/orders/:id/tracking` | GET | admin, cliente, vendedor, supervisor |
| **Cambiar estado** | `/orders/:id/status` | PATCH | **admin, supervisor, bodeguero** |

---

## 📞 Soporte

Para más información sobre el servicio de órdenes, consulta:
- [README_ORDERS.md](README_ORDERS.md) - Guía completa del servicio
- [architecture.md](../docs/architecture.md) - Arquitectura del sistema
- [api-contracts.md](../docs/api-contracts.md) - Contratos de API

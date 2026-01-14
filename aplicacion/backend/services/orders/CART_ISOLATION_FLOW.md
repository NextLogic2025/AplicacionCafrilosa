# Cart Isolation & Order Creation Flow

## Problema Resuelto
Cuando cliente y vendedor crean carritos para el mismo cliente, debe haber **dos carritos completamente separados e independientes**. Cada actor solo puede hacer pedido desde **su propio carrito**, nunca tocando el del otro.

---

## Arquitectura: Composite Key

Cada carrito se identifica por:
```
(usuario_id, vendedor_id)
```

- **Cliente carrito**: `(usuario_id=<cliente_usuario>, vendedor_id=NULL)`
- **Vendedor carrito**: `(usuario_id=<cliente_usuario>, vendedor_id=<vendedor_uuid>)`

**Indices en BD** (separados para consultas exactas):
```sql
CREATE INDEX idx_carrito_cliente 
ON carritos_cabecera(usuario_id, vendedor_id) 
WHERE vendedor_id IS NULL AND deleted_at IS NULL;

CREATE INDEX idx_carrito_vendedor 
ON carritos_cabecera(usuario_id, vendedor_id) 
WHERE vendedor_id IS NOT NULL AND deleted_at IS NULL;
```

---

## Flujo: Cliente crea carrito + pedido

### 1. GET /orders/cart/me (cliente)
```typescript
// CartController
@Get('me')
@Roles('admin', 'cliente', 'vendedor')
getMyCart(@Req() req: any) {
  const userId = req?.user?.userId;  // JWT userId
  return this.cartService.getOrCreateCart(userId, undefined);
  //                                                      ^^^
  //                                         vendedor_id = undefined
}
```

**CartService:**
```typescript
async getOrCreateCart(usuario_id: string, vendedor_id?: string) {
  const whereCondition = {
    usuario_id,
    deleted_at: null,
    vendedor_id: null  // Exactamente null para cliente
  };
  
  let cart = await this.cartRepo.findOne({ where: whereCondition });
  
  if (!cart) {
    cart = create({
      usuario_id,
      vendedor_id: null,  // ← Siempre null para cliente
      cliente_id: null    // Se resuelve después desde Catalog
    });
  }
  return cart;
}
```

**Resultado en BD:**
```
carritos_cabecera:
  id: 'uuid1'
  usuario_id: '<cliente_uuid>'
  vendedor_id: NULL          ← Cliente carrito
  cliente_id: '<cliente_uuid>'
```

### 2. POST /orders/from-cart/me (cliente)
```typescript
// OrdersController
@Post('/from-cart/me')
@Roles('admin', 'cliente', 'vendedor')
async createFromMyCart(@Body() body: CreateFromCartDto, @Req() req?: any) {
  const usuarioId = req?.user?.userId;
  const role = req?.user?.role; // 'cliente'
  
  // Pasar vendedor_id = null explícitamente
  return this.ordersService.createFromCart(
    usuarioId,      // usuario_id del carrito
    usuarioId,      // actorUserId (para vendedor_asignado_id lookup)
    role,           // 'cliente'
    sucursal_id,
    condicion_pago,
    null            // ← vendedor_id = null
  );
}
```

**OrdersService:**
```typescript
async createFromCart(
  usuarioIdParam: string,
  actorUserId: string,
  actorRole: string,      // 'cliente'
  sucursal_id?: string,
  condicion_pago?: string,
  vendedorIdParam: null   // ← Explícito: null
) {
  // 1. Busca exactamente este carrito
  const cart = await this.cartService.getOrCreateCart(
    usuarioIdParam,
    vendedorIdParam  // undefined cuando vendedorIdParam=null
  );
  
  // 2. Crea pedido desde este carrito
  // - client_id = usuario_id (cliente mismo)
  // - vendedor_id = resuelto desde Catalog o null
  
  // 3. Limpia el carrito (DELETE items)
  await this.cartService.clearCart(usuarioIdParam, null);
}
```

**Resultado en BD:**
```
pedidos:
  id: '<order_uuid1>'
  cliente_id: '<cliente_uuid>'
  vendedor_id: null (or resolved from Catalog)

carritos_items:
  [vacío - se eliminaron]
```

---

## Flujo: Vendedor crea carrito + pedido para cliente

### 1. GET /orders/cart/client/:clienteId (vendedor)
```typescript
// CartController
@Get('client/:clienteId')
@UseGuards(OrderOwnershipGuard)
@Roles('admin', 'vendedor')
getClientCart(@Param('clienteId') clienteId: string, @Req() req: any) {
  const vendedorId = req?.user?.userId;  // JWT vendedor UUID
  return this.cartService.getOrCreateCart(clienteId, vendedorId);
  //                                                  ^^^^^^^^^^^
  //                                       vendedor_id = JWT vendedor
}
```

**CartService:**
```typescript
async getOrCreateCart(usuario_id: string, vendedor_id: string) {
  // Resuelve usuario_principal_id desde Catalog si vendedor_id presente
  let resolvedUsuarioId = usuario_id;
  if (vendedor_id) {
    const client = await catalog.get('/internal/clients/' + usuario_id);
    resolvedUsuarioId = client.usuario_principal_id;  // ← Correcto usuario
  }
  
  const whereCondition = {
    usuario_id: resolvedUsuarioId,
    deleted_at: null,
    vendedor_id: vendedor_id  // ← Exactamente este vendedor
  };
  
  let cart = await this.cartRepo.findOne({ where: whereCondition });
  
  if (!cart) {
    cart = create({
      usuario_id: resolvedUsuarioId,
      vendedor_id: vendedor_id,  // ← Siempre el vendedor JWT
      cliente_id: usuario_id
    });
  }
  return cart;
}
```

**Resultado en BD:**
```
carritos_cabecera:
  id: 'uuid2'
  usuario_id: '<cliente_usuario_principal>'
  vendedor_id: '<vendedor_uuid>'  ← Vendedor carrito
  cliente_id: '<cliente_uuid>'    ← El cliente del path
```

### 2. POST /orders/from-cart/client/:clienteId (vendedor)
```typescript
// OrdersController
@Post('/from-cart/client/:clienteId')
@UseGuards(OrderOwnershipGuard)
@Roles('admin', 'vendedor')
async createFromClientCart(
  @Param('clienteId') clienteId: string,
  @Body() body: CreateFromCartDto,
  @Req() req?: any
) {
  const vendedorId = req?.user?.userId;
  const role = req?.user?.role;  // 'vendedor'
  
  // Pasar vendedor_id = JWT vendedor explícitamente
  return this.ordersService.createFromCart(
    clienteId,      // usuario_id del carrito (cliente_id del path)
    vendedorId,     // actorUserId (para este vendedor)
    role,           // 'vendedor'
    sucursal_id,
    condicion_pago,
    vendedorId      // ← vendedor_id = JWT vendedor
  );
}
```

**OrdersService:**
```typescript
async createFromCart(
  usuarioIdParam: string,  // cliente_id del path
  actorUserId: string,     // vendedor_id del JWT
  actorRole: string,       // 'vendedor'
  sucursal_id?: string,
  condicion_pago?: string,
  vendedorIdParam: string  // ← Explícito: vendedor UUID
) {
  // 1. Busca exactamente este carrito (usuario_principal, vendedor_id)
  const cart = await this.cartService.getOrCreateCart(
    usuarioIdParam,
    vendedorIdParam  // exacto vendedor_id
  );
  
  // 2. Crea pedido desde este carrito
  // - client_id = clienteId (del path)
  // - vendedor_id = vendedorIdParam (JWT vendedor)
  
  // 3. Limpia solo este carrito
  await this.cartService.clearCart(usuarioIdParam, vendedorIdParam);
}
```

**Resultado en BD:**
```
pedidos:
  id: '<order_uuid2>'
  cliente_id: '<cliente_uuid>'
  vendedor_id: '<vendedor_uuid>'

carritos_items:
  [vacío - se eliminaron del carrito vendedor]

# El carrito cliente (uuid1) sigue intacto con sus items
```

---

## Protecciones Implementadas

### 1. **Índices Filtrados**
- `idx_carrito_cliente`: Solo busca carritos donde `vendedor_id IS NULL`
- `idx_carrito_vendedor`: Solo busca carritos donde `vendedor_id IS NOT NULL`
- Garantiza que TypeORM busque exactamente lo que queremos

### 2. **TypeORM IsNull() Helper**
```typescript
import { IsNull } from 'typeorm';

// CartService método findOne SIEMPRE usa IsNull() para búsquedas NULL:
const whereCondition: any = {
  usuario_id,
  deleted_at: IsNull(),  // ✓ Correcto: WHERE deleted_at IS NULL
  vendedor_id: vendedor_id ? vendedor_id : IsNull()  // ✓ Correcto
};

// ❌ INCORRECTO (no funciona):
// vendedor_id: null  → TypeORM genera WHERE vendedor_id = NULL (siempre FALSE)

// ✅ CORRECTO:
// vendedor_id: IsNull()  → TypeORM genera WHERE vendedor_id IS NULL (correcto)
```

### 3. **Pedidos: vendedor_id Nullable**
La tabla `pedidos` permite `vendedor_id NULL` para clientes sin vendedor asignado:
```sql
CREATE TABLE pedidos (
    cliente_id UUID NOT NULL,
    vendedor_id UUID,  -- Nullable: puede ser NULL si no hay vendedor asignado
    ...
);
```

Si el cliente tiene `vendedor_asignado_id` en Catalog, se usa; si no, queda NULL.

### 4. **OrdersService Firma Clara**
```typescript
createFromCart(
  usuarioIdParam: string,
  actorUserId: string,
  actorRole: string,
  sucursal_id?: string,
  condicion_pago?: string,
  vendedorIdParam?: string | null  // ← Nuevo parámetro explícito
): Promise<Pedido>
```

- `vendedorIdParam = null` → Busca carrito cliente
- `vendedorIdParam = <uuid>` → Busca carrito vendedor

### 4. **Controllers Especializados**
- `POST /orders/from-cart/me` → pasa `vendedorIdParam = null`
- `POST /orders/from-cart/client/:clienteId` → pasa `vendedorIdParam = JWT`

---

## Ejemplos de Ejecución

### Caso 1: Dos carritos para mismo cliente

**Cliente 'Alice' (UUID: alice-123)**
**Vendedor 'Bob' (UUID: bob-456)**

#### Paso 1: Alice crea su carrito
```bash
GET /orders/cart/me
Authorization: Bearer <jwt_alice>
```
BD:
```
carritos_cabecera (id1):
  usuario_id: alice-123
  vendedor_id: NULL
```

#### Paso 2: Bob crea carrito para Alice
```bash
GET /orders/cart/client/alice-123
Authorization: Bearer <jwt_bob>
```
BD:
```
carritos_cabecera (id2):
  usuario_id: alice-123
  vendedor_id: bob-456
```

**Ambos coexisten sin conflicto** ✓

#### Paso 3: Alice agrega items a su carrito
```bash
POST /orders/cart/me
Authorization: Bearer <jwt_alice>
Body: { producto_id: "prod1", cantidad: 2 }
```

**id1.items**: `[prod1 x2]`
**id2.items**: `[]` (vacío)

#### Paso 4: Bob agrega items a su carrito
```bash
POST /orders/cart/client/alice-123
Authorization: Bearer <jwt_bob>
Body: { producto_id: "prod2", cantidad: 3 }
```

**id1.items**: `[prod1 x2]` (sin cambios ✓)
**id2.items**: `[prod2 x3]` (nuevo ✓)

#### Paso 5: Alice crea pedido
```bash
POST /orders/from-cart/me
Authorization: Bearer <jwt_alice>
Body: { condicion_pago: "CONTADO" }
```

- Busca carrito con `(usuario_id=alice-123, vendedor_id=NULL)` → **id1**
- Crea Pedido desde id1
- Limpia **solo id1.items**

**Resultado:**
```
Pedido1: { cliente_id: alice-123, vendedor_id: null, items: [prod1 x2] }
id1.items: []
id2.items: [prod2 x3]  ← Sin tocar ✓
```

#### Paso 6: Bob crea pedido
```bash
POST /orders/from-cart/client/alice-123
Authorization: Bearer <jwt_bob>
Body: { condicion_pago: "CREDITO" }
```

- Busca carrito con `(usuario_id=alice-123, vendedor_id=bob-456)` → **id2**
- Crea Pedido desde id2
- Limpia **solo id2.items**

**Resultado:**
```
Pedido2: { cliente_id: alice-123, vendedor_id: bob-456, items: [prod2 x3] }
id1.items: []
id2.items: []  ← Limpio ✓
```

---

## Validación en Tests

Para verificar que funciona correctamente:

```typescript
it('Vendor cannot access client cart', async () => {
  // Vendor creates carrito2 for alice
  const cart2 = await cartService.getOrCreateCart('alice-123', 'bob-456');
  
  // Client should NOT see bob's items
  const cart1 = await cartService.getOrCreateCart('alice-123', null);
  
  expect(cart1.id).not.toBe(cart2.id);  // ✓ Different carts
  expect(cart1.vendedor_id).toBe(null);
  expect(cart2.vendedor_id).toBe('bob-456');
});

it('Client creates order only from their cart', async () => {
  // Set up: vendor cart has items, client cart is empty
  
  // Client tries to create order
  expect(() => ordersService.createFromCart(
    'alice-123',
    'alice-123',
    'cliente',
    undefined,
    'CONTADO',
    null  // ← Search only in client cart
  )).rejects.toThrow('Carrito vacío');
  
  // Vendor cart items still intact ✓
});
```

---

## Resumén: Las 3 Reglas de Oro

1. **Índices separados**: `WHERE vendedor_id IS [NULL|NOT NULL]`
2. **Parámetro explícito**: `vendedorIdParam: string | null`
3. **Controller especializado**: `POST /from-cart/me` vs `POST /from-cart/client/:id`

Con estas tres cosas, cada actor SOLO ve y modifica su carrito. 

## Rutas y payloads

### Cliente
- GET /orders/cart/me
  - Headers: Authorization: Bearer <jwt_cliente>
  - Body: none
- POST /orders/cart/me
  - Headers: Authorization: Bearer <jwt_cliente>
  - Body JSON: { "producto_id": "<uuid>", "cantidad": <number>, "campania_aplicada_id"?: <number|null>, "motivo_descuento"?: <string> }
- DELETE /orders/cart/me
  - Headers: Authorization: Bearer <jwt_cliente>
  - Body: none
- DELETE /orders/cart/me/item/:productId
  - Headers: Authorization: Bearer <jwt_cliente>
  - Body: none
- POST /orders/from-cart/me
  - Headers: Authorization: Bearer <jwt_cliente>
  - Body JSON: { "condicion_pago"?: "CONTADO"|"CREDITO", "sucursal_id"?: "<uuid>", "fecha_entrega_solicitada"?: "<iso8601>", "observaciones_entrega"?: "<string>", "ubicacion"?: { "lat": <number>, "lng": <number> } }
  - vendededor_id se resuelve desde Catalog (vendedor_asignado_id) o queda null

### Vendedor
- GET /orders/cart/client/:clienteId
  - Headers: Authorization: Bearer <jwt_vendedor>
  - Body: none
- POST /orders/cart/client/:clienteId
  - Headers: Authorization: Bearer <jwt_vendedor>
  - Body JSON: { "producto_id": "<uuid>", "cantidad": <number>, "campania_aplicada_id"?: <number|null>, "motivo_descuento"?: <string> }
- DELETE /orders/cart/client/:clienteId
  - Headers: Authorization: Bearer <jwt_vendedor>
  - Body: none
- DELETE /orders/cart/client/:clienteId/item/:productId
  - Headers: Authorization: Bearer <jwt_vendedor>
  - Body: none
- POST /orders/from-cart/client/:clienteId
  - Headers: Authorization: Bearer <jwt_vendedor>
  - Body JSON: { "condicion_pago"?: "CONTADO"|"CREDITO", "sucursal_id"?: "<uuid>", "fecha_entrega_solicitada"?: "<iso8601>", "observaciones_entrega"?: "<string>", "ubicacion"?: { "lat": <number>, "lng": <number> } }
  - vendedor_id = JWT del vendedor
  - cliente_id = :clienteId del path
  - limpia el carrito exacto por ID

### Campos opcionales comunes
- condicion_pago: default CONTADO
- sucursal_id: null si no se env�a
- fecha_entrega_solicitada: null si no se env�a
- observaciones_entrega: null si no se env�a
- ubicacion: si no se env�a, se intenta resolver desde Catalog (sucursal o cliente)
- campania_aplicada_id, motivo_descuento: opcionales en items
🔒

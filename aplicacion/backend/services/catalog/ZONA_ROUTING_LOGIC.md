# Lógica de Ruteo Basado en Zonas

## Resumen
El sistema ahora implementa ruteo basado en zonas comerciales, donde cada vendedor puede ver las visitas de rutas que corresponden a la zona a la que está asignado, en lugar de solo ver visitas de clientes específicamente asignados a él.

## Estructura de Datos

### 1. **Zonas Comerciales** (`zonas_comerciales`)
- Define regiones geográficas para organizar clientes y vendedores
- Cada zona tiene un código único y nombre

### 2. **Asignación de Vendedores a Zonas** (`asignacion_vendedores`)
- Tabla que vincula vendedores con zonas
- Un vendedor puede estar asignado a una o más zonas
- Campos importantes:
  - `zona_id`: ID de la zona comercial
  - `vendedor_usuario_id`: ID del vendedor
  - `es_principal`: Indica si es el vendedor principal de la zona
  - `fecha_inicio` / `fecha_fin`: Período de asignación
  - `deleted_at`: Para soft-delete

### 3. **Clientes** (`clientes`)
- Cada cliente tiene una `zona_comercial_id` que indica la zona de su ubicación principal
- Al crear un cliente, si no se especifica vendedor, se auto-asigna el vendedor principal activo de la zona

### 4. **Sucursales de Cliente** (`sucursales_cliente`)
- Cada sucursal puede tener su propia `zona_id`
- Esto permite que un cliente tenga sucursales en diferentes zonas

### 5. **Rutero Planificado** (`rutero_planificado`)
- Cada ruta planificada tiene:
  - `cliente_id`: Cliente a visitar
  - `sucursal_id`: (Opcional) Sucursal específica a visitar
  - `zona_id`: Zona comercial de la visita

## Flujo de Creación de Rutas

### Escenario 1: Visita a Ubicación Principal del Cliente (SIN sucursal)
```
POST /rutero
{
  "cliente_id": "uuid-del-cliente",
  "dia_semana": 1,
  "zona_id": 1  // Zona donde está ubicada la tienda principal
}
```

**Lógica aplicada:**
- Si no se proporciona `zona_id`, se toma automáticamente de `cliente.zona_comercial_id`
- La visita usará la dirección principal del cliente

### Escenario 2: Visita a Sucursal del Cliente (CON sucursal)
```
POST /rutero
{
  "cliente_id": "uuid-del-cliente",
  "sucursal_id": "uuid-de-sucursal",
  "dia_semana": 3,
  "zona_id": 2  // Zona de la sucursal (puede ser diferente a la zona principal)
}
```

**Lógica aplicada:**
- Si no se proporciona `zona_id`, se toma automáticamente de `sucursal.zona_id`
- La visita usará la dirección de la sucursal

## Flujo de Consulta de Rutas por Vendedor

### Endpoint: `GET /rutero/mio`
**Autorización:** Vendedor autenticado

**Lógica (RuteroService.findForVendedor):**
```sql
SELECT rp.*
FROM rutero_planificado rp
INNER JOIN asignacion_vendedores av 
  ON av.zona_id = rp.zona_id
WHERE av.vendedor_usuario_id = :vendedorId
  AND av.fecha_fin IS NULL
  AND av.deleted_at IS NULL
  AND rp.activo = TRUE
ORDER BY rp.dia_semana, rp.orden_sugerido
```

**¿Cómo funciona?**
1. El vendedor Juan está asignado a la zona 1
2. Cuando Juan llama `GET /rutero/mio`, el sistema:
   - Busca todas las asignaciones activas del vendedor (`asignacion_vendedores`)
   - Obtiene todas las rutas planificadas cuyo `zona_id` coincida con las zonas asignadas a Juan
   - Devuelve SOLO las rutas de la zona 1

3. El vendedor Pedro está asignado a la zona 2
4. Cuando Pedro llama `GET /rutero/mio`, recibe SOLO las rutas de la zona 2

## Ejemplo Práctico

### Configuración Inicial

**Zonas:**
- Zona 1: "Norte"
- Zona 2: "Sur"

**Vendedores:**
- Juan asignado a Zona 1
- Pedro asignado a Zona 2

**Cliente: Cafrilosa SA**
- Ubicación principal: Zona 1 (Norte)
- Sucursal A: Zona 2 (Sur)

### Creación de Rutas

**Ruta 1: Visita a Tienda Principal**
```json
POST /rutero
{
  "cliente_id": "cafrilosa-id",
  "dia_semana": 1,
  "zona_id": 1
}
```
→ Juan (Zona 1) verá esta visita
→ Pedro (Zona 2) NO verá esta visita

**Ruta 2: Visita a Sucursal en el Sur**
```json
POST /rutero
{
  "cliente_id": "cafrilosa-id",
  "sucursal_id": "sucursal-a-id",
  "dia_semana": 3,
  "zona_id": 2
}
```
→ Pedro (Zona 2) verá esta visita
→ Juan (Zona 1) NO verá esta visita

## Enriquecimiento de Datos en Respuesta

Cuando un vendedor consulta sus rutas, cada registro incluye:

```json
{
  "id": "ruta-uuid",
  "cliente_id": "cliente-uuid",
  "sucursal_id": "sucursal-uuid o null",
  "zona_id": 2,
  "dia_semana": 3,
  "cliente_nombre": "Cafrilosa SA",
  "cliente_identificacion": "1791234567001",
  "direccion_entrega": "Dirección de sucursal o matriz",
  "ubicacion_gps": {...},
  "sucursal_nombre": "Sucursal A" o "Matriz",
  "contacto_nombre": "Nombre del contacto",
  "contacto_telefono": "0999123456"
}
```

**Lógica de enriquecimiento:**
- Si hay `sucursal_id`: usa datos de la sucursal
- Si NO hay `sucursal_id`: usa datos de la ubicación principal del cliente

## Creación Automática de Cliente

Al crear un cliente con zona, se auto-asigna el vendedor principal:

```typescript
// ClientesService.create()
let vendedorId = data.vendedor_asignado_id ?? null;
if (!vendedorId && data.zona_comercial_id) {
  // Buscar vendedor principal activo de la zona
  const asign = await this.asignRepo
    .where('zona_id = :zona', { zona: data.zona_comercial_id })
    .andWhere('es_principal = TRUE')
    .andWhere('fecha_fin IS NULL')
    .andWhere('deleted_at IS NULL')
    .getOne();
  vendedorId = asign?.vendedor_usuario_id ?? null;
}
```

## Ventajas del Sistema

1. **Flexibilidad Geográfica**: Un cliente puede tener presencia en múltiples zonas
2. **Distribución de Carga**: Vendedores solo ven rutas de su zona
3. **Escalabilidad**: Fácil agregar nuevas zonas y reasignar vendedores
4. **Trazabilidad**: Cada visita está vinculada claramente a una zona

## Cambios en el Código

### Archivos Modificados:

1. **rutero.service.ts**
   - `findForVendedor()`: Ahora hace JOIN con `asignacion_vendedores` por zona
   - `create()`: Auto-calcula `zona_id` desde sucursal o cliente si no se proporciona

2. **clientes.service.ts**
   - `create()`: Auto-asigna vendedor principal de la zona al crear cliente

3. **rutero.module.ts**
   - Agregada `AsignacionVendedores` a las entidades disponibles

4. **clientes.module.ts**
   - Agregada `AsignacionVendedores` a las entidades disponibles

### Entidades Existentes Utilizadas:

- ✅ `RuteroPlanificado` (ya tiene `zona_id`)
- ✅ `SucursalCliente` (ya tiene `zona_id`)
- ✅ `Cliente` (ya tiene `zona_comercial_id`)
- ✅ `AsignacionVendedores` (ya existe para asignación de vendedores a zonas)
- ✅ `ZonaComercial` (ya existe para definir zonas)

## Notas Importantes

- El campo `zona_id` en `rutero_planificado` es **requerido** para el funcionamiento correcto
- Las sucursales pueden tener `zona_id` diferente al del cliente
- Los vendedores pueden estar asignados a múltiples zonas simultáneamente
- La asignación de vendedor a zona debe tener `fecha_fin = NULL` para ser considerada activa

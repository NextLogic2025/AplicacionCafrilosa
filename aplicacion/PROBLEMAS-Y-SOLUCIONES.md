# Resumen de Problemas y Soluciones

## Problemas Identificados

### 1. **Productos No Se Cargan (Cliente)**
**Error:** `total_items: 0` en `/api/precios/cliente/productos`

**Causa:** La base de datos no tiene productos con precios asignados a la lista de precios del cliente.

**Solución:**
- Ejecutar el script SQL `seed-productos-precios.sql` para poblar datos de prueba
- O asignar precios manualmente desde el panel de Supervisor

### 2. **Pedidos No Se Cargan (Cliente)**  
**Error:** `500 Internal Server Error` en `/orders/client/:id`

**Causa:** El servicio de Orders está fallando al buscar pedidos.

**Solución:**
- Verificar logs del backend de Orders para identificar el error específico
- Verificar que la tabla `pedidos` existe y tiene datos válidos

### 3. **Usuario No Existe**
**Error:** `404 Not Found` en `/usuarios/:id`

**Causa:** El usuario con el que estás logueado no existe en la base de datos.

**Solución:**
- Crear un usuario válido usando Postman o el endpoint de registro
- Asegurarse de que el usuario se cree en AMBAS bases de datos (usuarios Y catálogo)

### 4. **Picking Devuelve 500**
**Error:** `500 Internal Server Error` en `/api/picking`

**Causa Posible:**
- Tabla `picking_ordenes` vacía o con datos corruptos
- Relaciones rotas en la base de datos
- Problema de permisos o configuración

**Solución:**
- Verificar logs del backend de Warehouse
- Verificar que las tablas existen: `picking_ordenes`, `picking_items`
- Verificar que las relaciones están correctamente configuradas

## Diagnóstico Completo

Para identificar la causa raíz, necesitas:

1. **Revisar los logs del backend** en las terminales donde corren los servicios:
   - Servicio de Catálogo (puerto 3003)
   - Servicio de Orders (puerto 3004)  
   - Servicio de Warehouse (puerto 3005)

2. **Verificar la base de datos:**
   ```sql
   -- Verificar productos
   SELECT COUNT(*) FROM productos WHERE activo = true;
   
   -- Verificar precios
   SELECT COUNT(*) FROM precios;
   
   -- Verificar pedidos
   SELECT COUNT(*) FROM pedidos;
   
   -- Verificar picking
   SELECT COUNT(*) FROM picking_ordenes;
   
   -- Verificar usuarios
   SELECT id, email, rol FROM usuarios;
   ```

3. **Ejecutar el script de seed:**
   - Ubicación: `c:\Users\LENOVO LOQ\Desktop\Septimo Ciclo\Arquitectura de software\AplicacionCafrilosa\aplicacion\seed-productos-precios.sql`
   - Esto creará productos y precios de prueba

## Próximos Pasos

1. Ejecuta el script SQL de seed
2. Crea un usuario cliente válido
3. Verifica los logs del backend para cada servicio
4. Comparte los logs para ayudarte a resolver los errores 500

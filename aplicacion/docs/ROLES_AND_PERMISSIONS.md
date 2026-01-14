# Sistema de Roles y Permisos - AplicacionCafrilosa

## 📋 Descripción General

El sistema implementa un modelo de control de acceso basado en roles (RBAC - Role-Based Access Control) que gestiona las acciones y recursos disponibles para cada usuario según su rol en la organización.

## 🎭 Roles del Sistema

### 1. **ADMIN** (Nivel de Acceso: 10)
**Descripción:** Administrador Total del Sistema

#### Permisos:
- ✅ Acceso completo a todas las funcionalidades
- ✅ Gestión de usuarios y roles
- ✅ Administración de catálogos y productos
- ✅ Gestión de precios y listas de precios
- ✅ Administración de promociones y campañas
- ✅ Gestión de clientes y sucursales
- ✅ Administración de rutas y zonas
- ✅ Supervisión de asignaciones de vendedores
- ✅ Auditoría completa del sistema

#### Interacciones:
- Puede crear y modificar usuarios con otros roles
- Puede asignar supervisores y vendedores
- Acceso a reportes y análisis completos
- Puede configurar parámetros globales del sistema

---

### 2. **SUPERVISOR** (Nivel de Acceso: 8)
**Descripción:** Gestión de Ventas, Créditos y Soporte

#### Permisos:
- ✅ Gestión de vendedores asignados
- ✅ Supervisión de rutas y clientes
- ✅ Gestión de zonas comerciales
- ✅ Administración de precios y listas de precios
- ✅ Gestión de promociones
- ✅ Consulta de clientes y sucursales
- ✅ Monitoreo de créditos y saldos
- ✅ Asignación de rutas a vendedores

#### Interacciones:
- **Con VENDEDOR:** Puede asignar rutas, supervisar actividad, revisar reportes
- **Con BODEGUERO:** Puede solicitar información de inventario
- **Con TRANSPORTISTA:** Puede coordinar entregas y rutas
- **Con CLIENTES:** Puede gestionar cuentas y créditos
- No puede crear otros supervisores ni usuarios administrativos

---

### 3. **BODEGUERO** (Nivel de Acceso: 5)
**Descripción:** Operaciones de Inventario, Picking y Despacho

#### Permisos:
- ✅ Consulta de productos y catálogo
- ✅ Gestión de inventario
- ✅ Operaciones de picking y despacho
- ✅ Consulta de precios
- ✅ Consulta de órdenes
- ✅ Registrar movimientos de almacén

#### Interacciones:
- **Con VENDEDOR:** Recibe órdenes para procesamiento
- **Con SUPERVISOR:** Reporta disponibilidad de inventario
- **Con TRANSPORTISTA:** Coordina entregas preparadas
- **Con ORDERS-SERVICE:** Consulta estado de órdenes
- No puede modificar precios ni crear clientes

---

### 4. **VENDEDOR** (Nivel de Acceso: 5)
**Descripción:** Fuerza de Ventas (Móvil) y Cobranza

#### Permisos:
- ✅ Consulta de clientes asignados
- ✅ Consulta de rutas y zonas
- ✅ Consulta de productos y precios
- ✅ Realización de cotizaciones
- ✅ Consulta de saldos de crédito
- ✅ Registro de cobranzas
- ✅ Consulta de promociones aplicables

#### Interacciones:
- **Con SUPERVISOR:** Recibe asignación de rutas, reporta actividad
- **Con CLIENTES:** Realiza ventas, consulta crédito disponible
- **Con ORDERS-SERVICE:** Crea y consulta órdenes
- **Con USUARIOS-SERVICE:** Obtiene información de clientes
- Acceso principalmente desde aplicación móvil
- No puede modificar precios ni crear clientes

---

### 5. **TRANSPORTISTA** (Nivel de Acceso: 4)
**Descripción:** Logística de Entrega y Rutas

#### Permisos:
- ✅ Consulta de rutas asignadas
- ✅ Visualización de zonas
- ✅ Consulta de clientes en ruta
- ✅ Registro de entregas
- ✅ Consulta de productos a entregar
- ✅ Actualización de estado de entregas

#### Interacciones:
- **Con SUPERVISOR:** Recibe rutas, reporta estado de entregas
- **Con BODEGUERO:** Recibe mercadería preparada
- **Con CLIENTES:** Realiza entregas físicas
- **Con RUTERO-SERVICE:** Consulta rutas planificadas
- Acceso principalmente desde aplicación móvil
- No puede crear órdenes ni modificar precios

---

### 6. **CLIENTE** (Nivel de Acceso: 1)
**Descripción:** Usuarios Finales (Web/App) para Autogestión

#### Permisos:
- ✅ Consulta de su perfil y datos
- ✅ Consulta de productos disponibles
- ✅ Consulta de precios según su lista
- ✅ Consulta de estado de órdenes
- ✅ Consulta de saldos y movimientos de crédito
- ✅ Consulta de promociones aplicables
- ✅ Ver historial de compras

#### Interacciones:
- **Con VENDEDOR:** Recibe visitas, realiza compras
- **Con TRANSPORTISTA:** Recibe entregas
- **Con BODEGUERO:** Sus órdenes son procesadas
- **Con SUPERVISOR:** Soporte ante problemas
- Acceso limitado a datos propios
- No puede acceder a datos de otros clientes

---

## 🔄 Flujo de Interacción Entre Roles

### Proceso de Venta Completo:

```
SUPERVISOR
    ↓ (Asigna ruta)
VENDEDOR (Zona A)
    ↓ (Visita cliente, genera orden)
CLIENTE
    ↓ (Compra)
ORDERS-SERVICE
    ↓ (Crea orden)
BODEGUERO (Recibe orden)
    ↓ (Prepara picking)
BODEGUERO
    ↓ (Despacha)
TRANSPORTISTA (Zona A)
    ↓ (Entrega)
CLIENTE (Recibe)
    ↓ (Confirma recepción)
SUPERVISOR (Monitorea)
```

### Gestión de Rutas:

```
SUPERVISOR
    ├─ Crea/Modifica rutas
    ├─ Asigna a VENDEDOR o TRANSPORTISTA
    │
VENDEDOR/TRANSPORTISTA
    ├─ Consulta ruta diaria
    ├─ Visualiza clientes y ubicaciones
    ├─ Registra actividad
    │
SUPERVISOR
    └─ Revisa reportes de actividad
```

### Gestión de Precios:

```
ADMIN/SUPERVISOR
    ├─ Crea listas de precios
    ├─ Define precios por producto
    ├─ Asigna lista a cliente
    │
VENDEDOR/CLIENTE
    └─ Consulta precio según su lista
```

---

## 🔐 Mecanismo de Seguridad

### Validación de Acceso:

1. **Token JWT:**
   - Cada usuario recibe un token JWT al autenticarse
   - Token incluye: `id`, `email`, `role`, `rolId`

2. **Guards de Autenticación:**
   - `JwtAuthGuard`: Valida presencia y validez del token
   - `RolesGuard`: Valida que el rol tenga acceso al endpoint

3. **Decoradores de Roles:**
   ```typescript
   @Roles('admin', 'supervisor')  // Solo estos roles pueden acceder
   @Post('precios')
   createPrice() { ... }
   ```

4. **Validación Jerárquica:**
   - Los guards soportan comparación por nombre de rol
   - También soportan comparación por ID de rol (1=admin, 2=supervisor, etc.)

---

## 📍 Ejemplos de Restricciones por Rol

### Catálogo (CATALOG-SERVICE):

| Endpoint | GET | POST | PUT | DELETE |
|----------|-----|------|-----|--------|
| `/precios` | Admin, Supervisor, Vendedor, Cliente | Admin, Supervisor | Admin, Supervisor | Admin, Supervisor |
| `/zonas` | Admin, Supervisor, Transportista | Admin, Supervisor | Admin, Supervisor | Admin, Supervisor |
| `/clientes` | Admin, Supervisor, Vendedor | Admin, Supervisor | Admin, Supervisor | Admin, Supervisor |
| `/productos` | Admin, Supervisor, Vendedor, Cliente | Admin, Supervisor | Admin, Supervisor | Admin, Supervisor |
| `/rutero` | Admin, Supervisor, Vendedor, Transportista | Admin, Supervisor | Admin, Supervisor | Admin, Supervisor |

### Usuarios (USUARIOS-SERVICE):

| Endpoint | GET | POST | PUT | DELETE |
|----------|-----|------|-----|--------|
| `/usuarios` | Admin, Supervisor | Admin | Admin, Supervisor | Admin |
| `/usuarios/me` | Todos autenticados | - | Todos (solo propio) | - |
| `/usuarios/vendedores` | Admin, Supervisor, Vendedor | - | - | - |

### Órdenes (ORDERS-SERVICE):

| Endpoint | GET | POST | PUT | DELETE |
|----------|-----|------|-----|--------|
| `/orders` | Admin, Supervisor, Vendedor, Cliente | Admin, Supervisor, Vendedor, Cliente | Admin, Supervisor | Admin, Supervisor |

---

## 🔑 Claves de Implementación

### 1. Servicio de Autenticación (AUTH-SERVICE):
- **Puerto:** 3001
- **Responsabilidad:** Generar y validar tokens JWT
- **Endpoints públicos:**
  - `POST /auth/login` - Autenticación
  - `POST /auth/registro` - Registro nuevo usuario
  - `POST /auth/refresh` - Renovar token

### 2. Servicio de Usuarios (USUARIOS-SERVICE):
- **Puerto:** 3002
- **Responsabilidad:** CRUD de usuarios y consultas
- **Endpoints protegidos:** Requieren JWT + rol apropiado
- **Endpoints internos:** `/usuarios/batch/internal` (solo entre servicios)

### 3. Servicio de Catálogo (CATALOG-SERVICE):
- **Puerto:** 3003
- **Responsabilidad:** Productos, precios, clientes, rutas
- **Todos los endpoints** requieren JWT + rol apropiado

### 4. Servicio de Órdenes (ORDERS-SERVICE):
- **Puerto:** 3004
- **Responsabilidad:** Gestión de órdenes de compra
- **Endpoints protegidos** según rol del usuario

---

## 📱 Flujo de Acceso Típico

### Vendedor Realizando Venta:

```
1. Vendedor inicia sesión
   → Auth-Service genera JWT con role='vendedor'
   
2. Vendedor consulta clientes
   → Catalog-Service valida JWT + @Roles('admin', 'supervisor', 'vendedor')
   → Retorna clientes asignados
   
3. Vendedor consulta precios
   → Catalog-Service valida JWT + @Roles('admin', 'supervisor', 'vendedor', 'cliente')
   → Retorna precios según lista del cliente
   
4. Vendedor crea orden
   → Orders-Service valida JWT + @Roles('admin', 'supervisor', 'vendedor', 'cliente')
   → Crea orden en órdenes_db
   
5. Supervisor recibe notificación
   → Acceso permitido automáticamente por rol 'supervisor'
```

---

## ⚠️ Consideraciones de Seguridad

1. **Separación de Responsabilidades:**
   - Admin: Configuración y auditoría
   - Supervisor: Supervisión y asignaciones
   - Operativos (Vendedor, Bodeguero, Transportista): Ejecución
   - Cliente: Solo datos propios

2. **Principio de Menor Privilegio:**
   - Cada rol solo tiene permisos necesarios para su función
   - Los roles operativos no pueden crear ni modificar otros usuarios

3. **Validación Multinivel:**
   - JWT valida autenticación
   - RolesGuard valida autorización
   - Servicios validan lógica de negocio

4. **Auditoría:**
   - Admin puede auditar todas las acciones
   - Supervisor puede auditar actividad de su equipo
   - Cada servicio registra cambios importantes

---

## 🔄 Jerarquía de Roles

```
ADMIN (Nivel 10)
  └─ Puede crear y gestionar todos los roles
  
SUPERVISOR (Nivel 8)
  ├─ Puede supervisar y asignar VENDEDOR
  ├─ Puede coordinar BODEGUERO
  ├─ Puede asignar TRANSPORTISTA
  └─ Gestiona CLIENTES

OPERATIVOS (Nivel 5-4)
├─ BODEGUERO (Nivel 5)
├─ VENDEDOR (Nivel 5)
└─ TRANSPORTISTA (Nivel 4)
    └─ Específico para logística

CLIENTE (Nivel 1)
  └─ Acceso limitado a datos propios
```

---

## 📝 Notas Importantes

- Los tokens JWT se validan localmente en cada servicio usando la misma clave secreta
- No hay autenticación entre servicios internos; solo se validan en endpoints públicos
- Los roles se cargan desde la base de datos de usuarios-db
- La tabla `roles` tiene 6 registros predefinidos (admin, supervisor, bodeguero, vendedor, transportista, cliente)
- Cambios de rol requieren reinicio de sesión (obtener nuevo token)


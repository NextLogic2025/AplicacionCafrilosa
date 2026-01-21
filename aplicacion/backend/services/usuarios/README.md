# Ficha Técnica del Microservicio Usuarios

## Información General

| Campo | Valor |
|-------|-------|
| **Nombre del servicio** | `@backend/usuarios` (usuarios-service) |
| **Versión** | 0.0.1 |
| **Lenguaje/Framework** | TypeScript 5.9.3 / NestJS 11.1.11 |
| **Propósito** | Gestión de perfiles de usuario, consulta y actualización de datos de usuarios, listado de vendedores y administración de estados de cuenta (activar/desactivar). Este servicio NO maneja autenticación (login/registro), solo gestión de datos de usuarios. |
| **Puerto** | 3000 |

---

## Stack Tecnológico

| Componente | Tecnología | Versión | Propósito |
|------------|------------|---------|-----------|
| **Runtime** | Node.js | 24 (Alpine) | Ejecución del servicio |
| **Framework** | NestJS | 11.1.11 | Framework backend |
| **Base de datos** | PostgreSQL | 17 | Almacenamiento persistente |
| **ORM** | TypeORM | 0.3.28 | Mapeo objeto-relacional |
| **Driver BD** | pg | 8.17.0 | Conexión PostgreSQL |
| **Autenticación** | Passport.js + JWT | 11.0.5 / 11.0.2 | Validación de tokens |
| **Encriptación** | bcrypt | 6.0.0 | Hash de contraseñas |
| **Validación Config** | Joi | 18.0.2 | Validación de variables de entorno |
| **Validación DTOs** | class-validator | 0.14.3 | Validación de requests |
| **Transformación** | class-transformer | 0.5.1 | Serialización/deserialización |
| **HTTP Client** | @nestjs/axios + axios | 4.0.1 / 1.13.2 | Comunicación inter-servicios |
| **Contenedor** | Docker | - | Despliegue |
| **CI/CD** | Cloud Build | - | Pipeline de despliegue |
| **Hosting** | Cloud Run (GCP) | - | Producción |

---

## Entidades de Base de Datos

| Entidad | Archivo | Descripción |
|---------|---------|-------------|
| `Usuario` | `usuario.entity.ts` | Datos de usuario (email, nombre, teléfono, avatar, estado) |
| `Role` | `role.entity.ts` | Roles del sistema (admin, supervisor, bodeguero, vendedor, transportista, cliente) |

### Esquema de la Entidad Usuario

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | UUID | No | Identificador único |
| `email` | string | No | Email único del usuario |
| `passwordHash` | string | No | Hash de la contraseña (columna: password_hash) |
| `nombreCompleto` | string | No | Nombre completo del usuario |
| `telefono` | string | Sí | Número de teléfono |
| `avatarUrl` | string | Sí | URL del avatar |
| `emailVerificado` | boolean | No | Estado de verificación del email |
| `activo` | boolean | No | Estado de la cuenta (default: true) |
| `lastLogin` | Date | Sí | Último inicio de sesión |
| `rol` | Role | No | Relación con tabla de roles |
| `createdAt` | Date | No | Fecha de creación |
| `updatedAt` | Date | No | Fecha de última actualización |

### Roles del Sistema

| ID | Nombre | Descripción |
|----|--------|-------------|
| 1 | admin | Administrador del sistema |
| 2 | supervisor | Supervisor de operaciones |
| 3 | bodeguero | Encargado de bodega |
| 4 | vendedor | Vendedor de campo |
| 5 | transportista | Conductor de entregas |
| 6 | cliente | Cliente final |

---

## Estructura de Módulos

```
src/
├── app.module.ts                    # Módulo raíz
├── main.ts                          # Bootstrap
│
├── auth/                            # Módulo de gestión de usuarios
│   ├── auth.controller.ts           # Endpoints REST
│   ├── auth.service.ts              # Lógica de negocio
│   ├── auth.module.ts               # Configuración del módulo
│   ├── decorators/
│   │   └── roles.decorator.ts       # Decorador @Roles()
│   ├── dto/
│   │   └── update-usuario.dto.ts    # DTO para actualizar usuario
│   ├── guards/
│   │   ├── jwt.guard.ts             # Guard de autenticación JWT
│   │   ├── roles.guard.ts           # Guard de autorización por roles
│   │   └── service-auth.guard.ts    # Guard para comunicación interna
│   └── strategies/
│       └── jwt.strategy.ts          # Estrategia Passport JWT
│
├── common/                          # Código compartido
│   └── http/
│       ├── service-http-client.service.ts # Cliente HTTP inter-servicios
│       ├── service-http.module.ts         # Módulo HTTP
│       └── interfaces/
│           └── http-client-options.interface.ts # Opciones del cliente
│
├── config/                          # Configuración
│   ├── app.config.ts                # Config de la aplicación
│   ├── config.module.ts             # Módulo de configuración
│   ├── database.config.ts           # Config de base de datos
│   ├── jwt.config.ts                # Config de JWT
│   └── validation.schema.ts         # Schema Joi para env vars
│
├── database/                        # Conexión TypeORM
│   └── database.module.ts           # Módulo de base de datos
│
├── entities/                        # Entidades de BD
│   ├── role.entity.ts               # Roles del sistema
│   └── usuario.entity.ts            # Usuarios
│
└── health/                          # Health checks
    ├── health.controller.ts         # Endpoint /health
    ├── health.service.ts            # Lógica del health check
    └── health.module.ts             # Módulo de health
```

---

## Endpoints Principales

| Método | Ruta | DTO | Descripción | Auth | Roles Permitidos |
|--------|------|-----|-------------|------|------------------|
| `GET` | `/usuarios/me` | - | Obtener perfil del usuario autenticado | ✅ JWT | Todos |
| `GET` | `/usuarios` | - | Listar usuarios (excluyendo clientes) | ✅ JWT | admin, supervisor |
| `GET` | `/usuarios/desactivados` | - | Listar usuarios desactivados | ✅ JWT | admin, supervisor |
| `GET` | `/usuarios/vendedores` | - | Listar vendedores activos | ✅ JWT | admin, supervisor |
| `PUT` | `/usuarios/:id` | `UpdateUsuarioDto` | Actualizar datos de usuario | ✅ JWT | admin, supervisor, cliente, vendedor, transportista, bodeguero |
| `PUT` | `/usuarios/:id/desactivar` | - | Desactivar cuenta de usuario | ✅ JWT | admin, supervisor |
| `PUT` | `/usuarios/:id/activar` | - | Activar cuenta de usuario | ✅ JWT | admin, supervisor |
| `POST` | `/usuarios/batch/internal` | `{ ids: string[] }` | Obtener usuarios por IDs (interno) | ✅ Service Token | Servicios internos |
| `GET` | `/health` | - | Health check | ❌ | - |

---

## DTOs

### UpdateUsuarioDto

```typescript
{
  nombre?: string;        // Nombre completo
  telefono?: string;      // Número de teléfono
  avatarUrl?: string;     // URL del avatar
  emailVerificado?: boolean; // Estado de verificación
  activo?: boolean;       // Estado de la cuenta
  rolId?: number;         // ID del rol (solo admin/supervisor)
}
```

---

## 🔒 Configuración de Seguridad

### Guards Implementados

| Guard | Propósito |
|-------|-----------|
| `JwtAuthGuard` | Valida tokens JWT en el header Authorization |
| `RolesGuard` | Verifica que el usuario tenga los roles requeridos |
| `ServiceAuthGuard` | Valida tokens de servicio para comunicación interna |

### Protecciones de Roles

- **Clientes** solo pueden actualizar su propio perfil
- **Clientes** no pueden cambiar su rol (prevención de escalación)
- **Supervisores** pueden gestionar todos los usuarios excepto admins
- **Admins** tienen acceso completo

### Comunicación Inter-Servicios
El endpoint `/usuarios/batch/internal` está protegido por `ServiceAuthGuard` y requiere un token de servicio válido en el header `Authorization`.

---

## Variables de Entorno

```bash
# Aplicación
NODE_ENV=development|production|test
PORT=3000

# Base de datos
DATABASE_URL=postgresql://user:pass@host:5432/usuarios_db

# JWT (para validar tokens generados por auth-service)
JWT_SECRET=<mismo-secreto-que-auth-service>
JWT_EXPIRES_IN=1h

# Token para comunicación entre servicios
SERVICE_TOKEN=<token-comunicacion-interna>

# CORS
CORS_ORIGIN=http://localhost:5173
```

### Archivo .env.example

```bash
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/usuarios_db
JWT_SECRET=MiSecretoSuperSeguro2025
JWT_EXPIRES_IN=1h
```

---

## Dependencias de Otros Servicios

| Servicio | Dependencia | Propósito |
|----------|-------------|-----------|
| `auth-service` | JWT_SECRET compartido | Validación de tokens JWT |

**Nota:** Este servicio es consumido por otros servicios (como `auth-service`) para sincronización de datos de perfil.

---

## Scripts Disponibles

```bash
npm run build        # Compilar TypeScript
npm run start        # Iniciar en producción
npm run start:dev    # Iniciar en desarrollo (watch mode)
npm run start:debug  # Iniciar con debugger
npm run start:prod   # Iniciar desde dist/
npm run lint         # Ejecutar ESLint
npm run format       # Formatear código con Prettier
npm run test         # Ejecutar tests unitarios
npm run test:watch   # Tests en modo watch
npm run test:cov     # Tests con reporte de cobertura
npm run test:e2e     # Tests end-to-end
```

---

## Docker

### Dockerfile (Multi-stage build)

```dockerfile
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main"]
```

### Comandos Docker

```bash
# Construir imagen
docker build -t usuarios-service .

# Ejecutar contenedor
docker run -p 3000:3000 --env-file .env usuarios-service
```

---

## CI/CD con Cloud Build

El servicio se despliega automáticamente a Cloud Run usando Cloud Build:

1. **Construcción**: Build de imagen Docker
2. **Push**: Subida a Artifact Registry
3. **Deploy**: Despliegue a Cloud Run

Trigger: Push a rama principal en `aplicacion/backend/services/usuarios/`

---

## Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                     usuarios-service                         │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  Auth    │  │  Health  │  │  Config  │  │ Database │    │
│  │  Module  │  │  Module  │  │  Module  │  │  Module  │    │
│  └────┬─────┘  └──────────┘  └──────────┘  └────┬─────┘    │
│       │                                          │          │
│       ▼                                          ▼          │
│  ┌──────────┐                              ┌──────────┐    │
│  │ Guards   │                              │ TypeORM  │    │
│  │ JWT/Role │                              │          │    │
│  └──────────┘                              └────┬─────┘    │
│                                                  │          │
└──────────────────────────────────────────────────│──────────┘
                                                   │
                                                   ▼
                                          ┌──────────────┐
                                          │  PostgreSQL  │
                                          │  usuarios_db │
                                          └──────────────┘
```

---

## Flujo de Autorización

```
Request → JwtAuthGuard → RolesGuard → Controller → Service → Database
              │               │
              │               └── Verifica roles del usuario
              │
              └── Valida token JWT y extrae payload
```

---

## Ejemplos de Uso

### Obtener perfil propio

```bash
curl -X GET http://localhost:3000/usuarios/me \
  -H "Authorization: Bearer <token>"
```

### Listar vendedores

```bash
curl -X GET http://localhost:3000/usuarios/vendedores \
  -H "Authorization: Bearer <admin-or-supervisor-token>"
```

### Actualizar usuario

```bash
curl -X PUT http://localhost:3000/usuarios/<uuid> \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Nuevo Nombre", "telefono": "+593999999999"}'
```

### Desactivar usuario

```bash
curl -X PUT http://localhost:3000/usuarios/<uuid>/desactivar \
  -H "Authorization: Bearer <admin-or-supervisor-token>"
```

---

## Testing

### Estado Actual

⚠️ **Pendiente**: El servicio actualmente no tiene tests implementados.

### Tests Recomendados

| Archivo | Tests Sugeridos |
|---------|-----------------|
| `auth.service.spec.ts` | obtenerMiPerfil, listarUsuarios, activar/desactivar, actualizarUsuario |
| `auth.controller.spec.ts` | Endpoints REST, validación de roles |
| `jwt.guard.spec.ts` | Validación de tokens |
| `roles.guard.spec.ts` | Verificación de permisos por rol |
| `service-auth.guard.spec.ts` | Comunicación inter-servicios |

---

## Notas Importantes

1. **Separación de responsabilidades**: Este servicio NO maneja login/registro/refresh tokens. Eso lo hace `auth-service`.

2. **JWT compartido**: El `JWT_SECRET` debe ser el mismo que usa `auth-service` para que los tokens sean válidos.

3. **Comunicación interna**: El endpoint `/batch/internal` permite a otros servicios obtener datos de usuarios en lote.

4. **Protección de admins**: Los supervisores no pueden desactivar/activar cuentas de administradores.

5. **Prevención de escalación**: Los clientes no pueden cambiar su propio rol.

---

## Métricas y Monitoreo

| Métrica | Endpoint | Descripción |
|---------|----------|-------------|
| Health Check | `GET /health` | Estado del servicio |
| Latencia | Cloud Run Metrics | Tiempo de respuesta |
| Errores | Cloud Logging | Logs de errores |

---

## Contacto y Soporte

Para reportar problemas o solicitar cambios, crear un issue en el repositorio del proyecto.

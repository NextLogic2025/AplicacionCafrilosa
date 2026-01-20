# Ficha Técnica del Microservicio Auth

## Información General

| Campo | Valor |
|-------|-------|
| **Nombre del servicio** | `@backend/auth` (auth-service) |
| **Versión** | 0.0.1 |
| **Lenguaje/Framework** | TypeScript 5.9.3 / NestJS 11.1.11 |
| **Propósito** | Autenticación y autorización centralizada para todos los microservicios de Cafrilosa. Gestiona login, registro, tokens JWT, refresh tokens, gestión de dispositivos y auditoría de accesos. |
| **Puerto** | 3001 |

---

## Stack Tecnológico

| Componente | Tecnología | Versión | Propósito |
|------------|------------|---------|-----------|
| **Runtime** | Node.js | 24 (Alpine) | Ejecución del servicio |
| **Framework** | NestJS | 11.1.11 | Framework backend |
| **Base de datos** | PostgreSQL | 17 | Almacenamiento persistente |
| **ORM** | TypeORM | 0.3.28 | Mapeo objeto-relacional |
| **Driver BD** | pg | 8.17.0 | Conexión PostgreSQL |
| **Autenticación** | Passport.js + JWT | 11.0.5 / 11.0.2 | Estrategia de autenticación |
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
| `Usuario` | `usuario.entity.ts` | Credenciales y datos de autenticación |
| `Role` | `role.entity.ts` | Roles del sistema (admin, vendedor, cliente) |
| `AuthToken` | `auth-token.entity.ts` | Refresh tokens activos |
| `Dispositivo` | `dispositivo.entity.ts` | Dispositivos registrados por usuario |
| `AuthAuditoria` | `auth-auditoria.entity.ts` | Log de eventos de autenticación |

---

## Estructura de Módulos

```
src/
├── app.module.ts                    # Módulo raíz
├── main.ts                          # Bootstrap
│
├── auth/                            # Módulo principal de autenticación
│   ├── auth.controller.ts           # Endpoints REST
│   ├── auth.controller.spec.ts      # Tests del controlador
│   ├── auth.service.ts              # Lógica de negocio
│   ├── auth.service.spec.ts         # Tests del servicio
│   ├── auth.module.ts               # Configuración del módulo
│   ├── decorators/
│   │   └── roles.decorator.ts       # Decorador @Roles()
│   ├── dto/
│   │   ├── index.ts                 # Barrel export
│   │   ├── create-usuario.dto.ts    # DTO registro
│   │   ├── login.dto.ts             # DTO login
│   │   ├── refresh-token.dto.ts     # DTO refresh
│   │   └── dto.validation.spec.ts   # Tests de validación DTOs
│   ├── guards/
│   │   ├── jwt.guard.ts             # Guard de autenticación JWT
│   │   └── jwt.guard.spec.ts        # Tests del guard
│   └── strategies/
│       ├── jwt.strategy.ts          # Estrategia Passport JWT
│       └── jwt.strategy.spec.ts     # Tests de la estrategia
│
├── common/                          # Código compartido
│   ├── filters/
│   │   ├── index.ts                 # Barrel export
│   │   ├── throttle-exception.filter.ts      # Filtro rate limiting
│   │   └── throttle-exception.filter.spec.ts # Tests del filtro
│   └── http/
│       ├── service-http-client.service.ts      # Cliente HTTP inter-servicios
│       ├── service-http-client.service.spec.ts # Tests del cliente HTTP
│       ├── service-http.module.ts              # Módulo HTTP
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
│   ├── auth-auditoria.entity.ts     # Log de eventos
│   ├── auth-token.entity.ts         # Refresh tokens
│   ├── dispositivo.entity.ts        # Dispositivos registrados
│   ├── role.entity.ts               # Roles del sistema
│   └── usuario.entity.ts            # Usuarios
│
└── health/                          # Health checks
    ├── health.controller.ts         # Endpoint /health
    ├── health.controller.spec.ts    # Tests del controlador
    ├── health.service.ts            # Servicio de health
    ├── health.service.spec.ts       # Tests del servicio
    └── health.module.ts             # Módulo de health

test/
└── auth.e2e-spec.ts                 # Tests end-to-end
```

---

## Endpoints Principales

| Método | Ruta | DTO | Descripción | Auth | Rate Limit |
|--------|------|-----|-------------|------|------------|
| `POST` | `/auth/login` | `LoginDto` | Iniciar sesión | ❌ | 5/min |
| `POST` | `/auth/registro` | `CreateUsuarioDto` | Registrar usuario | ❌ | 3/min |
| `POST` | `/auth/refresh` | `RefreshTokenDto` | Renovar access token | ❌ | 10/min |
| `POST` | `/auth/logout` | `{ refresh_token? }` | Cerrar sesión actual | ✅ JWT | - |
| `POST` | `/auth/logout-all` | - | Cerrar todas las sesiones | ✅ JWT | - |
| `POST` | `/auth/validate-token` | - | Validar token actual | ✅ JWT | - |
| `POST` | `/auth/dispositivo` | `{ device_id }` | Registrar dispositivo | ✅ JWT | - |
| `GET` | `/health` | - | Health check | ❌ | - |

---

## 🔒 Configuración de Seguridad

### Rate Limiting
El servicio implementa protección contra ataques de fuerza bruta:
- **Login:** Máximo 5 intentos por minuto por IP
- **Registro:** Máximo 3 registros por minuto por IP
- **Refresh:** Máximo 10 renovaciones por minuto por IP
- **Global:** 10 requests por minuto para otros endpoints

Al exceder el límite, se retorna `HTTP 429 Too Many Requests`.

### Validación de Contraseñas
Las contraseñas deben cumplir:
- Mínimo 8 caracteres
- Al menos 1 letra mayúscula
- Al menos 1 letra minúscula
- Al menos 1 número
- Al menos 1 carácter especial (@$!%*?&)

### Rotación de Refresh Tokens
- Cada uso de refresh token genera uno nuevo
- El token anterior se marca como "rotado"
- Si se detecta reutilización de un token rotado → **todas las sesiones se revocan**
- Máximo 5 refresh tokens activos por usuario

### Prevención de Enumeración de Usuarios
- Mensajes de error genéricos: "Credenciales inválidas"
- Timing constante usando hash dummy
- Logs internos sí diferencian para análisis de seguridad

---

## Variables de Entorno

```bash
# Aplicación
NODE_ENV=development|production|test
PORT=3001

# Base de datos
DATABASE_URL=postgresql://user:pass@host:5432/auth_db

# 🔒 JWT (OBLIGATORIOS - mínimo 32 caracteres)
# Generar con: openssl rand -base64 32
JWT_SECRET=<secreto-seguro-minimo-32-caracteres>
JWT_REFRESH_SECRET=<otro-secreto-diferente-minimo-32-caracteres>

# Tiempo de vida de tokens
ACCESS_TOKEN_TTL=12h
REFRESH_TOKEN_TTL=7d

# Forzar una sola sesión activa
SINGLE_SESSION=false

# Servicios externos
USUARIOS_SERVICE_URL=http://usuarios-service:3000
SERVICE_TOKEN=<token-comunicacion-interna>

# CORS
CORS_ORIGIN=http://localhost:5173
```

---

## Dependencias de Otros Servicios

| Servicio | URL Variable | Propósito |
|----------|--------------|-----------|
| `usuarios-service` | `USUARIOS_SERVICE_URL` | Sincronización de datos de perfil |

---

## Scripts Disponibles

```bash
npm run build        # Compilar TypeScript
npm run start        # Iniciar en producción
npm run start:dev    # Iniciar en desarrollo (watch mode)
npm run test         # Ejecutar tests unitarios
npm run test:watch   # Tests en modo watch
npm run test:cov     # Tests con reporte de cobertura
npm run test:e2e     # Tests end-to-end
```

---

## Testing

### Cobertura Actual
| Métrica | Actual | Target | Mínimo |
|---------|--------|--------|--------|
| Statements | 91.53% ✅ | 80% | 70% |
| Branches | 73.17% ✅ | 70% | 60% |
| Functions | 93.33% ✅ | 80% | 70% |
| Lines | 93.02% ✅ | 80% | 70% |

### Resumen de Tests
| Archivo | Tests | Descripción |
|---------|-------|-------------|
| `auth.service.spec.ts` | 27 | Registro, login, logout, refresh, dispositivos, auditoría |
| `auth.controller.spec.ts` | 14 | Endpoints REST, extracción de IP/User-Agent |
| `jwt.guard.spec.ts` | 12 | Validación de tokens, headers, esquemas |
| `jwt.strategy.spec.ts` | 4 | Estrategia Passport JWT |
| `dto.validation.spec.ts` | 19 | Validación de passwords fuertes, emails, campos |
| `health.*.spec.ts` | 4 | Health check endpoints |
| `throttle-exception.filter.spec.ts` | 6 | Rate limiting responses |
| `service-http-client.service.spec.ts` | 12 | Cliente HTTP, timeouts, errores |
| `auth.e2e-spec.ts` | 8 | Tests end-to-end |

**Total: 106 tests unitarios + 8 tests e2e**

### Tests Críticos Incluidos
- ✅ Login con credenciales válidas/inválidas
- ✅ Registro con validación de password fuerte
- ✅ Refresh token con detección de reutilización
- ✅ Logout con revocación efectiva
- ✅ Rate limiting en endpoints públicos
- ✅ Prevención de enumeración de usuarios

---

## Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                        auth-service                          │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  Auth    │  │  Health  │  │  Config  │  │ Database │    │
│  │  Module  │  │  Module  │  │  Module  │  │  Module  │    │
│  └────┬─────┘  └──────────┘  └──────────┘  └────┬─────┘    │
│       │                                          │          │
│       ▼                                          ▼          │
│  ┌──────────┐                              ┌──────────┐    │
│  │ Passport │                              │ TypeORM  │    │
│  │   JWT    │                              │   Pool   │    │
│  └──────────┘                              └────┬─────┘    │
│                                                  │          │
└──────────────────────────────────────────────────┼──────────┘
                                                   │
                                                   ▼
                                            ┌──────────┐
                                            │PostgreSQL│
                                            │ auth_db  │
                                            └──────────┘
```

---

## Responsabilidades

| ✅ Hace | ❌ No hace |
|---------|-----------|
| Autenticación (login/logout) | Gestión de perfiles (→ usuarios) |
| Generación de JWT | Autorización a nivel de recursos |
| Validación de tokens | Permisos granulares |
| Gestión de refresh tokens | Gestión de clientes/productos |
| Auditoría de accesos | Lógica de negocio |
| Registro de dispositivos | Envío de emails |

---

## Dependencias del package.json

### Producción

| Paquete | Versión | Uso |
|---------|---------|-----|
| `@nestjs/axios` | 4.0.1 | HTTP client |
| `@nestjs/common` | 11.1.11 | Decorators y utilidades |
| `@nestjs/config` | 4.0.2 | Configuración |
| `@nestjs/core` | 11.1.11 | Framework core |
| `@nestjs/jwt` | 11.0.2 | Manejo JWT |
| `@nestjs/passport` | 11.0.5 | Autenticación |
| `@nestjs/platform-express` | 11.1.11 | HTTP adapter |
| `@nestjs/typeorm` | 11.0.0 | ORM integration |
| `axios` | 1.13.2 | HTTP requests |
| `bcrypt` | 6.0.0 | Hash passwords |
| `class-transformer` | 0.5.1 | Transformación objetos |
| `class-validator` | 0.14.3 | Validación DTOs |
| `joi` | 18.0.2 | Validación config |
| `passport-jwt` | 4.0.1 | Estrategia JWT |
| `pg` | 8.17.0 | Driver PostgreSQL |
| `reflect-metadata` | 0.2.2 | Metadata reflection |
| `rxjs` | 7.8.2 | Programación reactiva |
| `typeorm` | 0.3.28 | ORM |

### Desarrollo

| Paquete | Versión | Uso |
|---------|---------|-----|
| `@nestjs/cli` | 11.0.14 | CLI NestJS |
| `@nestjs/schematics` | 11.0.9 | Generadores |
| `@nestjs/testing` | 11.1.11 | Testing |
| `@types/bcrypt` | 6.0.0 | Tipos bcrypt |
| `@types/express` | 5.0.6 | Tipos Express |
| `@types/node` | 25.0.8 | Tipos Node.js |
| `eslint` | 9.39.2 | Linting |
| `eslint-plugin-import` | 2.32.0 | Plugin ESLint |
| `prettier` | 3.7.4 | Formateo código |
| `ts-node` | 10.9.2 | Ejecución TS |
| `typescript` | 5.9.3 | Compilador |

---

## Métricas y SLOs

| Métrica | Target | Crítico |
|---------|--------|---------|
| Latencia login (p95) | < 200ms | > 500ms |
| Latencia validación JWT | < 50ms | > 100ms |
| Disponibilidad | 99.9% | < 99% |
| Error rate | < 0.1% | > 1% |
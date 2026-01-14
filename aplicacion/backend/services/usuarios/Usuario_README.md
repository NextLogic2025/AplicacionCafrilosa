# Servicio de Usuarios - Cafrilosa

Microservicio de autenticación y gestión de usuarios construido con NestJS, TypeORM y PostgreSQL.

## 🚀 Inicio Rápido

### Desarrollo Local (Windows)
```powershell
cd aplicacion/backend/services/usuarios
npm install
npm run start:dev
```
El servicio estará disponible en: http://localhost:3000

### Docker (Recomendado)
```powershell
cd aplicacion
docker-compose up -d --build usuarios-service
```
El servicio estará disponible en: http://localhost:3001

## ⚙️ Levantar los Servicios

### Levantar TODO (Base de Datos + PgAdmin + Usuarios Service)

```powershell
cd C:\Users\LEGION\Documents\AplicacionCafrilosa\aplicacion

# Levanta todos los servicios
docker-compose up -d

# Verifica que todo esté corriendo
docker ps
```

**Servicios disponibles:**
- **Usuarios Service**: http://localhost:3001
- **PgAdmin**: http://localhost:8080 (admin@admin.com / root)
- **PostgreSQL**: localhost:5432 (admin / root)

### Levantar SOLO el Servicio de Usuarios

```powershell
cd C:\Users\LEGION\Documents\AplicacionCafrilosa\aplicacion

# Si la BD ya está corriendo
docker-compose up -d usuarios-service

# Ver logs
docker logs usuarios-service -f
```

### Detener los Servicios

```powershell
cd C:\Users\LEGION\Documents\AplicacionCafrilosa\aplicacion

# Detener solo usuarios
docker-compose stop usuarios-service

# Detener TODO
docker-compose down

# Detener TODO y eliminar volúmenes (CUIDADO: pierde datos)
docker-compose down -v
```

### Ver Estado de los Contenedores

```powershell
# Ver contenedores corriendo
docker ps

# Ver logs en tiempo real
docker logs usuarios-service -f

# Ver historial de logs
docker logs usuarios-service --tail 50
```

## 🔄 Flujo de Desarrollo

### Opción 1: Desarrollo Rápido (Local)

Prueba cambios rápidamente sin esperar al rebuild de Docker:

```powershell
# 1. Detén el servicio en Docker
cd C:\Users\LEGION\Documents\AplicacionCafrilosa\aplicacion
docker-compose stop usuarios-service

# 2. Corre el servicio localmente
cd backend/services/usuarios
npm run start:dev
```

El servicio estará en **http://localhost:3000** y conectado a la BD en Docker.

### Opción 2: Sincronizar cambios a Docker

Una vez que los cambios funcionan localmente:

```powershell
# 1. Detén el servidor local (Ctrl+C en la terminal)

# 2. Rebuild y levanta Docker con los cambios
cd C:\Users\LEGION\Documents\AplicacionCafrilosa\aplicacion
docker-compose up -d --build usuarios-service

# 3. Verifica los logs
docker logs usuarios-service -f
```

El servicio estará nuevamente en **http://localhost:3001** con tus cambios.

### Opción 3: Hot Reload en Docker (Desarrollo avanzado)

Si quieres cambios instantáneos dentro del contenedor, modifica `docker-compose.yml`:

```yaml
usuarios-service:
  # ... resto de configuración ...
  volumes:
    - ./backend/services/usuarios/src:/app/src  # Agrega esta línea
```

Luego:
```powershell
cd C:\Users\LEGION\Documents\AplicacionCafrilosa\aplicacion
docker-compose up -d usuarios-service
```

Los cambios al código se reflejarán al instante.

## 📡 Endpoints

### POST /auth/registro
Registra un nuevo usuario.

**Request:**
```json
{
  "email": "usuario@cafrilosa.com",
  "password": "secret123",
  "nombre": "Juan Pérez",
  "rolId": 1
}
```

**Response:**
```json
{
  "mensaje": "Usuario registrado",
  "id": "668b3a96-5190-49df-a755-bcaf2338ed8a"
}
```

### POST /auth/login
Autentica un usuario y devuelve un JWT.

**Request:**
```json
{
  "email": "usuario@cafrilosa.com",
  "password": "secret123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## 🔎 Endpoints (detallado)

### POST /auth/registro
Registra un nuevo usuario y crea la fila en `usuarios`.

Comportamiento:
- Valida DTO (`email`, `password`, `nombre`, `rolId`).
- Hashea la contraseña con `bcrypt` y guarda `password_hash`.
- Asigna rol (`rol_id`) y crea la fila con `created_at`.
- Inserta un registro de auditoría con `evento = 'REGISTER'` (si procede).

Request ejemplo:
```json
{
  "email": "usuario@cafrilosa.com",
  "password": "secret123",
  "nombre": "Juan Pérez",
  "rolId": 1
}
```

Response ejemplo:
```json
{ "mensaje": "Usuario registrado", "id": "<uuid>" }
```

### POST /auth/login
Autentica credenciales y devuelve `access_token` (corto) y `refresh_token` (largo).

Comportamiento:
- Verifica que el email exista y que `bcrypt.compare(password, password_hash)` sea verdadero.
- Si falla, guarda auditoría `evento = 'FAIL'` con `metadata.email` y retorna 401.
- Si OK: genera `access_token` (TTL corto, p. ej. 5–10 min) y `refresh_token` (TTL largo, p. ej. 7d).
- Guarda sólo el `hash` del `refresh_token` en `auth_refresh_tokens` (campo `token_hash`).
- Si el cliente envía `device_id`, vincula el refresh token con `dispositivo_id`.
- Registra auditoría `evento = 'LOGIN'` y actualiza `usuarios.last_login`.

Request ejemplo:
```json
{
  "email": "usuario@cafrilosa.com",
  "password": "secret123"
}
```

Response ejemplo:
```json
{
  "access_token": "<jwt>",
  "refresh_token": "<jwt-refresh>",
  "usuario": { "id":"...", "email":"...", "nombre":"..." }
}
```

### POST /auth/refresh
Renueva tokens usando un `refresh_token` válido. **Validación estricta**: el servidor compara el hash del token provisto con los hashes almacenados y verifica `revocado = false` y `fecha_expiracion > NOW()`.

Comportamiento:
- Recibe `{ refresh_token, device_id? }`.
- Busca candidatos `auth_refresh_tokens` con `revocado = false` y `fecha_expiracion > NOW()`.
- Para cada candidato ejecuta `bcrypt.compare(providedToken, token_hash)`.
- Si coincide: marca el candidato como `revocado` (rotación), crea y guarda un nuevo refresh token (hash) y emite un nuevo access token. Guarda `replaced_by_token` en la fila nueva.
- Inserta auditoría `evento = 'REFRESH'`.

Request ejemplo:
```json
{
  "refresh_token": "<jwt-refresh>",
  "device_id": "device-uuid-optional"
}
```

Response ejemplo:
```json
{
  "access_token": "<jwt>",
  "refresh_token": "<new-jwt-refresh>"
}
```

### POST /auth/logout
Revoca refresh token(s).

Comportamiento:
- Si se pasa un `refresh_token`, busca y marca sólo ese registro como `revocado = true` (y guarda `revocado_razon`).
- Si no se pasa token, opcionalmente marca todos los `auth_refresh_tokens` del usuario como `revocado = true`.
- Inserta auditoría `evento = 'LOGOUT'`.

Request ejemplo (revocar token específico):
```json
{ "refresh_token": "<jwt-refresh>" }
```

Response ejemplo:
```json
{ "mensaje": "Logout exitoso" }
```

### POST /auth/dispositivo
Registra o actualiza un dispositivo en `dispositivos_usuarios`.

Comportamiento:
- Guarda `device_id`, `nombre_dispositivo`, `tipo_plataforma`, `token_push__fcm`, `app_version`, `ultimo_acceso` y `is_trusted`.
- Si ya existe (por `usuario_id + device_id`) actualiza `ultimo_acceso`.
- Los refresh tokens pueden vincularse a `dispositivo_id` para trazabilidad.

Request ejemplo:
```json
{ "device_id": "device-123", "nombre_dispositivo": "Pixel 6" }
```

Response ejemplo:
```json
{ "id": "<device-uuid>", "device_id": "device-123" }
```

### GET /auth/me
Devuelve el perfil del usuario autenticado (usa `Authorization: Bearer <access_token>`).

Comportamiento:
- `JwtAuthGuard` valida firma y expiración del access token.
- Retorna campos públicos: `id`, `email`, `nombre`, `telefono`, `avatar_url`, `email_verificado`, `activo`, `created_at`.

Response ejemplo:
```json
{
  "id": "...",
  "email": "...",
  "nombre": "...",
  "telefono": "...",
  "email_verificado": false
}
```

### GET /auth/usuarios
Lista todos los usuarios visibles para un `supervisor` (excluye usuarios con rol `cliente`).

Headers:

```
Authorization: Bearer <ACCESS_TOKEN>
```

Response ejemplo (array):

```json
[
  {
    "id": "668b3a96-5190-49df-a755-bcaf2338ed8a",
    "email": "vendedor1@cafrilosa.com",
    "nombre": "Vendedor Uno",
    "telefono": "+593987654321",
    "emailVerificado": true,
    "activo": true,
    "createdAt": "2025-12-01T12:34:56.000Z",
    "rol": { "id": 4, "nombre": "vendedor" }
  }
]
```

Notes: este endpoint requiere rol `supervisor` (o `rolId === 2`).

### GET /auth/vendedores
Lista únicamente los usuarios con rol `vendedor` (útil para que el supervisor revise la fuerza de ventas).

Headers:

```
Authorization: Bearer <ACCESS_TOKEN>
```

Response ejemplo (array):

```json
[
  {
    "id": "668b3a96-5190-49df-a755-bcaf2338ed8a",
    "email": "vendedor1@cafrilosa.com",
    "nombre": "Vendedor Uno",
    "telefono": "+593987654321",
    "emailVerificado": true,
    "activo": true,
    "createdAt": "2025-12-01T12:34:56.000Z",
    "rol": { "id": 4, "nombre": "vendedor" }
  }
]
```

Notes: este endpoint también requiere rol `supervisor` (o `rolId === 2`).

## 🛡️ Notas importantes de seguridad

- Nunca almacenar tokens en texto claro — sólo hashes (`bcrypt`).
- Verificar `revocado = false` y `fecha_expiracion > NOW()` al procesar `refresh`.
- Para revocación inmediata de access tokens, usar Redis blacklist o TTL muy corto en access tokens (5–10 min) combinado con rotación de refresh tokens.
- `SINGLE_SESSION=true` puede forzar que al loguear se revoquen refresh tokens previos.

## 📝 Notas

- El servicio NO hace `synchronize: true` en TypeORM - las tablas se crean con el script SQL en `infra/local-init/`
- Puerto en Docker: **3001** (mapea al 3000 interno)
- Puerto local: **3000**

## 🧪 Pruebas con PowerShell

### Registro
```powershell
$body = @{
    email='test@cafrilosa.com'
    password='secret123'
    nombre='Usuario Test'
    rolId=1
} | ConvertTo-Json

Invoke-RestMethod -Uri 'http://localhost:3001/auth/registro' `
    -Method Post -Body $body -ContentType 'application/json'
```

### Login
```powershell
$loginBody = @{
    email='test@cafrilosa.com'
    password='secret123'
} | ConvertTo-Json

Invoke-RestMethod -Uri 'http://localhost:3001/auth/login' `
    -Method Post -Body $loginBody -ContentType 'application/json'
```

## 🔧 Configuración

### Variables de Entorno (Docker)
Ya configuradas en `docker-compose.yml`:
- `DB_HOST=database`
- `DB_PORT=5432`
- `DB_USER=admin`
- `DB_PASSWORD=root`
- `DB_NAME=usuarios_db`

### Desarrollo Local
El servicio usa valores por defecto que conectan a `localhost:5432`.

## 📁 Estructura del Proyecto

```
usuarios/
├── src/
│   ├── main.ts              # Bootstrap de NestJS
│   ├── app.module.ts        # Módulo raíz (TypeORM config)
│   ├── entities/            # Entidades de la BD
│   │   ├── usuario.entity.ts
│   │   └── role.entity.ts
│   └── auth/                # Módulo de autenticación
│       ├── auth.module.ts
│       ├── auth.controller.ts
│       ├── auth.service.ts
│       └── dto/
│           ├── create-usuario.dto.ts
│           └── login.dto.ts
├── Dockerfile
├── package.json
└── tsconfig.json
```

## 🔐 Seguridad

- Contraseñas encriptadas con bcrypt (salt rounds: 10)
- JWT expira en 1 hora
- Validación automática de DTOs con class-validator
- Secret JWT configurable vía `JWT_SECRET` env var (default: 'dev-secret-change-me')

## 🔁 Nuevo Flujo de Autenticación (Access + Refresh)

- Login (`POST /auth/login`): devuelve `access_token` (corto, p. ej. 5-10 min) y `refresh_token` (largo, p. ej. 7d). El servicio guarda sólo el hash del `refresh_token` en `auth_refresh_tokens` y registra el evento en `auth_auditoria`.
- Rutas protegidas: el cliente envía `Authorization: Bearer <access_token>`. El `JwtAuthGuard` verifica firma y expiración del access token (no consulta la BD por petición). Para revocación inmediata usar lista negra en Redis o TTL corto.
- Renovación (`POST /auth/refresh`): el servidor debe validar que el `refresh_token` no esté `revocado = true` y que `fecha_expiracion > NOW()`; si es válido se emite un nuevo `access_token` y (opcional) se rota el `refresh_token` (guardar hash del nuevo y marcar el antiguo como `revocado`).
- Logout (`POST /auth/logout`): si recibe un `refresh_token`, marca ese registro como `revocado`; si no recibe token, puede marcar todos los `refresh_tokens` del usuario como revocados.
- Registro de dispositivo (`POST /auth/dispositivo`): registra/actualiza `dispositivos_usuarios` (device_id, token_push__fcm, app_version, ultimo_acceso, is_trusted) y vincula refresh tokens a `dispositivo_id` cuando exista.

### Recomendaciones

- Access token: 5–10 minutos. Refresh token: ~7 días.
- Guardar sólo hashes (bcrypt) de tokens en BD — nunca tokens en texto.
- Implementar rotación de refresh tokens (revoke previous + save `replaced_by_token`) para mayor seguridad.
- Para bloqueo inmediato de access tokens usar Redis blacklist y comprobarla en el guard (trade-off: mayor latencia/DB calls). Recomendado: TTL corto + validación de refresh tokens en renovación.


## 📝 Notas

- El servicio NO hace `synchronize: true` en TypeORM - las tablas se crean con el script SQL en `infra/local-init/`
- Puerto en Docker: **3001** (mapea al 3000 interno)
- Puerto local: **3000**

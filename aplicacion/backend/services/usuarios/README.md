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

## 📝 Notas

- El servicio NO hace `synchronize: true` en TypeORM - las tablas se crean con el script SQL en `infra/local-init/`
- Puerto en Docker: **3001** (mapea al 3000 interno)
- Puerto local: **3000**

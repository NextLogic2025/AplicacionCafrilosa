-- ============================================================
-- CREACIÓN DE BASES DE DATOS
-- ============================================================
CREATE DATABASE ventas_db;
CREATE DATABASE inventario_db;
CREATE DATABASE usuarios_db;
CREATE DATABASE orders_db;
CREATE DATABASE catalog_db;

-- ============================================================
-- CONECTARSE A usuarios_db E INICIALIZAR
-- ============================================================
\c usuarios_db;
-- ==================================================================================
-- MICROSERVICIO: AUTHENTICATION SERVICE (svc-auth) – Versión FINAL 100%
-- BASE DE DATOS: auth_db
-- ==================================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ROLES
CREATE TABLE roles (
    id SMALLSERIAL PRIMARY KEY,
    nombre VARCHAR(30) UNIQUE NOT NULL,
    descripcion VARCHAR(150),
    nivel_acceso INT DEFAULT 1
);

INSERT INTO roles (nombre, descripcion, nivel_acceso) VALUES
('admin', 'Administrador Total del Sistema', 10),
('supervisor', 'Gestión de Ventas, Créditos y Soporte', 8),
('bodeguero', 'Operaciones de Inventario, Picking y Despacho', 5),
('vendedor', 'Fuerza de Ventas (Móvil) y Cobranza', 5),
('transportista', 'Logística de Entrega y Rutas', 4),
('cliente', 'Usuarios finales (Web/App) para autogestión', 1);

-- USUARIOS
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nombre_completo VARCHAR(150) NOT NULL,
    telefono VARCHAR(20),
    avatar_url TEXT,
    rol_id SMALLINT NOT NULL REFERENCES roles(id),
    activo BOOLEAN DEFAULT TRUE,
    email_verificado BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION fn_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_usuarios_timestamp
BEFORE UPDATE ON usuarios
FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

-- DISPOSITIVOS
CREATE TABLE dispositivos_usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    nombre_dispositivo VARCHAR(50),
    tipo_plataforma VARCHAR(20),
    token_push__fcm TEXT,
    app_version VARCHAR(20),
    ultimo_acceso TIMESTAMPTZ DEFAULT NOW(),
    is_trusted BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(usuario_id, device_id)
);

-- REFRESH TOKENS
CREATE TABLE auth_refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    dispositivo_id UUID REFERENCES dispositivos_usuarios(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    fecha_expiracion TIMESTAMPTZ NOT NULL,
    revocado BOOLEAN DEFAULT FALSE,
    revocado_razon VARCHAR(100),
    ip_creacion INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    replaced_by_token TEXT
);

-- AUDITORÍA
CREATE TABLE auth_auditoria (
    id BIGSERIAL PRIMARY KEY,
    usuario_id UUID,
    email_intentado VARCHAR(100),
    evento VARCHAR(50) NOT NULL,
    descripcion TEXT,
    ip_address INET,
    user_agent TEXT,
    dispositivo_id UUID,
    geo_location JSONB,
    metadata JSONB,
    fecha_evento TIMESTAMPTZ DEFAULT NOW()
);

-- ÍNDICES
CREATE INDEX idx_users_email ON usuarios(email);
CREATE INDEX idx_tokens_validos ON auth_refresh_tokens(usuario_id, dispositivo_id) WHERE revocado = FALSE;
CREATE INDEX idx_push_tokens ON dispositivos_usuarios(usuario_id) WHERE token_push__fcm IS NOT NULL;
CREATE INDEX idx_audit_fecha ON auth_auditoria(fecha_evento DESC);
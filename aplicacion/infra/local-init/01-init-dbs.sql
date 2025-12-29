-- ============================================================
-- CREACIÓN DE BASES DE DATOS
-- ============================================================
CREATE DATABASE ventas_db;
CREATE DATABASE inventario_db;
CREATE DATABASE usuarios_db;

-- ============================================================
-- CONECTARSE A usuarios_db E INICIALIZAR
-- ============================================================
\c usuarios_db;

-- EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- LIMPIEZA (OPCIONAL)
-- ============================================================
DROP TABLE IF EXISTS
auth_auditoria,
dispositivos_usuarios,
auth_tokens,
usuarios,
roles
CASCADE;

-- ============================================================
-- ROLES
-- ============================================================
CREATE TABLE roles (
    id SMALLSERIAL PRIMARY KEY,
    nombre VARCHAR(30) UNIQUE NOT NULL
);

INSERT INTO roles (nombre) VALUES
('admin'),
('vendedor'),
('bodeguero'),
('transportista'),
('cliente'),
('supervisor');

-- ============================================================
-- USUARIOS
-- ============================================================
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nombre VARCHAR(100),
    rol_id SMALLINT NOT NULL REFERENCES roles(id),
    activo BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger updated_at automático
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_usuarios_updated
BEFORE UPDATE ON usuarios
FOR EACH ROW
EXECUTE FUNCTION fn_set_updated_at();

-- ============================================================
-- TOKENS (ACCESS / REFRESH)
-- ============================================================
CREATE TABLE auth_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,

    token_hash TEXT NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('access','refresh')),

    expiracion TIMESTAMPTZ NOT NULL,
    revocado BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Un solo refresh token activo por usuario
CREATE UNIQUE INDEX ux_refresh_token_activo
ON auth_tokens(usuario_id)
WHERE tipo = 'refresh' AND revocado = FALSE;

-- ============================================================
-- DISPOSITIVOS
-- ============================================================
CREATE TABLE dispositivos_usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,

    device_id TEXT,
    token_push TEXT,
    ip_registro TEXT,

    last_login TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AUDITORÍA DE AUTENTICACIÓN
-- ============================================================
CREATE TABLE auth_auditoria (
    id BIGSERIAL PRIMARY KEY,
    usuario_id UUID,

    evento VARCHAR(30), -- LOGIN, LOGOUT, FAIL, REFRESH
    ip TEXT,
    user_agent TEXT,

    metadata JSONB,
    fecha TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX idx_usuarios_email ON usuarios(email);

CREATE INDEX idx_tokens_usuario ON auth_tokens(usuario_id);
CREATE INDEX idx_tokens_exp ON auth_tokens(expiracion);

CREATE INDEX idx_audit_usuario ON auth_auditoria(usuario_id);
CREATE INDEX idx_audit_fecha ON auth_auditoria(fecha DESC);
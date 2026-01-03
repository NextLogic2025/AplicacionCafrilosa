-- ==================================================================================
-- MICROSERVICIO: CATALOG SERVICE (svc-catalog) - VERSIÓN FINAL 100% + AUDITORÍA + SOFT DELETE
-- BASE DE DATOS: catalog_db
-- MOTOR: PostgreSQL 14+
-- ==================================================================================

-- Crear la base y conectarse
CREATE DATABASE catalog_db;
\c catalog_db;

	-- ==================================================================================
-- PROYECTO: CAFRILOSA ENTERPRISE
-- MICROSERVICIO: CATALOG SERVICE (svc-catalog) - VERSIÓN FINAL 100%
-- BASE DE DATOS: catalog_db
-- MOTOR: PostgreSQL 14+
-- ==================================================================================

-- =========================================
-- 1. EXTENSIONES
-- =========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- Para zonas geográficas y ubicaciones GPS

-- =========================================
-- 2. CATEGORÍAS (de productos)
-- =========================================
CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    descripcion VARCHAR(150),
    imagen_url TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ  -- SOFT DELETE
);

-- Datos semilla (ejemplos reales de Cafrilosa)
INSERT INTO categorias (nombre, descripcion) VALUES
('Mortadelas', 'Línea de mortadelas clásicas y gourmet'),
('Salchichas', 'Salchichas para hot dog, parrilla y freír'),
('Jamones', 'Jamones de cerdo, pavo y especiales'),
('Chorizos y Parrilla', 'Chorizos ahumados, rancheros y parrilleros'),
('Ahumados', 'Chuletón, tocino, pollo y muslos ahumados'),
('Línea Pizzera', 'Salami, pepperoni y jamón pizzero'),
('Especialidades', 'Cecina, pastel mexicano, matambre, etc.'),
('Línea Navideña', 'Productos especiales para Navidad');

-- =========================================
-- 3. PRODUCTOS (con datos semilla de tu lista)
-- =========================================
CREATE TABLE productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_sku VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    categoria_id INT REFERENCES categorias(id),
    peso_unitario_kg DECIMAL(10,3) NOT NULL CHECK (peso_unitario_kg > 0),
    volumen_m3 DECIMAL(10,4),
    requiere_frio BOOLEAN DEFAULT FALSE,
    unidad_medida VARCHAR(20) DEFAULT 'UNIDAD',
    imagen_url TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ  -- SOFT DELETE
);

-- Datos semilla (basados en tu lista de productos)
INSERT INTO productos (codigo_sku, nombre, descripcion, categoria_id, peso_unitario_kg, requiere_frio, unidad_medida) VALUES
('MORT-ESPEC', 'Mortadela Especial', 'Mortadela clásica en piezas y empaque al vacío', (SELECT id FROM categorias WHERE nombre = 'Mortadelas'), 4.5, TRUE, 'KG'),
('MORT-BOLO', 'Mortadela Bolognia', 'Mortadela tipo Bolognia en tacos y empaque', (SELECT id FROM categorias WHERE nombre = 'Mortadelas'), 2.7, TRUE, 'KG'),
('MORT-POLLO', 'Mortadela de Pollo', 'Mortadela ligera de pollo', (SELECT id FROM categorias WHERE nombre = 'Mortadelas'), 4.5, TRUE, 'KG'),
('SALCH-ORO', 'Salchicha Oro', 'Salchicha premium para hot dog', (SELECT id FROM categorias WHERE nombre = 'Salchichas'), 0.2, TRUE, 'UNIDAD'),
('SALCH-VIEN', 'Salchicha Vienesa Especial', 'Salchicha tipo vienesa', (SELECT id FROM categorias WHERE nombre = 'Salchichas'), 0.2, TRUE, 'UNIDAD'),
('JAM-PIERNA', 'Jamón de Pierna', 'Jamón de pierna ahumado', (SELECT id FROM categorias WHERE nombre = 'Jamones'), 5.5, TRUE, 'KG'),
('CHORIZ-AHUM', 'Chorizo Ahumado', 'Chorizo ahumado para parrilla', (SELECT id FROM categorias WHERE nombre = 'Chorizos y Parrilla'), 0.2, TRUE, 'UNIDAD');

-- =========================================
-- 4. LISTAS DE PRECIOS
-- =========================================
CREATE TABLE listas_precios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    moneda VARCHAR(3) DEFAULT 'USD',
    activa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO listas_precios (nombre) VALUES
('General'), ('Mayorista'), ('Horeca');

CREATE TABLE precios_items (
    lista_id INT REFERENCES listas_precios(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
    precio DECIMAL(10,2) NOT NULL CHECK (precio > 0),
    PRIMARY KEY (lista_id, producto_id)
);

-- =========================================
-- 5. PROMOCIONES
-- =========================================
CREATE TABLE campañas_promocionales (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    fecha_inicio TIMESTAMPTZ NOT NULL,
    fecha_fin TIMESTAMPTZ NOT NULL,
    tipo_descuento VARCHAR(20),
    valor_descuento DECIMAL(10,2),
    imagen_banner_url TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ  -- SOFT DELETE
);

CREATE TABLE productos_promocion (
    campaña_id INT REFERENCES campañas_promocionales(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
    precio_oferta_fijo DECIMAL(10,2),
    PRIMARY KEY (campaña_id, producto_id)
);

-- =========================================
-- 6. ZONAS COMERCIALES (GEOGRÁFICAS)
-- =========================================
CREATE TABLE zonas_comerciales (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    ciudad VARCHAR(50),
    macrorregion VARCHAR(50),
    poligono_geografico GEOMETRY(POLYGON, 4326),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ  -- SOFT DELETE
);

-- =========================================
-- 7. ASIGNACIÓN DE VENDEDORES A ZONAS
-- =========================================
CREATE TABLE asignacion_vendedores (
    id SERIAL PRIMARY KEY,
    zona_id INT NOT NULL REFERENCES zonas_comerciales(id),
    vendedor_usuario_id UUID NOT NULL,  -- referencia lógica a auth_db.usuarios
    nombre_vendedor_cache VARCHAR(150),
    fecha_inicio DATE DEFAULT CURRENT_DATE,
    fecha_fin DATE,
    es_principal BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ  -- SOFT DELETE
);

CREATE UNIQUE INDEX ux_vendedor_zona_activo
ON asignacion_vendedores(zona_id)
WHERE fecha_fin IS NULL AND es_principal = TRUE AND deleted_at IS NULL;

-- =========================================
-- 8. CLIENTES
-- =========================================
CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_principal_id UUID,  -- referencia lógica a auth_db.usuarios
    identificacion VARCHAR(20) UNIQUE NOT NULL,
    tipo_identificacion VARCHAR(10) DEFAULT 'RUC',
    razon_social VARCHAR(200) NOT NULL,
    nombre_comercial VARCHAR(200),
    lista_precios_id INT REFERENCES listas_precios(id) DEFAULT 1,
    vendedor_asignado_id UUID,  -- referencia lógica
    zona_comercial_id INT REFERENCES zonas_comerciales(id),
    tiene_credito BOOLEAN DEFAULT FALSE,
    limite_credito DECIMAL(12,2) DEFAULT 0,
    saldo_actual DECIMAL(12,2) DEFAULT 0,
    dias_plazo INT DEFAULT 0,
    bloqueado BOOLEAN DEFAULT FALSE,
    direccion_texto TEXT,
    ubicacion_gps GEOMETRY(POINT, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ  -- SOFT DELETE
);

CREATE TABLE sucursales_cliente (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    nombre_sucursal VARCHAR(100),
    direccion_entrega TEXT,
    ubicacion_gps GEOMETRY(POINT, 4326),
    contacto_nombre VARCHAR(100),
    contacto_telefono VARCHAR(20),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- 9. RUTERO PLANIFICADO
-- =========================================
CREATE TABLE rutero_planificado (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    zona_id INT NOT NULL REFERENCES zonas_comerciales(id),
    dia_semana INT NOT NULL CHECK (dia_semana BETWEEN 1 AND 7),
    frecuencia VARCHAR(20) DEFAULT 'SEMANAL',
    prioridad_visita VARCHAR(10) DEFAULT 'NORMAL',
    orden_sugerido INT,
    hora_estimada_arribo TIME,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(cliente_id, dia_semana)
);
-- =========================================
-- 10. AUDITORÍA CATÁLOGO (CORREGIDO PARA INT Y UUID)
-- =========================================
CREATE TABLE audit_log_catalog (
    id BIGSERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id TEXT NOT NULL, -- 👈 CAMBIO: UUID -> TEXT (Para aceptar Serial y UUID)
    operation VARCHAR(10) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changed_by UUID, -- Referencia al usuario que hizo el cambio
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET
);

CREATE OR REPLACE FUNCTION fn_audit_catalog()
RETURNS TRIGGER AS $$
DECLARE
    -- Intentamos obtener el usuario de la configuración, si es null, null queda
    v_changed_by UUID;
    v_ip INET := inet_client_addr();
BEGIN
    BEGIN
        v_changed_by := current_setting('app.current_user', true)::uuid;
    EXCEPTION WHEN OTHERS THEN
        v_changed_by := NULL; -- Evita error si el string no es un UUID válido
    END;

    INSERT INTO audit_log_catalog (
        table_name, record_id, operation, old_data, new_data, changed_by, ip_address
    )
    VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id::TEXT, OLD.id::TEXT), -- 👈 CAMBIO: Casteo explícito a TEXT
        TG_OP,
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) END,
        v_changed_by,
        v_ip
    );
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers (Igual que antes)
CREATE TRIGGER trg_audit_productos AFTER INSERT OR UPDATE OR DELETE ON productos FOR EACH ROW EXECUTE FUNCTION fn_audit_catalog();
CREATE TRIGGER trg_audit_clientes AFTER INSERT OR UPDATE OR DELETE ON clientes FOR EACH ROW EXECUTE FUNCTION fn_audit_catalog();
CREATE TRIGGER trg_audit_zonas AFTER INSERT OR UPDATE OR DELETE ON zonas_comerciales FOR EACH ROW EXECUTE FUNCTION fn_audit_catalog();
CREATE TRIGGER trg_audit_promociones AFTER INSERT OR UPDATE OR DELETE ON campañas_promocionales FOR EACH ROW EXECUTE FUNCTION fn_audit_catalog();
-- Puedes agregar también a categorías si quieres
CREATE TRIGGER trg_audit_categorias AFTER INSERT OR UPDATE OR DELETE ON categorias FOR EACH ROW EXECUTE FUNCTION fn_audit_catalog();
-- =========================================
-- 11. ÍNDICES OPTIMIZADOS
-- =========================================
CREATE INDEX idx_productos_busqueda ON productos(nombre, codigo_sku) WHERE deleted_at IS NULL;
CREATE INDEX idx_clientes_ruc ON clientes(identificacion) WHERE deleted_at IS NULL;
CREATE INDEX idx_zonas_poligono ON zonas_comerciales USING GIST(poligono_geografico);
CREATE INDEX idx_clientes_gps ON clientes USING GIST(ubicacion_gps);
CREATE INDEX idx_promos_activas ON campañas_promocionales(fecha_inicio, fecha_fin) WHERE activo = TRUE AND deleted_at IS NULL;
CREATE INDEX idx_audit_catalog ON audit_log_catalog(table_name, record_id, changed_at DESC);
-- =========================================
-- 12. EVENTOS ASÍNCRONOS (pg_notify → Cloud Functions)
-- =========================================
CREATE OR REPLACE FUNCTION notify_catalogo_cambio()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify('catalogo-cambio', json_build_object(
        'table', TG_TABLE_NAME,
        'id', COALESCE(NEW.id::TEXT, OLD.id::TEXT), -- 👈 CAMBIO: Aseguramos formato texto
        'operation', TG_OP
    )::text);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notify_productos AFTER INSERT OR UPDATE OR DELETE ON productos FOR EACH ROW EXECUTE FUNCTION notify_catalogo_cambio();
CREATE TRIGGER trg_notify_clientes AFTER INSERT OR UPDATE OR DELETE ON clientes FOR EACH ROW EXECUTE FUNCTION notify_catalogo_cambio();
CREATE TRIGGER trg_notify_promos AFTER INSERT OR UPDATE OR DELETE ON campañas_promocionales FOR EACH ROW EXECUTE FUNCTION notify_catalogo_cambio();

-- =========================================
-- FIN DEL MICROSERVICIO CATALOG - 100% PostgreSQL
-- =========================================
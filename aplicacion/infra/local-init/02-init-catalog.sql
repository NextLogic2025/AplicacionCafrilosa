-- ==================================================================================
-- MICROSERVICIO: CATALOG SERVICE (svc-catalog) - VERSIÓN FINAL CORREGIDA
-- BASE DE DATOS: catalog_db
-- MOTOR: PostgreSQL 14+
-- ==================================================================================

-- Conectarse a la base (Solo funciona si la base ya existe)
\c catalog_db;

-- =========================================
-- 1. EXTENSIONES
-- =========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; 

-- =========================================
-- 2. CATEGORÍAS
-- =========================================
CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    descripcion VARCHAR(150),
    imagen_url TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

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
-- 3. PRODUCTOS
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
    deleted_at TIMESTAMPTZ
);

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
    nombre_interno VARCHAR(50), -- Opcional, para uso interno
    moneda VARCHAR(3) DEFAULT 'USD',
    activa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO listas_precios (nombre) VALUES ('General'), ('Mayorista'), ('Horeca');

CREATE TABLE precios_items (
    lista_id INT REFERENCES listas_precios(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
    precio DECIMAL(10,2) NOT NULL CHECK (precio > 0),
    PRIMARY KEY (lista_id, producto_id)
);

-- =========================================
-- 5. ZONAS COMERCIALES (MOVIDO AQUÍ POR DEPENDENCIA)
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
    deleted_at TIMESTAMPTZ
);

-- =========================================
-- 6. ASIGNACIÓN DE VENDEDORES (MOVIDO AQUÍ)
-- =========================================
CREATE TABLE asignacion_vendedores (
    id SERIAL PRIMARY KEY,
    zona_id INT NOT NULL REFERENCES zonas_comerciales(id),
    vendedor_usuario_id UUID NOT NULL, 
    nombre_vendedor_cache VARCHAR(150),
    fecha_inicio DATE DEFAULT CURRENT_DATE,
    fecha_fin DATE,
    es_principal BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX ux_vendedor_zona_activo
ON asignacion_vendedores(zona_id)
WHERE fecha_fin IS NULL AND es_principal = TRUE AND deleted_at IS NULL;

-- =========================================
-- 7. CLIENTES (AHORA SÍ FUNCIONA)
-- =========================================
CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_principal_id UUID,
    identificacion VARCHAR(20) UNIQUE NOT NULL,
    tipo_identificacion VARCHAR(10) DEFAULT 'RUC',
    razon_social VARCHAR(200) NOT NULL,
    nombre_comercial VARCHAR(200),
    lista_precios_id INT REFERENCES listas_precios(id) DEFAULT 1,
    vendedor_asignado_id UUID,
    zona_comercial_id INT REFERENCES zonas_comerciales(id), -- Esto fallaba antes
    tiene_credito BOOLEAN DEFAULT FALSE,
    limite_credito DECIMAL(12,2) DEFAULT 0,
    saldo_actual DECIMAL(12,2) DEFAULT 0,
    dias_plazo INT DEFAULT 0,
    bloqueado BOOLEAN DEFAULT FALSE,
    direccion_texto TEXT,
    ubicacion_gps GEOMETRY(POINT, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE sucursales_cliente (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    zona_id INT REFERENCES zonas_comerciales(id),
    nombre_sucursal VARCHAR(100),
    direccion_entrega TEXT,
    ubicacion_gps GEOMETRY(POINT, 4326),
    contacto_nombre VARCHAR(100),
    contacto_telefono VARCHAR(20),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- =========================================
-- 8. PROMOCIONES
-- =========================================
CREATE TABLE campañas_promocionales (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    fecha_inicio TIMESTAMPTZ NOT NULL,
    fecha_fin TIMESTAMPTZ NOT NULL,
    tipo_descuento VARCHAR(20) CHECK (tipo_descuento IN ('PORCENTAJE', 'MONTO_FIJO')),
    valor_descuento DECIMAL(10,2),
    alcance VARCHAR(20) DEFAULT 'GLOBAL' CHECK (alcance IN ('GLOBAL', 'POR_LISTA', 'POR_CLIENTE')),
    lista_precios_objetivo_id INT REFERENCES listas_precios(id),
    imagen_banner_url TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE productos_promocion (
    campaña_id INT REFERENCES campañas_promocionales(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
    precio_oferta_fijo DECIMAL(10,2),
    PRIMARY KEY (campaña_id, producto_id)
);

CREATE TABLE promociones_clientes_permitidos (
    campaña_id INT REFERENCES campañas_promocionales(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (campaña_id, cliente_id)
);

-- =========================================
-- 8. RUTERO PLANIFICADO (CON SUCURSAL)
-- =========================================
-- 1. Primero crea la tabla SIN la línea del UNIQUE complejo
CREATE TABLE rutero_planificado (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    sucursal_id UUID REFERENCES sucursales_cliente(id) ON DELETE CASCADE,
    zona_id INT NOT NULL REFERENCES zonas_comerciales(id),
    dia_semana INT NOT NULL CHECK (dia_semana BETWEEN 1 AND 7),
    frecuencia VARCHAR(20) DEFAULT 'SEMANAL',
    prioridad_visita VARCHAR(10) DEFAULT 'NORMAL',
    orden_sugerido INT,
    hora_estimada_arribo TIME,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. LUEGO ejecuta esto por separado para crear la restricción lógica
CREATE UNIQUE INDEX idx_rutero_unico_sucursal 
ON rutero_planificado (cliente_id, COALESCE(sucursal_id, '00000000-0000-0000-0000-000000000000'::uuid), dia_semana);

-- =========================================
-- 9. AUDITORÍA (FIXED)
-- =========================================
CREATE TABLE audit_log_catalog (
    id BIGSERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id TEXT NOT NULL, 
    operation VARCHAR(10) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changed_by UUID,
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET
);

-- =================================================================
-- CORRECCIÓN FINAL: FUNCIÓN DE AUDITORÍA ROBUSTA (JSON BASED)
-- =================================================================

CREATE OR REPLACE FUNCTION fn_audit_catalog()
RETURNS TRIGGER AS $$
DECLARE
    v_changed_by UUID;
    v_ip INET := inet_client_addr();
    v_record_id TEXT;
    v_new_json JSONB;
    v_old_json JSONB;
BEGIN
    -- 1. Intentar obtener el usuario actual (si falla, null)
    BEGIN
        v_changed_by := current_setting('app.current_user', true)::uuid;
    EXCEPTION WHEN OTHERS THEN
        v_changed_by := NULL;
    END;

    -- 2. CONVERTIR A JSON PARA EVITAR ERRORES DE COLUMNAS INEXISTENTES
    -- Esta es la clave: al convertir a JSON, podemos preguntar por campos 
    -- sin que PostgreSQL lance error si no existen.
    v_new_json := to_jsonb(NEW);
    v_old_json := to_jsonb(OLD);

    -- 3. EXTRAER EL ID SEGÚN LA TABLA
    -- Usamos ->> para extraer texto del JSON. Si no existe, devuelve NULL (no explota).
    
    IF TG_TABLE_NAME = 'precios_items' THEN
        -- Clave compuesta: lista_id | producto_id
        v_record_id := COALESCE(
            (v_new_json->>'lista_id') || '|' || (v_new_json->>'producto_id'),
            (v_old_json->>'lista_id') || '|' || (v_old_json->>'producto_id')
        );
        
    ELSIF TG_TABLE_NAME = 'productos_promocion' THEN
        -- Clave compuesta: campaña_id | producto_id
        v_record_id := COALESCE(
            (v_new_json->>'campaña_id') || '|' || (v_new_json->>'producto_id'),
            (v_old_json->>'campaña_id') || '|' || (v_old_json->>'producto_id')
        );
        
    ELSIF TG_TABLE_NAME = 'promociones_clientes_permitidos' THEN
        -- Clave compuesta: campaña_id | cliente_id
        v_record_id := COALESCE(
            (v_new_json->>'campaña_id') || '|' || (v_new_json->>'cliente_id'),
            (v_old_json->>'campaña_id') || '|' || (v_old_json->>'cliente_id')
        );
        
    ELSE
        -- Caso estándar para todas las tablas normales (productos, clientes, etc.)
        -- Busca el campo "id". Si no existe, no pasa nada.
        v_record_id := COALESCE(v_new_json->>'id', v_old_json->>'id');
    END IF;

    -- 4. INSERTAR EN EL LOG DE AUDITORÍA
    INSERT INTO audit_log_catalog (
        table_name, 
        record_id, 
        operation, 
        old_data, 
        new_data, 
        changed_by, 
        ip_address
    )
    VALUES (
        TG_TABLE_NAME,
        v_record_id,
        TG_OP,
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN v_old_json END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN v_new_json END,
        v_changed_by,
        v_ip
    );
    
    RETURN NULL; -- Trigger AFTER, el retorno no afecta
END;
$$ LANGUAGE plpgsql;

-- TRIGGERS DE AUDITORÍA
CREATE TRIGGER trg_audit_productos AFTER INSERT OR UPDATE OR DELETE ON productos FOR EACH ROW EXECUTE FUNCTION fn_audit_catalog();
CREATE TRIGGER trg_audit_categorias AFTER INSERT OR UPDATE OR DELETE ON categorias FOR EACH ROW EXECUTE FUNCTION fn_audit_catalog();
CREATE TRIGGER trg_audit_zonas AFTER INSERT OR UPDATE OR DELETE ON zonas_comerciales FOR EACH ROW EXECUTE FUNCTION fn_audit_catalog();
CREATE TRIGGER trg_audit_clientes AFTER INSERT OR UPDATE OR DELETE ON clientes FOR EACH ROW EXECUTE FUNCTION fn_audit_catalog();
CREATE TRIGGER trg_audit_promociones AFTER INSERT OR UPDATE OR DELETE ON campañas_promocionales FOR EACH ROW EXECUTE FUNCTION fn_audit_catalog();
CREATE TRIGGER trg_audit_promos_clientes AFTER INSERT OR UPDATE OR DELETE ON promociones_clientes_permitidos FOR EACH ROW EXECUTE FUNCTION fn_audit_catalog();

-- =========================================
-- 11. ÍNDICES OPTIMIZADOS
-- =========================================
CREATE INDEX idx_productos_busqueda ON productos(nombre, codigo_sku) WHERE deleted_at IS NULL;
CREATE INDEX idx_clientes_ruc ON clientes(identificacion) WHERE deleted_at IS NULL;
-- Index to speed up lookups by usuario_principal_id used by catalog microservice
CREATE INDEX IF NOT EXISTS idx_clientes_usuario_principal ON clientes(usuario_principal_id);
CREATE INDEX idx_zonas_poligono ON zonas_comerciales USING GIST(poligono_geografico);
CREATE INDEX idx_clientes_gps ON clientes USING GIST(ubicacion_gps);
CREATE INDEX idx_promos_activas ON campañas_promocionales(fecha_inicio, fecha_fin) WHERE activo = TRUE AND deleted_at IS NULL;
CREATE INDEX idx_audit_catalog ON audit_log_catalog(table_name, record_id, changed_at DESC);

-- =========================================
-- 12. EVENTOS ASÍNCRONOS (MEJORADOS PARA NOTIFICACIONES)
-- =========================================
-- =================================================================
-- CORRECCIÓN: FUNCIÓN DE NOTIFICACIÓN SEGURA (Sin acceso directo a NEW.id)
-- =================================================================

CREATE OR REPLACE FUNCTION notify_catalogo_cambio()
RETURNS TRIGGER AS $$
DECLARE
    payload JSON;
    v_record_id TEXT;
    v_data JSON;
BEGIN
    -- 1. Convertimos la fila a JSON de forma segura
    -- Esto evita el error porque ya no manipulamos el Record directamente
    v_data := COALESCE(row_to_json(NEW), row_to_json(OLD));

    -- 2. Extraemos los IDs desde el JSON (v_data->>'campo')
    -- Si el campo no existe en el JSON, devuelve NULL en lugar de lanzar error.
    
    IF TG_TABLE_NAME = 'precios_items' THEN
        -- Clave compuesta: lista_id | producto_id
        v_record_id := (v_data->>'lista_id') || '|' || (v_data->>'producto_id');
        
    ELSIF TG_TABLE_NAME = 'productos_promocion' THEN
        -- Clave compuesta: campaña_id | producto_id
        v_record_id := (v_data->>'campaña_id') || '|' || (v_data->>'producto_id');
        
    ELSIF TG_TABLE_NAME = 'promociones_clientes_permitidos' THEN
         -- Clave compuesta: campaña_id | cliente_id
        v_record_id := (v_data->>'campaña_id') || '|' || (v_data->>'cliente_id');
        
    ELSE
        -- Caso por defecto: Tablas que SÍ tienen columna ID (productos, clientes, etc.)
        v_record_id := v_data->>'id';
    END IF;

    -- 3. Construir payload
    payload := json_build_object(
        'table', TG_TABLE_NAME,
        'action', TG_OP,
        'id', v_record_id,
        'data', v_data
    );

    PERFORM pg_notify('catalogo-cambio', payload::text);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Cambios en el Catálogo General
CREATE TRIGGER trg_notify_productos 
AFTER INSERT OR UPDATE OR DELETE ON productos 
FOR EACH ROW EXECUTE FUNCTION notify_catalogo_cambio();

CREATE TRIGGER trg_notify_clientes 
AFTER INSERT OR UPDATE OR DELETE ON clientes 
FOR EACH ROW EXECUTE FUNCTION notify_catalogo_cambio();

-- 2. CASO: "Nueva Promoción" (Global o por Lista)
CREATE TRIGGER trg_notify_promos 
AFTER INSERT OR UPDATE OR DELETE ON campañas_promocionales 
FOR EACH ROW EXECUTE FUNCTION notify_catalogo_cambio();

-- 3. CASO: "Promoción específica para un cliente" (Faltaba este)
CREATE TRIGGER trg_notify_promo_cliente 
AFTER INSERT OR UPDATE OR DELETE ON promociones_clientes_permitidos 
FOR EACH ROW EXECUTE FUNCTION notify_catalogo_cambio();

-- 4. CASO: "Nuevo producto en la lista de precios de ese cliente" (Faltaba este)
CREATE TRIGGER trg_notify_precios 
AFTER INSERT OR UPDATE OR DELETE ON precios_items 
FOR EACH ROW EXECUTE FUNCTION notify_catalogo_cambio();

-- 5. CASO: "Vendedor tiene nueva ruta/zona" (Faltaba este)
CREATE TRIGGER trg_notify_asignacion_vendedor 
AFTER INSERT OR UPDATE OR DELETE ON asignacion_vendedores 
FOR EACH ROW EXECUTE FUNCTION notify_catalogo_cambio();

-- 6. CASO: "Cliente agregó nueva sucursal" (Alerta para Supervisor) (Faltaba este)
CREATE TRIGGER trg_notify_sucursales 
AFTER INSERT OR UPDATE OR DELETE ON sucursales_cliente 
FOR EACH ROW EXECUTE FUNCTION notify_catalogo_cambio();

-- =========================================
-- 13. AUTOMATIZACIÓN (UPDATED_AT)
-- =========================================
CREATE OR REPLACE FUNCTION fn_update_timestamp_catalog()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_upd_categorias BEFORE UPDATE ON categorias FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp_catalog();
CREATE TRIGGER tr_upd_productos BEFORE UPDATE ON productos FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp_catalog();
CREATE TRIGGER tr_upd_zonas BEFORE UPDATE ON zonas_comerciales FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp_catalog();
CREATE TRIGGER tr_upd_clientes BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp_catalog();
CREATE TRIGGER tr_upd_sucursales BEFORE UPDATE ON sucursales_cliente FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp_catalog();
CREATE TRIGGER tr_upd_campañas BEFORE UPDATE ON campañas_promocionales FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp_catalog();
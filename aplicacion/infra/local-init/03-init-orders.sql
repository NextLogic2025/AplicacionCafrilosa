-- ==================================================================================
-- MICROSERVICIO: ORDERS SERVICE (svc-orders) - VERSIÓN ROBUSTA & RESILIENTE
-- BASE DE DATOS: orders_db
-- MOTOR: PostgreSQL 14+
-- ==================================================================================

\c orders_db

-- 1.a ELIMINAR TABLAS ANTIGUAS (Limpieza profunda para evitar conflictos de tipos)
DROP TABLE IF EXISTS promociones_aplicadas CASCADE;
DROP TABLE IF EXISTS detalles_pedido CASCADE;
DROP TABLE IF EXISTS historial_estados CASCADE;
DROP TABLE IF EXISTS pedidos CASCADE;
DROP TABLE IF EXISTS carritos_items CASCADE;
DROP TABLE IF EXISTS carritos_cabecera CASCADE;
DROP TABLE IF EXISTS estados_pedido CASCADE;
DROP TABLE IF EXISTS audit_log_orders CASCADE;
DROP TABLE IF EXISTS pagos_pedido CASCADE; -- Por si acaso existía
DROP TABLE IF EXISTS pagos_resumen CASCADE; -- Por si acaso existía

-- =========================================
-- 1. EXTENSIONES
-- =========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- =========================================
-- 2. ESTADOS DE PEDIDO
-- =========================================
CREATE TABLE estados_pedido (
    codigo VARCHAR(20) PRIMARY KEY,
    nombre_visible VARCHAR(50) NOT NULL,
    descripcion TEXT,
    es_estado_final BOOLEAN DEFAULT FALSE,
    orden_secuencia INT
);

-- =========================================
-- 3. CARRITO DE COMPRAS
-- =========================================
CREATE TABLE carritos_cabecera (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL,           
    vendedor_id UUID,                   
    cliente_id UUID,                    
    total_estimado DECIMAL(12,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE carritos_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    carrito_id UUID REFERENCES carritos_cabecera(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL,          
    cantidad DECIMAL(12,2) NOT NULL CHECK (cantidad > 0),
    precio_unitario_ref DECIMAL(10,2), 
    precio_original_snapshot DECIMAL(10,2), 
    campania_aplicada_id INT,
    motivo_descuento VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(carrito_id, producto_id)
);

-- =========================================
-- 4. PEDIDOS
-- =========================================
CREATE TABLE pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_visual SERIAL UNIQUE,
    cliente_id UUID NOT NULL,
    vendedor_id UUID, 
    estado_actual VARCHAR(20) NOT NULL REFERENCES estados_pedido(codigo) DEFAULT 'PENDIENTE',
    
    -- TOTALES
    subtotal DECIMAL(12,2) NOT NULL CHECK (subtotal >= 0),
    descuento_total DECIMAL(12,2) DEFAULT 0 CHECK (descuento_total >= 0),
    impuestos_total DECIMAL(12,2) NOT NULL CHECK (impuestos_total >= 0),
    total_final DECIMAL(12,2) NOT NULL CHECK (total_final >= 0),
    
    -- METADATA
    fecha_entrega_solicitada DATE,
    ubicacion_pedido GEOMETRY(POINT, 4326),
    observaciones_entrega TEXT,
    
    -- ESTADO DE PAGO / FACTURACIÓN
    factura_id UUID,
   
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- =========================================
-- 5. DETALLE DE PEDIDO (HISTÓRICO / SNAPSHOT)
-- =========================================
CREATE TABLE detalles_pedido (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL,
    
    -- SNAPSHOTS DEL PRODUCTO
    codigo_sku VARCHAR(50),
    nombre_producto VARCHAR(200),
    unidad_medida VARCHAR(20),
    
    cantidad DECIMAL(12,2) NOT NULL CHECK (cantidad > 0),
    cantidad_solicitada DECIMAL(12,2),
    motivo_ajuste VARCHAR(50),
    nota_al_cliente TEXT,
    
    -- PRECIOS CONGELADOS
    precio_lista DECIMAL(10,2),       
    precio_final DECIMAL(10,2),       
    
    -- DATOS DE PROMOCIÓN
    es_bonificacion BOOLEAN DEFAULT FALSE,
    motivo_descuento VARCHAR(100),    
    campania_aplicada_id INT,         
    
    subtotal_linea DECIMAL(12,2) GENERATED ALWAYS AS (cantidad * precio_final) STORED,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- 6. PROMOCIONES APLICADAS (ANALÍTICA)
-- =========================================
CREATE TABLE promociones_aplicadas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
    detalle_pedido_id UUID REFERENCES detalles_pedido(id) ON DELETE CASCADE,
    campania_id INT,
    tipo_descuento VARCHAR(20),
    valor_descuento DECIMAL(10,2),
    monto_aplicado DECIMAL(12,2) NOT NULL CHECK (monto_aplicado >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- 7. HISTORIAL DE ESTADOS
-- =========================================
CREATE TABLE historial_estados (
    id BIGSERIAL PRIMARY KEY,
    pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
    estado_anterior VARCHAR(20),
    estado_nuevo VARCHAR(20),
    usuario_responsable_id UUID,
    motivo_cambio TEXT,
    fecha_cambio TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- 8. AUDITORÍA ROBUSTA
-- =========================================
CREATE TABLE audit_log_orders (
    id BIGSERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    -- CAMBIO IMPORTANTE: TEXT en lugar de UUID para soportar 'estados_pedido' (PK varchar)
    record_id TEXT DEFAULT 'UNKNOWN', 
    operation VARCHAR(10) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changed_by UUID,
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET
);

-- ==================================================================================
-- 9. FUNCIONES "DEFENSIVAS" (ROBUSTAS A CAMBIOS DE ESQUEMA)
-- ==================================================================================

-- 9.1 Función de Auditoría (Usa JSONB)
CREATE OR REPLACE FUNCTION fn_audit_orders()
RETURNS TRIGGER AS $$
DECLARE
    v_changed_by UUID;
    v_ip INET := inet_client_addr();
    v_record_id TEXT;
    v_new_json JSONB;
    v_old_json JSONB;
BEGIN
    -- Intentar obtener usuario
    BEGIN
        v_changed_by := current_setting('app.current_user', true)::uuid;
    EXCEPTION WHEN OTHERS THEN
        v_changed_by := NULL;
    END;

    v_new_json := to_jsonb(NEW);
    v_old_json := to_jsonb(OLD);

    -- Lógica de extracción de ID resiliente
    IF TG_TABLE_NAME = 'estados_pedido' AND (v_new_json ? 'codigo' OR v_old_json ? 'codigo') THEN
        v_record_id := COALESCE(v_new_json->>'codigo', v_old_json->>'codigo');
    ELSE
        -- La mayoría de tablas en Orders usan 'id' (UUID)
        v_record_id := COALESCE(v_new_json->>'id', v_old_json->>'id', 'NO_PK');
    END IF;

    INSERT INTO audit_log_orders (
        table_name, record_id, operation, old_data, new_data, changed_by, ip_address
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
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 9.2 Función de Notificación Unificada (Payload JSON rico)
CREATE OR REPLACE FUNCTION notify_ordenes_cambio()
RETURNS TRIGGER AS $$
DECLARE
    payload JSON;
    v_record_id TEXT;
    v_data JSONB;
BEGIN
    v_data := to_jsonb(COALESCE(NEW, OLD));

    -- Extracción segura de ID
    IF TG_TABLE_NAME = 'estados_pedido' THEN
        v_record_id := v_data->>'codigo';
    ELSE
        v_record_id := COALESCE(v_data->>'id', 'GENERIC');
    END IF;

    payload := json_build_object(
        'table', TG_TABLE_NAME,
        'action', TG_OP,
        'id', v_record_id,
        'estado_actual', v_data->>'estado_actual', -- Útil para filtrar en el backend
        'data', v_data
    );

    -- Un solo canal 'ordenes-cambio', el backend filtra por 'table' y 'action'
    PERFORM pg_notify('ordenes-cambio', payload::text);
    
    IF (TG_OP = 'DELETE') THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql;

-- 9.3 Soft Delete Automático
CREATE OR REPLACE FUNCTION fn_soft_delete_orders()
RETURNS TRIGGER AS $$
BEGIN
    NEW.deleted_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9.4 Updated At Automático
CREATE OR REPLACE FUNCTION fn_update_timestamp_orders()
RETURNS TRIGGER AS $$
BEGIN
    -- Si borras la columna updated_at, borra el trigger asociado.
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- 10. APLICACIÓN DE TRIGGERS
-- =========================================

-- 10.1 Auditoría
CREATE TRIGGER trg_audit_pedidos AFTER INSERT OR UPDATE OR DELETE ON pedidos FOR EACH ROW EXECUTE FUNCTION fn_audit_orders();
CREATE TRIGGER trg_audit_detalles AFTER INSERT OR UPDATE OR DELETE ON detalles_pedido FOR EACH ROW EXECUTE FUNCTION fn_audit_orders();
CREATE TRIGGER trg_audit_promociones AFTER INSERT OR UPDATE OR DELETE ON promociones_aplicadas FOR EACH ROW EXECUTE FUNCTION fn_audit_orders();
CREATE TRIGGER trg_audit_estados AFTER INSERT OR UPDATE OR DELETE ON estados_pedido FOR EACH ROW EXECUTE FUNCTION fn_audit_orders();

-- 10.2 Notificaciones (Reemplaza a las notify_pedido_creado, etc.)
CREATE TRIGGER trg_notify_pedidos 
AFTER INSERT OR UPDATE OR DELETE ON pedidos 
FOR EACH ROW EXECUTE FUNCTION notify_ordenes_cambio();

-- 10.3 Timestamps
CREATE TRIGGER tr_updated_pedidos BEFORE UPDATE ON pedidos FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp_orders();
CREATE TRIGGER tr_updated_detalles BEFORE UPDATE ON detalles_pedido FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp_orders();
CREATE TRIGGER tr_updated_promociones BEFORE UPDATE ON promociones_aplicadas FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp_orders();
CREATE TRIGGER tr_updated_carritos BEFORE UPDATE ON carritos_cabecera FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp_orders();

-- 10.4 Soft Delete
CREATE TRIGGER trg_soft_delete_pedidos BEFORE DELETE ON pedidos FOR EACH ROW EXECUTE FUNCTION fn_soft_delete_orders();
CREATE TRIGGER trg_soft_delete_carritos BEFORE DELETE ON carritos_cabecera FOR EACH ROW EXECUTE FUNCTION fn_soft_delete_orders();

-- =========================================
-- 11. ÍNDICES Y DATOS INICIALES
-- =========================================

-- Índices Carrito
CREATE INDEX idx_carrito_cliente ON carritos_cabecera(usuario_id, vendedor_id) WHERE vendedor_id IS NULL AND deleted_at IS NULL;
CREATE INDEX idx_carrito_vendedor ON carritos_cabecera(usuario_id, vendedor_id) WHERE vendedor_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_carrito_cliente_id ON carritos_cabecera(cliente_id) WHERE deleted_at IS NULL;

-- Índices Pedidos
CREATE INDEX idx_pedidos_vendedor ON pedidos(vendedor_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_pedidos_cliente ON pedidos(cliente_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_pedidos_estado ON pedidos(estado_actual) WHERE deleted_at IS NULL;
CREATE INDEX idx_pedidos_gps ON pedidos USING GIST(ubicacion_pedido);
CREATE INDEX idx_promociones_pedido ON promociones_aplicadas(pedido_id);
CREATE INDEX idx_audit_orders ON audit_log_orders(table_name, record_id, changed_at DESC);

-- Datos Semilla: Estados
INSERT INTO estados_pedido (codigo, nombre_visible, descripcion, es_estado_final, orden_secuencia) VALUES
('PENDIENTE', 'Pendiente de Aprobación', 'Esperando validación de Crédito y Stock', FALSE, 1),
('APROBADO', 'Aprobado', 'Validado, en cola para Bodega', FALSE, 2),
('EN_PREPARACION', 'En Preparación', 'Bodega está haciendo picking', FALSE, 3),
('PREPARADO', 'Preparado', 'Pedido listo tras completar picking', FALSE, 4),
('FACTURADO', 'Facturado', 'Documento legal generado', FALSE, 5),
('EN_RUTA', 'En Camino', 'Transportista asignado y en ruta', FALSE, 6),
('ENTREGADO', 'Entregado', 'Cliente recibió conforme', TRUE, 7),
('ANULADO', 'Anulado', 'Cancelado por usuario o sistema', TRUE, 0),
('RECHAZADO', 'Rechazado', 'Fallo en crédito o stock', TRUE, 0);
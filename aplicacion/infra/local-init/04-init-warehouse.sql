-- ==================================================================================
-- MICROSERVICIO: WAREHOUSE SERVICE (svc-warehouse) - VERSIÓN ROBUSTA & RESILIENTE
-- BASE DE DATOS: warehouse_db
-- MOTOR: PostgreSQL 14+
-- ==================================================================================

\c warehouse_db

-- 1.a LIMPIEZA INICIAL (Orden inverso de dependencias)
DROP TABLE IF EXISTS audit_log_warehouse CASCADE;
DROP TABLE IF EXISTS devoluciones_recibidas CASCADE;
DROP TABLE IF EXISTS kardex_movimientos CASCADE;
DROP TABLE IF EXISTS picking_items CASCADE;
DROP TABLE IF EXISTS picking_ordenes CASCADE;
DROP TABLE IF EXISTS stock_ubicacion CASCADE;
DROP TABLE IF EXISTS lotes CASCADE;
DROP TABLE IF EXISTS ubicaciones CASCADE;
DROP TABLE IF EXISTS almacenes CASCADE;

-- =========================================
-- 1. EXTENSIONES
-- =========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================
-- 2. ALMACENES
-- =========================================
CREATE TABLE almacenes (
    id SERIAL PRIMARY KEY, -- Nota: Es SERIAL (Integer), el auditor debe manejarlo como texto
    nombre VARCHAR(50) NOT NULL,
    codigo_ref VARCHAR(10) UNIQUE,
    requiere_frio BOOLEAN DEFAULT FALSE,
    direccion_fisica TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- 3. UBICACIONES
-- =========================================
CREATE TABLE ubicaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    almacen_id INT NOT NULL REFERENCES almacenes(id),
    codigo_visual VARCHAR(20) NOT NULL,
    tipo VARCHAR(20) DEFAULT 'RACK',
    capacidad_max_kg DECIMAL(10,2),
    es_cuarentena BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(almacen_id, codigo_visual)
);

-- =========================================
-- 4. LOTES
-- =========================================
CREATE TABLE lotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID NOT NULL,              -- referencia lógica a catalog_db.productos
    numero_lote VARCHAR(50) NOT NULL,
    fecha_fabricacion DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    estado_calidad VARCHAR(20) DEFAULT 'LIBERADO',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(producto_id, numero_lote)
);

-- =========================================
-- 5. STOCK POR UBICACIÓN
-- =========================================
CREATE TABLE stock_ubicacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ubicacion_id UUID NOT NULL REFERENCES ubicaciones(id),
    lote_id UUID NOT NULL REFERENCES lotes(id),
    cantidad_fisica DECIMAL(12,2) NOT NULL CHECK (cantidad_fisica >= 0),
    cantidad_reservada DECIMAL(12,2) DEFAULT 0 CHECK (cantidad_reservada >= 0),
    ultima_entrada TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(ubicacion_id, lote_id)
);

-- =========================================
-- 6. PICKING ÓRDENES (con soft delete)
-- =========================================
CREATE TABLE picking_ordenes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID UNIQUE NOT NULL,         -- referencia lógica a orders_db.pedidos
    reservation_id UUID,
    bodeguero_asignado_id UUID,             -- referencia lógica a auth_db.usuarios
    prioridad INT DEFAULT 1,
    estado VARCHAR(20) DEFAULT 'ASIGNADO',
    fecha_inicio TIMESTAMPTZ,
    fecha_fin TIMESTAMPTZ,
    observaciones_bodega TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ                  -- SOFT DELETE
);

-- =========================================
-- 7. PICKING ITEMS
-- =========================================
CREATE TABLE picking_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    picking_id UUID NOT NULL REFERENCES picking_ordenes(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL,              -- referencia lógica a catalog_db.productos
    cantidad_solicitada DECIMAL(12,2) NOT NULL CHECK (cantidad_solicitada > 0),
    ubicacion_origen_sugerida UUID REFERENCES ubicaciones(id),
    lote_sugerido UUID REFERENCES lotes(id),
    cantidad_pickeada DECIMAL(12,2) DEFAULT 0 CHECK (cantidad_pickeada >= 0),
    lote_confirmado UUID REFERENCES lotes(id),
    estado_linea VARCHAR(20) DEFAULT 'PENDIENTE',
    
    -- Nuevas columnas integradas (evita ALTER TABLE posterior)
    motivo_desviacion VARCHAR(50),
    notas_bodeguero TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- 8. KARDEX
-- =========================================
CREATE TABLE kardex_movimientos (
    id BIGSERIAL PRIMARY KEY,
    fecha TIMESTAMPTZ DEFAULT NOW(),
    tipo_movimiento VARCHAR(30) NOT NULL,
    referencia_doc_uuid UUID,
    producto_id UUID NOT NULL,
    lote_id UUID,
    ubicacion_origen UUID,
    ubicacion_destino UUID,
    cantidad DECIMAL(12,2) NOT NULL,
    saldo_resultante DECIMAL(12,2),
    usuario_responsable_id UUID,
    costo_unitario DECIMAL(12,4),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- 9. DEVOLUCIONES (con soft delete)
-- =========================================
CREATE TABLE devoluciones_recibidas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nota_credito_id UUID,
    pedido_origen_id UUID,
    picking_id UUID REFERENCES picking_ordenes(id),
    lote_id UUID REFERENCES lotes(id),
    cantidad_recibida DECIMAL(12,2) NOT NULL CHECK (cantidad_recibida > 0),
    estado_producto VARCHAR(20) DEFAULT 'BUENO',
    decision_inventario VARCHAR(20),
    observaciones TEXT,
    fecha_recepcion TIMESTAMPTZ DEFAULT NOW(),
    usuario_recibio UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- =========================================
-- 10. AUDITORÍA ROBUSTA
-- =========================================
CREATE TABLE audit_log_warehouse (
    id BIGSERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id TEXT DEFAULT 'UNKNOWN', -- TEXT para soportar UUID (picking) e INT (almacenes/kardex)
    operation VARCHAR(10) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changed_by UUID,
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET
);

-- ==================================================================================
-- 11. FUNCIONES "DEFENSIVAS" (ROBUSTAS A CAMBIOS DE ESQUEMA)
-- ==================================================================================

-- 11.1 Función de Auditoría (Usa JSONB)
CREATE OR REPLACE FUNCTION fn_audit_warehouse()
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

    -- Extracción segura de ID (funciona para almacenes(int) y los demás(uuid))
    -- Si borras la columna ID, esto no falla, devuelve 'NO_PK'
    v_record_id := COALESCE(v_new_json->>'id', v_old_json->>'id', 'NO_PK');

    INSERT INTO audit_log_warehouse (
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

-- 11.2 Función de Notificación Unificada
CREATE OR REPLACE FUNCTION notify_warehouse_cambio()
RETURNS TRIGGER AS $$
DECLARE
    payload JSON;
    v_record_id TEXT;
    v_data JSONB;
BEGIN
    v_data := to_jsonb(COALESCE(NEW, OLD));
    
    -- ID seguro
    v_record_id := COALESCE(v_data->>'id', 'GENERIC');

    payload := json_build_object(
        'table', TG_TABLE_NAME,
        'action', TG_OP,
        'id', v_record_id,
        'data', v_data -- Incluye todo el registro para que el consumidor decida qué usar
    );

    -- Un solo canal 'warehouse-cambio'
    PERFORM pg_notify('warehouse-cambio', payload::text);
    
    IF (TG_OP = 'DELETE') THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql;

-- 11.3 Soft Delete
CREATE OR REPLACE FUNCTION fn_soft_delete_warehouse()
RETURNS TRIGGER AS $$
BEGIN
    NEW.deleted_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11.4 Updated At
CREATE OR REPLACE FUNCTION fn_update_timestamp_warehouse()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- 12. APLICACIÓN DE TRIGGERS
-- =========================================

-- 12.1 Triggers de Auditoría
CREATE TRIGGER trg_audit_almacenes AFTER INSERT OR UPDATE OR DELETE ON almacenes FOR EACH ROW EXECUTE FUNCTION fn_audit_warehouse();
CREATE TRIGGER trg_audit_ubicaciones AFTER INSERT OR UPDATE OR DELETE ON ubicaciones FOR EACH ROW EXECUTE FUNCTION fn_audit_warehouse();
CREATE TRIGGER trg_audit_lotes AFTER INSERT OR UPDATE OR DELETE ON lotes FOR EACH ROW EXECUTE FUNCTION fn_audit_warehouse();
CREATE TRIGGER trg_audit_stock AFTER INSERT OR UPDATE OR DELETE ON stock_ubicacion FOR EACH ROW EXECUTE FUNCTION fn_audit_warehouse();
CREATE TRIGGER trg_audit_picking AFTER INSERT OR UPDATE OR DELETE ON picking_ordenes FOR EACH ROW EXECUTE FUNCTION fn_audit_warehouse();
CREATE TRIGGER trg_audit_picking_items AFTER INSERT OR UPDATE OR DELETE ON picking_items FOR EACH ROW EXECUTE FUNCTION fn_audit_warehouse();
CREATE TRIGGER trg_audit_kardex AFTER INSERT OR UPDATE OR DELETE ON kardex_movimientos FOR EACH ROW EXECUTE FUNCTION fn_audit_warehouse();
CREATE TRIGGER trg_audit_devoluciones AFTER INSERT OR UPDATE OR DELETE ON devoluciones_recibidas FOR EACH ROW EXECUTE FUNCTION fn_audit_warehouse();

-- 12.2 Triggers de Notificación (Eventos asíncronos unificados)
CREATE TRIGGER trg_notify_picking AFTER INSERT OR UPDATE OR DELETE ON picking_ordenes FOR EACH ROW EXECUTE FUNCTION notify_warehouse_cambio();
CREATE TRIGGER trg_notify_devoluciones AFTER INSERT OR UPDATE OR DELETE ON devoluciones_recibidas FOR EACH ROW EXECUTE FUNCTION notify_warehouse_cambio();
CREATE TRIGGER trg_notify_stock AFTER INSERT OR UPDATE OR DELETE ON stock_ubicacion FOR EACH ROW EXECUTE FUNCTION notify_warehouse_cambio();

-- 12.3 Triggers de Timestamp
CREATE TRIGGER tr_updated_almacenes BEFORE UPDATE ON almacenes FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp_warehouse();
CREATE TRIGGER tr_updated_ubicaciones BEFORE UPDATE ON ubicaciones FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp_warehouse();
CREATE TRIGGER tr_updated_lotes BEFORE UPDATE ON lotes FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp_warehouse();
CREATE TRIGGER tr_updated_stock BEFORE UPDATE ON stock_ubicacion FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp_warehouse();
CREATE TRIGGER tr_updated_picking BEFORE UPDATE ON picking_ordenes FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp_warehouse();
CREATE TRIGGER tr_updated_picking_items BEFORE UPDATE ON picking_items FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp_warehouse();
CREATE TRIGGER tr_updated_devoluciones BEFORE UPDATE ON devoluciones_recibidas FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp_warehouse();

-- 12.4 Triggers de Soft Delete
CREATE TRIGGER trg_soft_delete_picking BEFORE DELETE ON picking_ordenes FOR EACH ROW EXECUTE FUNCTION fn_soft_delete_warehouse();
CREATE TRIGGER trg_soft_delete_devoluciones BEFORE DELETE ON devoluciones_recibidas FOR EACH ROW EXECUTE FUNCTION fn_soft_delete_warehouse();

-- =========================================
-- 13. ÍNDICES
-- =========================================
CREATE INDEX idx_fefo_lotes ON lotes(producto_id, fecha_vencimiento ASC, estado_calidad);
CREATE INDEX idx_stock_saldo ON stock_ubicacion(lote_id) WHERE cantidad_fisica > 0;
CREATE INDEX idx_picking_bodeguero ON picking_ordenes(bodeguero_asignado_id, estado) WHERE deleted_at IS NULL;
CREATE INDEX idx_kardex_producto ON kardex_movimientos(producto_id, fecha DESC);
CREATE INDEX idx_devoluciones_nc ON devoluciones_recibidas(nota_credito_id);
CREATE INDEX idx_audit_warehouse ON audit_log_warehouse(table_name, record_id, changed_at DESC);
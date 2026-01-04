-- ==================================================================================
-- MICROSERVICIO: ORDERS SERVICE (svc-orders) - VERSIÓN FINAL 100% COMPLETA
-- BASE DE DATOS: orders_db
-- MOTOR: PostgreSQL 14+
-- ==================================================================================

\c orders_db;
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

INSERT INTO estados_pedido (codigo, nombre_visible, descripcion, es_estado_final, orden_secuencia) VALUES
('PENDIENTE', 'Pendiente de Aprobación', 'Esperando validación de Crédito y Stock', FALSE, 1),
('APROBADO', 'Aprobado', 'Validado, en cola para Bodega', FALSE, 2),
('EN_PREPARACION', 'En Preparación', 'Bodega está haciendo picking', FALSE, 3),
('FACTURADO', 'Facturado', 'Documento legal generado', FALSE, 4),
('EN_RUTA', 'En Camino', 'Transportista asignado y en ruta', FALSE, 5),
('ENTREGADO', 'Entregado', 'Cliente recibió conforme', TRUE, 6),
('ANULADO', 'Anulado', 'Cancelado por usuario o sistema', TRUE, 0),
('RECHAZADO', 'Rechazado', 'Fallo en crédito o stock', TRUE, 0);

-- =========================================
-- 3. CARRITO DE COMPRAS (con soft delete y updated_at)
-- =========================================
CREATE TABLE carritos_cabecera (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL,           -- referencia lógica a auth_db.usuarios
    cliente_id UUID,                    -- referencia lógica a catalog_db.clientes
    total_estimado DECIMAL(12,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ              -- SOFT DELETE
);

CREATE TABLE carritos_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    carrito_id UUID REFERENCES carritos_cabecera(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL,          -- referencia lógica a catalog_db.productos
    cantidad DECIMAL(12,2) NOT NULL CHECK (cantidad > 0),
    precio_unitario_ref DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(carrito_id, producto_id)
);

-- =========================================
-- 4. PEDIDOS (con soft delete y updated_at)
-- =========================================
CREATE TABLE pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_visual SERIAL UNIQUE,
    cliente_id UUID NOT NULL,           -- referencia lógica a catalog_db.clientes
    vendedor_id UUID NOT NULL,          -- referencia lógica a auth_db.usuarios
    sucursal_id UUID,                   -- referencia lógica a catalog_db.sucursales_cliente
    estado_actual VARCHAR(20) NOT NULL REFERENCES estados_pedido(codigo) DEFAULT 'PENDIENTE',
    subtotal DECIMAL(12,2) NOT NULL CHECK (subtotal >= 0),
    descuento_total DECIMAL(12,2) DEFAULT 0 CHECK (descuento_total >= 0),
    impuestos_total DECIMAL(12,2) NOT NULL CHECK (impuestos_total >= 0),
    total_final DECIMAL(12,2) NOT NULL CHECK (total_final >= 0),
    condicion_pago VARCHAR(50),
    fecha_entrega_solicitada DATE,
    origen_pedido VARCHAR(20),          -- APP_MOVIL, WEB_CLIENTE, etc.
    ubicacion_pedido GEOMETRY(POINT, 4326),
    observaciones_entrega TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ              -- SOFT DELETE
);

-- =========================================
-- 5. DETALLE DE PEDIDO
-- =========================================
CREATE TABLE detalles_pedido (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL,          -- referencia lógica a catalog_db.productos
    codigo_sku VARCHAR(50),
    nombre_producto VARCHAR(200),
    cantidad DECIMAL(12,2) NOT NULL CHECK (cantidad > 0),
    unidad_medida VARCHAR(20),
    precio_lista DECIMAL(10,2),
    precio_final DECIMAL(10,2),
    es_bonificacion BOOLEAN DEFAULT FALSE,
    motivo_descuento VARCHAR(100),
    subtotal_linea DECIMAL(12,2) GENERATED ALWAYS AS (cantidad * precio_final) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- 6. PROMOCIONES APLICADAS
-- =========================================
CREATE TABLE promociones_aplicadas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
    detalle_pedido_id UUID REFERENCES detalles_pedido(id) ON DELETE CASCADE,
    campaña_id INT,                     -- referencia lógica a catalog_db.campañas_promocionales
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
    usuario_responsable_id UUID,        -- referencia lógica a auth_db.usuarios
    motivo_cambio TEXT,
    fecha_cambio TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- 8. AUDITORÍA
-- =========================================
CREATE TABLE audit_log_orders (
    id BIGSERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    operation VARCHAR(10) NOT NULL,     -- INSERT | UPDATE | DELETE
    old_data JSONB,
    new_data JSONB,
    changed_by UUID,
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET
);

-- =========================================
-- 9. FUNCIÓN DE AUDITORÍA MEJORADA
-- =========================================
CREATE OR REPLACE FUNCTION fn_audit_orders()
RETURNS TRIGGER AS $$
DECLARE
    v_changed_by UUID := current_setting('app.current_user', true)::uuid;
    v_ip INET := inet_client_addr();
BEGIN
    INSERT INTO audit_log_orders (
        table_name, record_id, operation, old_data, new_data, changed_by, ip_address
    )
    VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) END,
        v_changed_by,
        v_ip
    );
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- 10. TRIGGERS DE AUDITORÍA (tablas críticas)
-- =========================================
CREATE TRIGGER trg_audit_pedidos
AFTER INSERT OR UPDATE OR DELETE ON pedidos
FOR EACH ROW EXECUTE FUNCTION fn_audit_orders();

CREATE TRIGGER trg_audit_detalles
AFTER INSERT OR UPDATE OR DELETE ON detalles_pedido
FOR EACH ROW EXECUTE FUNCTION fn_audit_orders();

CREATE TRIGGER trg_audit_promociones
AFTER INSERT OR UPDATE OR DELETE ON promociones_aplicadas
FOR EACH ROW EXECUTE FUNCTION fn_audit_orders();

CREATE TRIGGER trg_audit_historial
AFTER INSERT OR UPDATE OR DELETE ON historial_estados
FOR EACH ROW EXECUTE FUNCTION fn_audit_orders();

CREATE TRIGGER trg_audit_carritos
AFTER INSERT OR UPDATE OR DELETE ON carritos_cabecera
FOR EACH ROW EXECUTE FUNCTION fn_audit_orders();

-- =========================================
-- 11. TRIGGER UPDATED_AT AUTOMÁTICO
-- =========================================
CREATE OR REPLACE FUNCTION fn_update_timestamp_orders()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_updated_pedidos
BEFORE UPDATE ON pedidos
FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp_orders();

CREATE TRIGGER tr_updated_detalles
BEFORE UPDATE ON detalles_pedido
FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp_orders();

CREATE TRIGGER tr_updated_promociones
BEFORE UPDATE ON promociones_aplicadas
FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp_orders();

CREATE TRIGGER tr_updated_carritos
BEFORE UPDATE ON carritos_cabecera
FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp_orders();

-- =========================================
-- 12. SOFT DELETE AUTOMÁTICO
-- =========================================
CREATE OR REPLACE FUNCTION fn_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
    NEW.deleted_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_soft_delete_pedidos
BEFORE DELETE ON pedidos
FOR EACH ROW EXECUTE FUNCTION fn_soft_delete();

CREATE TRIGGER trg_soft_delete_carritos
BEFORE DELETE ON carritos_cabecera
FOR EACH ROW EXECUTE FUNCTION fn_soft_delete();

-- =========================================
-- 13. ÍNDICES OPTIMIZADOS
-- =========================================
CREATE INDEX idx_pedidos_vendedor ON pedidos(vendedor_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_pedidos_cliente ON pedidos(cliente_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_pedidos_estado ON pedidos(estado_actual) WHERE deleted_at IS NULL;
CREATE INDEX idx_pedidos_gps ON pedidos USING GIST(ubicacion_pedido);
CREATE INDEX idx_promociones_pedido ON promociones_aplicadas(pedido_id);
CREATE INDEX idx_audit_orders ON audit_log_orders(table_name, record_id, changed_at DESC);

-- =========================================
-- 14. EVENTOS ASÍNCRONOS (pg_notify → Cloud Functions)
-- =========================================
-- Pedido creado
CREATE OR REPLACE FUNCTION notify_pedido_creado()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify('pedido-creado', NEW.id::text);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notify_pedido_creado
AFTER INSERT ON pedidos
FOR EACH ROW EXECUTE FUNCTION notify_pedido_creado();

-- Pedido aprobado
CREATE OR REPLACE FUNCTION notify_pedido_aprobado()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.estado_actual = 'APROBADO' AND (OLD.estado_actual IS DISTINCT FROM 'APROBADO') THEN
        PERFORM pg_notify('pedido-aprobado', NEW.id::text);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notify_pedido_aprobado
AFTER UPDATE ON pedidos
FOR EACH ROW EXECUTE FUNCTION notify_pedido_aprobado();

-- Pedido entregado (nuevo evento agregado)
CREATE OR REPLACE FUNCTION notify_pedido_entregado()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.estado_actual = 'ENTREGADO' AND (OLD.estado_actual IS DISTINCT FROM 'ENTREGADO') THEN
        PERFORM pg_notify('pedido-entregado', NEW.id::text);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notify_pedido_entregado
AFTER UPDATE ON pedidos
FOR EACH ROW EXECUTE FUNCTION notify_pedido_entregado();

-- =========================================
-- FIN DEL MICROSERVICIO ORDERS - 100% COMPLETO
-- =========================================
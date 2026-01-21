-- ==================================================================================
-- MICROSERVICIO: ORDERS SERVICE (svc-orders) - VERSIÓN FINAL "SNAPSHOT STRATEGY"
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
('PREPARADO', 'Preparado', 'Pedido listo tras completar picking', FALSE, 4),
('FACTURADO', 'Facturado', 'Documento legal generado', FALSE, 5),
('EN_RUTA', 'En Camino', 'Transportista asignado y en ruta', FALSE, 6),
('ENTREGADO', 'Entregado', 'Cliente recibió conforme', TRUE, 7),
('ANULADO', 'Anulado', 'Cancelado por usuario o sistema', TRUE, 0),
('RECHAZADO', 'Rechazado', 'Fallo en crédito o stock', TRUE, 0);

-- =========================================
-- 3. CARRITO DE COMPRAS
-- =========================================
CREATE TABLE carritos_cabecera (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL,           -- referencia lógica a auth_db.usuarios
    vendedor_id UUID,                   -- referencia lógica a auth_db.usuarios (vendedor que crea el carrito). NULL si es cliente
    cliente_id UUID,                    -- referencia lógica a catalog_db.clientes
    total_estimado DECIMAL(12,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ              -- SOFT DELETE
);

-- Índices para búsquedas rápidas por usuario + vendedor
-- Índice 1: Carritos de cliente (vendedor_id IS NULL)
CREATE INDEX idx_carrito_cliente 
ON carritos_cabecera(usuario_id, vendedor_id) WHERE vendedor_id IS NULL AND deleted_at IS NULL;

-- Índice 2: Carritos de vendedor (vendedor_id IS NOT NULL)
CREATE INDEX idx_carrito_vendedor 
ON carritos_cabecera(usuario_id, vendedor_id) WHERE vendedor_id IS NOT NULL AND deleted_at IS NULL;

-- Índice 3: Para resolver cliente_id
CREATE INDEX idx_carrito_cliente_id 
ON carritos_cabecera(cliente_id) WHERE deleted_at IS NULL;

CREATE TABLE carritos_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    carrito_id UUID REFERENCES carritos_cabecera(id) ON DELETE CASCADE,
    
    producto_id UUID NOT NULL,          -- referencia lógica a catalog_db.productos
    cantidad DECIMAL(12,2) NOT NULL CHECK (cantidad > 0),
    
    -- PRECIO QUE PAGA EL CLIENTE (OFERTA)
    precio_unitario_ref DECIMAL(10,2), 

    -- === NUEVOS CAMPOS (SNAPSHOTS) ===
    -- PRECIO NORMAL (Para mostrar tachado: "Antes $20")
    precio_original_snapshot DECIMAL(10,2), 
    
    -- ID DE CAMPAÑA (Para validación estricta al comprar)
    campania_aplicada_id INT,

    -- NOMBRE DE LA OFERTA (Para mostrar: "Descuento Verano")
    motivo_descuento VARCHAR(100),
    -- =================================
    
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
    vendedor_id UUID,  -- Nullable: puede no tener vendedor asignado
    sucursal_id UUID,
    reservation_id UUID,
    estado_actual VARCHAR(20) NOT NULL REFERENCES estados_pedido(codigo) DEFAULT 'PENDIENTE',
    
    -- TOTALES
    subtotal DECIMAL(12,2) NOT NULL CHECK (subtotal >= 0),
    descuento_total DECIMAL(12,2) DEFAULT 0 CHECK (descuento_total >= 0),
    impuestos_total DECIMAL(12,2) NOT NULL CHECK (impuestos_total >= 0),
    total_final DECIMAL(12,2) NOT NULL CHECK (total_final >= 0),
    
    -- METADATA
    condicion_pago VARCHAR(50),
    fecha_entrega_solicitada DATE,
    origen_pedido VARCHAR(20),
    ubicacion_pedido GEOMETRY(POINT, 4326),
    observaciones_entrega TEXT,
    
    -- ESTADO DE PAGO
    monto_pagado DECIMAL(12,2) DEFAULT 0 CHECK (monto_pagado >= 0),
    estado_pago VARCHAR(20) DEFAULT 'PENDIENTE' 
        CHECK (estado_pago IN ('PENDIENTE','PARCIAL','PAGADO','ANULADO')),
        
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- =========================================
-- 5. DETALLE DE PEDIDO (HISTÓRICO)
-- =========================================
CREATE TABLE detalles_pedido (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL,
    
    -- SNAPSHOTS DEL PRODUCTO (Por si cambian en el futuro)
    codigo_sku VARCHAR(50),
    nombre_producto VARCHAR(200),
    unidad_medida VARCHAR(20),
    
    cantidad DECIMAL(12,2) NOT NULL CHECK (cantidad > 0),
    
    -- PRECIOS CONGELADOS AL MOMENTO DE LA COMPRA
    precio_lista DECIMAL(10,2),       -- Era 'precio_original_snapshot' en el carrito
    precio_final DECIMAL(10,2),       -- Era 'precio_unitario_ref' en el carrito
    
    -- DATOS DE PROMOCIÓN
    es_bonificacion BOOLEAN DEFAULT FALSE,
    motivo_descuento VARCHAR(100),    -- "Oferta Verano"
    campania_aplicada_id INT,         -- ID 5 (Para reportes)
    
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
    monto_aplicado DECIMAL(12,2) NOT NULL CHECK (monto_aplicado >= 0), -- Cuánto dinero se ahorró
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
-- 8. PAGOS EN EFECTIVO
-- =========================================
CREATE TABLE pagos_pedido (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    vendedor_id UUID NOT NULL,
    monto DECIMAL(12,2) NOT NULL CHECK (monto > 0),
    fecha_pago TIMESTAMPTZ DEFAULT NOW(),
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
-- =========================================
-- 9. PAGOs RESUMEN (OPTIMIZACIÓN)
-- =========================================
CREATE TABLE pagos_resumen (
    pedido_id UUID PRIMARY KEY REFERENCES pedidos(id) ON DELETE CASCADE,
    monto_pagado DECIMAL(14,2) NOT NULL DEFAULT 0,
    estado_pago VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE' CHECK (estado_pago IN ('PENDIENTE','PARCIAL','PAGADO','ANULADO')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================
-- 10. FUNCIÓN PARA ACTUALIZAR RESUMEN DE PAGOS (trigger automático)
-- =========================================
CREATE OR REPLACE FUNCTION fn_actualizar_resumen_pagos()
RETURNS TRIGGER AS $$
DECLARE
    sum_monto NUMERIC(14,2);
    pedido_total NUMERIC(12,2);
    nuevo_estado VARCHAR(20);
BEGIN
    -- Calcular suma de pagos válidos para este pedido
    SELECT COALESCE(SUM(monto), 0) INTO sum_monto
    FROM pagos_pedido
    WHERE pedido_id = NEW.pedido_id AND deleted_at IS NULL;

    -- Obtener total del pedido
    SELECT total_final INTO pedido_total FROM pedidos WHERE id = NEW.pedido_id;

    IF pedido_total IS NULL THEN
        -- Pedido eliminado o inexistente, borra resumen
        DELETE FROM pagos_resumen WHERE pedido_id = NEW.pedido_id;
        RETURN NEW;
    END IF;

    -- Determinar nuevo estado
    IF sum_monto >= pedido_total THEN
        nuevo_estado := 'PAGADO';
    ELSIF sum_monto > 0 THEN
        nuevo_estado := 'PARCIAL';
    ELSE
        nuevo_estado := 'PENDIENTE';
    END IF;

    -- Insertar o actualizar resumen
    INSERT INTO pagos_resumen (pedido_id, monto_pagado, estado_pago, updated_at)
    VALUES (NEW.pedido_id, sum_monto, nuevo_estado, NOW())
    ON CONFLICT (pedido_id) DO UPDATE SET
        monto_pagado = EXCLUDED.monto_pagado,
        estado_pago = EXCLUDED.estado_pago,
        updated_at = EXCLUDED.updated_at;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- 11. TRIGGER PARA ACTUALIZAR RESUMEN AL REGISTRAR PAGO
-- =========================================
CREATE TRIGGER trg_actualizar_resumen_pago
AFTER INSERT OR UPDATE OR DELETE ON pagos_pedido
FOR EACH ROW EXECUTE FUNCTION fn_actualizar_resumen_pagos();

-- =========================================
-- 12. AUDITORÍA
-- =========================================
CREATE TABLE audit_log_orders (
    id BIGSERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    operation VARCHAR(10) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changed_by UUID,
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET
);

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

-- Triggers de auditoría
CREATE TRIGGER trg_audit_pedidos AFTER INSERT OR UPDATE OR DELETE ON pedidos FOR EACH ROW EXECUTE FUNCTION fn_audit_orders();
CREATE TRIGGER trg_audit_detalles AFTER INSERT OR UPDATE OR DELETE ON detalles_pedido FOR EACH ROW EXECUTE FUNCTION fn_audit_orders();
CREATE TRIGGER trg_audit_promociones AFTER INSERT OR UPDATE OR DELETE ON promociones_aplicadas FOR EACH ROW EXECUTE FUNCTION fn_audit_orders();
CREATE TRIGGER trg_audit_pagospedido AFTER INSERT OR UPDATE OR DELETE ON pagos_pedido FOR EACH ROW EXECUTE FUNCTION fn_audit_orders();

-- =========================================
-- 13. TRIGGER UPDATED_AT AUTOMÁTICO
-- =========================================
CREATE OR REPLACE FUNCTION fn_update_timestamp_orders()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_updated_pedidos BEFORE UPDATE ON pedidos FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp_orders();
CREATE TRIGGER tr_updated_detalles BEFORE UPDATE ON detalles_pedido FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp_orders();
CREATE TRIGGER tr_updated_promociones BEFORE UPDATE ON promociones_aplicadas FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp_orders();
CREATE TRIGGER tr_updated_carritos BEFORE UPDATE ON carritos_cabecera FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp_orders();
CREATE TRIGGER tr_updated_pagospedido BEFORE UPDATE ON pagos_pedido FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp_orders();

-- =========================================
-- 14. SOFT DELETE AUTOMÁTICO
-- =========================================
CREATE OR REPLACE FUNCTION fn_soft_delete_orders()
RETURNS TRIGGER AS $$
BEGIN
    NEW.deleted_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_soft_delete_pedidos BEFORE DELETE ON pedidos FOR EACH ROW EXECUTE FUNCTION fn_soft_delete_orders();
CREATE TRIGGER trg_soft_delete_carritos BEFORE DELETE ON carritos_cabecera FOR EACH ROW EXECUTE FUNCTION fn_soft_delete_orders();
CREATE TRIGGER trg_soft_delete_pagospedido BEFORE DELETE ON pagos_pedido FOR EACH ROW EXECUTE FUNCTION fn_soft_delete_orders();

-- =========================================
-- 15. ÍNDICES OPTIMIZADOS
-- =========================================
CREATE INDEX idx_pedidos_vendedor ON pedidos(vendedor_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_pedidos_cliente ON pedidos(cliente_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_pedidos_estado ON pedidos(estado_actual) WHERE deleted_at IS NULL;
CREATE INDEX idx_pedidos_estado_pago ON pedidos(estado_pago) WHERE deleted_at IS NULL;
CREATE INDEX idx_pedidos_gps ON pedidos USING GIST(ubicacion_pedido);
CREATE INDEX idx_promociones_pedido ON promociones_aplicadas(pedido_id);
CREATE INDEX idx_pagospedido_pedido ON pagos_pedido(pedido_id);
CREATE INDEX idx_audit_orders ON audit_log_orders(table_name, record_id, changed_at DESC);

-- =========================================
-- 16. EVENTOS ASÍNCRONOS (pg_notify → Cloud Functions)
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
FOR EACH ROW WHEN (OLD.estado_actual IS DISTINCT FROM NEW.estado_actual)
EXECUTE FUNCTION notify_pedido_aprobado();

-- Pedido entregado
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
FOR EACH ROW WHEN (OLD.estado_actual IS DISTINCT FROM NEW.estado_actual)
EXECUTE FUNCTION notify_pedido_entregado();

-- Pago registrado (nuevo evento para notificar supervisor o cliente)
CREATE OR REPLACE FUNCTION notify_pago_registrado()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify('pago-registrado', NEW.id::text);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notify_pago_registrado
AFTER INSERT ON pagos_pedido
FOR EACH ROW EXECUTE FUNCTION notify_pago_registrado();

-- =========================================
-- FIN DEL MICROSERVICIO ORDERS - 100% COMPLETO
-- =========================================
    -- ==================================================================================
    -- MICROSERVICIO: WAREHOUSE SERVICE (svc-warehouse) - VERSIÓN FINAL 100% COMPLETA
    -- BASE DE DATOS: warehouse_db
    -- MOTOR: PostgreSQL 14+
    -- ==================================================================================


    \c warehouse_db;
    -- =========================================
    -- 1. EXTENSIONES
    -- =========================================
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- =========================================
    -- 2. ALMACENES
    -- =========================================
    CREATE TABLE almacenes (
        id SERIAL PRIMARY KEY,
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
        producto_id UUID NOT NULL,              -- referencia lógica a catalog_db.productos
        lote_id UUID,
        ubicacion_origen UUID,
        ubicacion_destino UUID,
        cantidad DECIMAL(12,2) NOT NULL,
        saldo_resultante DECIMAL(12,2),
        usuario_responsable_id UUID,            -- referencia lógica a auth_db.usuarios
        costo_unitario DECIMAL(12,4),
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- =========================================
    -- 9. DEVOLUCIONES (con soft delete)
    -- =========================================
    CREATE TABLE devoluciones_recibidas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nota_credito_id UUID,
        pedido_origen_id UUID,                  -- referencia lógica a orders_db.pedidos
        picking_id UUID REFERENCES picking_ordenes(id),
        lote_id UUID REFERENCES lotes(id),
        cantidad_recibida DECIMAL(12,2) NOT NULL CHECK (cantidad_recibida > 0),
        estado_producto VARCHAR(20) DEFAULT 'BUENO',
        decision_inventario VARCHAR(20),
        observaciones TEXT,
        fecha_recepcion TIMESTAMPTZ DEFAULT NOW(),
        usuario_recibio UUID,                   -- referencia lógica a auth_db.usuarios
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        deleted_at TIMESTAMPTZ                  -- SOFT DELETE
    );

    -- =========================================
    -- 10. AUDITORÍA
    -- =========================================
    CREATE TABLE audit_log_warehouse (
        id BIGSERIAL PRIMARY KEY,
        table_name VARCHAR(100) NOT NULL,
        record_id TEXT,
        operation VARCHAR(10) NOT NULL,
        old_data JSONB,
        new_data JSONB,
        changed_by UUID,
        changed_at TIMESTAMPTZ DEFAULT NOW(),
        ip_address INET
    );

    -- =========================================
    -- 11. FUNCIÓN DE AUDITORÍA MEJORADA
    -- =========================================
    CREATE OR REPLACE FUNCTION fn_audit_warehouse()
    RETURNS TRIGGER AS $$
    DECLARE
        v_changed_by UUID := current_setting('app.current_user', true)::uuid;
        v_ip INET := inet_client_addr();
    BEGIN
        INSERT INTO audit_log_warehouse (
            table_name, record_id, operation, old_data, new_data, changed_by, ip_address
        )
        VALUES (
            TG_TABLE_NAME,
            COALESCE( (CASE WHEN NEW IS NOT NULL THEN NEW.id::text END), (CASE WHEN OLD IS NOT NULL THEN OLD.id::text END) ),
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
    -- 12. TRIGGERS DE AUDITORÍA
    -- =========================================
    CREATE TRIGGER trg_audit_stock
    AFTER INSERT OR UPDATE OR DELETE ON stock_ubicacion
    FOR EACH ROW EXECUTE FUNCTION fn_audit_warehouse();

    CREATE TRIGGER trg_audit_kardex
    AFTER INSERT OR UPDATE OR DELETE ON kardex_movimientos
    FOR EACH ROW EXECUTE FUNCTION fn_audit_warehouse();

    CREATE TRIGGER trg_audit_picking
    AFTER INSERT OR UPDATE OR DELETE ON picking_ordenes
    FOR EACH ROW EXECUTE FUNCTION fn_audit_warehouse();

    CREATE TRIGGER trg_audit_picking_items
    AFTER INSERT OR UPDATE OR DELETE ON picking_items
    FOR EACH ROW EXECUTE FUNCTION fn_audit_warehouse();

    CREATE TRIGGER trg_audit_devoluciones
    AFTER INSERT OR UPDATE OR DELETE ON devoluciones_recibidas
    FOR EACH ROW EXECUTE FUNCTION fn_audit_warehouse();

    -- =========================================
    -- 13. TRIGGER UPDATED_AT AUTOMÁTICO
    -- =========================================
    CREATE OR REPLACE FUNCTION fn_update_timestamp_warehouse()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER tr_updated_almacenes
    BEFORE UPDATE ON almacenes
    FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp_warehouse();

    CREATE TRIGGER tr_updated_ubicaciones
    BEFORE UPDATE ON ubicaciones
    FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp_warehouse();

    CREATE TRIGGER tr_updated_lotes
    BEFORE UPDATE ON lotes
    FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp_warehouse();

    CREATE TRIGGER tr_updated_stock
    BEFORE UPDATE ON stock_ubicacion
    FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp_warehouse();

    CREATE TRIGGER tr_updated_picking
    BEFORE UPDATE ON picking_ordenes
    FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp_warehouse();

    CREATE TRIGGER tr_updated_picking_items
    BEFORE UPDATE ON picking_items
    FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp_warehouse();

    CREATE TRIGGER tr_updated_devoluciones
    BEFORE UPDATE ON devoluciones_recibidas
    FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp_warehouse();

    -- =========================================
    -- 14. SOFT DELETE AUTOMÁTICO
    -- =========================================
    CREATE OR REPLACE FUNCTION fn_soft_delete_warehouse()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.deleted_at := NOW();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER trg_soft_delete_picking
    BEFORE DELETE ON picking_ordenes
    FOR EACH ROW EXECUTE FUNCTION fn_soft_delete_warehouse();

    CREATE TRIGGER trg_soft_delete_devoluciones
    BEFORE DELETE ON devoluciones_recibidas
    FOR EACH ROW EXECUTE FUNCTION fn_soft_delete_warehouse();

    -- =========================================
    -- 15. ÍNDICES OPTIMIZADOS
    -- =========================================
    CREATE INDEX idx_fefo_lotes ON lotes(producto_id, fecha_vencimiento ASC, estado_calidad);
    CREATE INDEX idx_stock_saldo ON stock_ubicacion(lote_id) WHERE cantidad_fisica > 0;
    CREATE INDEX idx_picking_bodeguero ON picking_ordenes(bodeguero_asignado_id, estado) WHERE deleted_at IS NULL;
    CREATE INDEX idx_kardex_producto ON kardex_movimientos(producto_id, fecha DESC);
    CREATE INDEX idx_devoluciones_nc ON devoluciones_recibidas(nota_credito_id);
    CREATE INDEX idx_audit_warehouse ON audit_log_warehouse(table_name, record_id, changed_at DESC);

    -- =========================================
    -- 16. MÓDULO: RESERVAS DE STOCK (CORREGIDO)
    -- =========================================

    -- NOTA: Como ya definiste 'cantidad_reservada' en la Sección 5 (CREATE TABLE stock_ubicacion),
    -- este DO block añade la columna solo si no existe.
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'stock_ubicacion' AND column_name = 'cantidad_reservada'
        ) THEN
            ALTER TABLE stock_ubicacion 
            ADD COLUMN cantidad_reservada DECIMAL(12,2) DEFAULT 0 CHECK (cantidad_reservada >= 0);
        END IF;
    END $$;

    -- Cabecera de reservas
    CREATE TABLE IF NOT EXISTS reservations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        temp_id VARCHAR(100),
        status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','CONFIRMED','CANCELLED','COMPLETED')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Items de reserva (CORREGIDO: quantity es DECIMAL(12,2) para soportar fracciones)
    CREATE TABLE IF NOT EXISTS reservation_items (
        id SERIAL PRIMARY KEY,
        reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
        product_id UUID NOT NULL,
        sku VARCHAR(50) NOT NULL,
        quantity DECIMAL(12,2) NOT NULL CHECK (quantity > 0),
        stock_ubicacion_id UUID NOT NULL REFERENCES stock_ubicacion(id),
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Índices para rendimiento sobre reservas
    CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
    CREATE INDEX IF NOT EXISTS idx_reservation_items_reservation ON reservation_items(reservation_id);
    CREATE INDEX IF NOT EXISTS idx_reservation_items_stock_loc ON reservation_items(stock_ubicacion_id);

    -- =========================================
    -- 17.b: COLUMNAS ADICIONALES EN picking_items
    -- Agregamos motivo de desviación y notas del bodeguero para auditoría y control
    -- Estas columnas se crean solo si no existen para permitir re-ejecución segura del script
    ALTER TABLE picking_items
        ADD COLUMN IF NOT EXISTS motivo_desviacion VARCHAR(50),
        ADD COLUMN IF NOT EXISTS notas_bodeguero TEXT;


    -- =========================================
    -- 17. EVENTOS ASÍNCRONOS (pg_notify → Cloud Functions)
    -- =========================================
    -- Picking creado → notificar bodeguero y sincronizar con orders
    CREATE OR REPLACE FUNCTION notify_picking_creado()
    RETURNS TRIGGER AS $$
    BEGIN
        PERFORM pg_notify('picking-creado', NEW.id::text);
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER trg_notify_picking_creado
    AFTER INSERT ON picking_ordenes
    FOR EACH ROW EXECUTE FUNCTION notify_picking_creado();

    -- Picking completado → actualizar estado en orders
    CREATE OR REPLACE FUNCTION notify_picking_completado()
    RETURNS TRIGGER AS $$
    BEGIN
        IF NEW.estado = 'COMPLETADO' AND (OLD.estado IS DISTINCT FROM 'COMPLETADO') THEN
            PERFORM pg_notify('picking-completado', NEW.id::text);
        END IF;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER trg_notify_picking_completado
    AFTER UPDATE ON picking_ordenes
    FOR EACH ROW EXECUTE FUNCTION notify_picking_completado();

    -- Devolución recibida → actualizar stock y notificar finance
    CREATE OR REPLACE FUNCTION notify_devolucion_recibida()
    RETURNS TRIGGER AS $$
    BEGIN
        PERFORM pg_notify('devolucion-recibida', NEW.id::text);
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER trg_notify_devolucion_recibida
    AFTER INSERT ON devoluciones_recibidas
    FOR EACH ROW EXECUTE FUNCTION notify_devolucion_recibida();

    -- Stock modificado → actualizar disponibilidad en orders
    CREATE OR REPLACE FUNCTION notify_stock_modificado()
    RETURNS TRIGGER AS $$
    BEGIN
        PERFORM pg_notify('stock-modificado', NEW.id::text);
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER trg_notify_stock_modificado
    AFTER INSERT OR UPDATE OR DELETE ON stock_ubicacion
    FOR EACH ROW EXECUTE FUNCTION notify_stock_modificado();

    -- =========================================
    -- FIN DEL MICROSERVICIO WAREHOUSE - 100% COMPLETO
    -- =========================================
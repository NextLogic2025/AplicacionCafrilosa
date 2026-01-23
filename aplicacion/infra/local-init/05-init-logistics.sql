-- ==================================================================================
-- MICROSERVICIO: LOGISTICS SERVICE (svc-logistics) - VERSIÓN ROBUSTA & RESILIENTE
-- BASE DE DATOS: logistics_db
-- MOTOR: PostgreSQL 14+
-- ==================================================================================

\c logistics_db 

-- 1.a LIMPIEZA INICIAL (Orden inverso de dependencias)
DROP TABLE IF EXISTS audit_log_logistics CASCADE;
DROP TABLE IF EXISTS novedades_ruta CASCADE;
DROP TABLE IF EXISTS vehiculo_movimientos CASCADE;
DROP TABLE IF EXISTS pruebas_entrega CASCADE;
DROP TABLE IF EXISTS entregas_despacho CASCADE;
DROP TABLE IF EXISTS despachos CASCADE;
DROP TABLE IF EXISTS conductores CASCADE;
DROP TABLE IF EXISTS vehiculos CASCADE;
DROP VIEW IF EXISTS reporte_efectividad_conductores;

-- =========================================
-- 1. EXTENSIONES
-- =========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- =========================================
-- 2. VEHÍCULOS
-- =========================================
CREATE TABLE vehiculos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    placa VARCHAR(10) UNIQUE NOT NULL,
    marca VARCHAR(50),
    modelo VARCHAR(50),
    anio INT,
    capacidad_kg NUMERIC(10,2),
    estado VARCHAR(20) DEFAULT 'DISPONIBLE', -- DISPONIBLE | EN_RUTA | MANTENIMIENTO
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ 
);

-- =========================================
-- 3. CONDUCTORES
-- =========================================
CREATE TABLE conductores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID UNIQUE,             -- Referencia lógica a auth_db.usuarios
    nombre_completo VARCHAR(150),       -- Agregado para reporte de efectividad
    licencia VARCHAR(20), 
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- =========================================
-- 4. DESPACHOS (CABECERA - EL VIAJE)
-- =========================================
CREATE TABLE despachos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_manifiesto SERIAL,            -- Es SERIAL (INT), la auditoría lo manejará como TEXT
    vehiculo_id UUID REFERENCES vehiculos(id),
    conductor_id UUID REFERENCES conductores(id),
    
    estado_viaje VARCHAR(30) DEFAULT 'PLANIFICACION', -- PLANIFICACION | CARGANDO | EN_RUTA | COMPLETADO | CANCELADO
    
    peso_total_kg NUMERIC(10,2) DEFAULT 0,
    fecha_programada DATE,
    hora_inicio_real TIMESTAMPTZ,
    hora_fin_real TIMESTAMPTZ,
    
    observaciones_ruta TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX ux_vehiculo_viaje_activo
ON despachos(vehiculo_id)
WHERE estado_viaje IN ('CARGANDO', 'EN_RUTA') AND deleted_at IS NULL;

-- =========================================
-- 5. ENTREGAS DEL DESPACHO (DETALLE)
-- =========================================
CREATE TABLE entregas_despacho (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    despacho_id UUID NOT NULL REFERENCES despachos(id) ON DELETE CASCADE,
    
    pedido_id UUID NOT NULL,            -- Referencia a orders_db.pedidos
    cliente_id UUID,                    -- AGREGADO: Necesario para índices y filtros
    
    orden_visita INT NOT NULL,
    
    -- ESTADOS Y DATOS
    estado_entrega VARCHAR(20) DEFAULT 'PENDIENTE', -- AGREGADO: PENDIENTE | ENTREGADO | RECHAZADO
    direccion_texto TEXT,
    coordenadas_entrega GEOMETRY(POINT, 4326),      -- AGREGADO: Necesario para PostGIS
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(despacho_id, pedido_id)
);

-- =========================================
-- 6. PRUEBAS DE ENTREGA (POD)
-- =========================================
CREATE TABLE pruebas_entrega (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entrega_id UUID NOT NULL UNIQUE REFERENCES entregas_despacho(id) ON DELETE CASCADE,
    
    nombre_receptor VARCHAR(150),
    documento_receptor VARCHAR(20),
    firma_url TEXT,
    foto_evidencia_url TEXT,
    
    ubicacion_confirmacion GEOMETRY(POINT, 4326),
    
    fecha_confirmacion TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- 7. VEHÍCULO MOVIMIENTOS (TRACKING)
-- =========================================
CREATE TABLE vehiculo_movimientos (
    id BIGSERIAL PRIMARY KEY,
    despacho_id UUID NOT NULL REFERENCES despachos(id) ON DELETE CASCADE,
    vehiculo_id UUID NOT NULL REFERENCES vehiculos(id),
    ubicacion GEOGRAPHY(POINT, 4326) NOT NULL,
    velocidad_kmh NUMERIC(6,2),
    bateria_nivel INT,
    fecha_registro TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- 8. NOVEDADES / INCIDENCIAS
-- =========================================
CREATE TABLE novedades_ruta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    despacho_id UUID REFERENCES despachos(id) ON DELETE CASCADE, 
    entrega_id UUID REFERENCES entregas_despacho(id),            
    
    motivo VARCHAR(50),
    descripcion TEXT,
    foto_url TEXT,
    reportado_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- 9. AUDITORÍA ROBUSTA
-- =========================================
CREATE TABLE audit_log_logistics (
    id BIGSERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id TEXT DEFAULT 'UNKNOWN', -- Soporta UUID y SERIAL
    operation VARCHAR(10) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changed_by UUID,
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET
);

-- ==================================================================================
-- 10. FUNCIONES "DEFENSIVAS" & LÓGICA DE NEGOCIO
-- ==================================================================================

-- 10.1 Auditoría Resiliente (JSONB)
CREATE OR REPLACE FUNCTION fn_audit_logistics()
RETURNS TRIGGER AS $$
DECLARE
    v_changed_by UUID;
    v_ip INET := inet_client_addr();
    v_record_id TEXT;
    v_new_json JSONB;
    v_old_json JSONB;
BEGIN
    BEGIN
        v_changed_by := current_setting('app.current_user', true)::uuid;
    EXCEPTION WHEN OTHERS THEN
        v_changed_by := NULL;
    END;

    v_new_json := to_jsonb(NEW);
    v_old_json := to_jsonb(OLD);

    -- Extracción segura de ID (Cubre Despachos-Serial y UUIDs)
    v_record_id := COALESCE(v_new_json->>'id', v_old_json->>'id', 'NO_PK');

    INSERT INTO audit_log_logistics (
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

-- 10.2 Notificación Unificada
CREATE OR REPLACE FUNCTION notify_logistics_cambio()
RETURNS TRIGGER AS $$
DECLARE
    payload JSON;
    v_record_id TEXT;
    v_data JSONB;
BEGIN
    v_data := to_jsonb(COALESCE(NEW, OLD));
    v_record_id := COALESCE(v_data->>'id', 'GENERIC');

    payload := json_build_object(
        'table', TG_TABLE_NAME,
        'action', TG_OP,
        'id', v_record_id,
        'data', v_data
    );

    PERFORM pg_notify('logistics-cambio', payload::text);
    
    IF (TG_OP = 'DELETE') THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql;

-- 10.3 Lógica de Negocio: Auto-Completar Viaje
CREATE OR REPLACE FUNCTION fn_check_fin_despacho()
RETURNS TRIGGER AS $$
DECLARE
    v_total INT;
    v_completados INT;
BEGIN
    -- Defensivo: Si se borra la columna estado_entrega, esto fallaría. 
    -- Se asume que columnas CORE de lógica de negocio se mantienen.
    
    SELECT COUNT(*) INTO v_total FROM entregas_despacho WHERE despacho_id = NEW.despacho_id;
    
    SELECT COUNT(*) INTO v_completados FROM entregas_despacho 
    WHERE despacho_id = NEW.despacho_id AND estado_entrega IN ('ENTREGADO', 'RECHAZADO', 'REPROGRAMADO');
    
    IF v_total > 0 AND v_total = v_completados THEN
        UPDATE despachos SET estado_viaje = 'COMPLETADO', hora_fin_real = NOW() 
        WHERE id = NEW.despacho_id AND estado_viaje = 'EN_RUTA';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10.4 Lógica de Negocio: Actualizar estado al recibir POD
CREATE OR REPLACE FUNCTION fn_update_estado_entrega_pod()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualiza la entrega a ENTREGADO cuando se inserta una prueba
    UPDATE entregas_despacho 
    SET estado_entrega = 'ENTREGADO', updated_at = NOW() 
    WHERE id = NEW.entrega_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10.5 Timestamps
CREATE OR REPLACE FUNCTION fn_update_timestamp_logistics()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10.6 Soft Delete
CREATE OR REPLACE FUNCTION fn_soft_delete_logistics()
RETURNS TRIGGER AS $$
BEGIN
    NEW.deleted_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- 11. APLICACIÓN DE TRIGGERS
-- =========================================

-- Auditoría
CREATE TRIGGER trg_audit_despachos AFTER INSERT OR UPDATE OR DELETE ON despachos FOR EACH ROW EXECUTE FUNCTION fn_audit_logistics();
CREATE TRIGGER trg_audit_entregas AFTER INSERT OR UPDATE OR DELETE ON entregas_despacho FOR EACH ROW EXECUTE FUNCTION fn_audit_logistics();
CREATE TRIGGER trg_audit_pod AFTER INSERT OR UPDATE OR DELETE ON pruebas_entrega FOR EACH ROW EXECUTE FUNCTION fn_audit_logistics();
CREATE TRIGGER trg_audit_vehiculos AFTER INSERT OR UPDATE OR DELETE ON vehiculos FOR EACH ROW EXECUTE FUNCTION fn_audit_logistics();
CREATE TRIGGER trg_audit_conductores AFTER INSERT OR UPDATE OR DELETE ON conductores FOR EACH ROW EXECUTE FUNCTION fn_audit_logistics();

-- Notificaciones
CREATE TRIGGER trg_notify_despachos AFTER INSERT OR UPDATE OR DELETE ON despachos FOR EACH ROW EXECUTE FUNCTION notify_logistics_cambio();
CREATE TRIGGER trg_notify_entregas AFTER INSERT OR UPDATE OR DELETE ON entregas_despacho FOR EACH ROW EXECUTE FUNCTION notify_logistics_cambio();
CREATE TRIGGER trg_notify_novedades AFTER INSERT OR UPDATE OR DELETE ON novedades_ruta FOR EACH ROW EXECUTE FUNCTION notify_logistics_cambio();

-- Lógica de Negocio
CREATE TRIGGER trg_auto_completar_viaje AFTER UPDATE ON entregas_despacho FOR EACH ROW EXECUTE FUNCTION fn_check_fin_despacho();
CREATE TRIGGER trg_pod_update_estado AFTER INSERT ON pruebas_entrega FOR EACH ROW EXECUTE FUNCTION fn_update_estado_entrega_pod();

-- Timestamps
CREATE TRIGGER tr_upd_vehiculos BEFORE UPDATE ON vehiculos FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp_logistics();
CREATE TRIGGER tr_upd_conductores BEFORE UPDATE ON conductores FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp_logistics();
CREATE TRIGGER tr_upd_despachos BEFORE UPDATE ON despachos FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp_logistics();
CREATE TRIGGER tr_upd_entregas BEFORE UPDATE ON entregas_despacho FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp_logistics();

-- Soft Delete
CREATE TRIGGER trg_soft_delete_vehiculos BEFORE DELETE ON vehiculos FOR EACH ROW EXECUTE FUNCTION fn_soft_delete_logistics();
CREATE TRIGGER trg_soft_delete_conductores BEFORE DELETE ON conductores FOR EACH ROW EXECUTE FUNCTION fn_soft_delete_logistics();
CREATE TRIGGER trg_soft_delete_despachos BEFORE DELETE ON despachos FOR EACH ROW EXECUTE FUNCTION fn_soft_delete_logistics();

-- =========================================
-- 12. ÍNDICES OPTIMIZADOS
-- =========================================
CREATE INDEX idx_entregas_pedido ON entregas_despacho(pedido_id);
CREATE INDEX idx_entregas_despacho_id ON entregas_despacho(despacho_id);
CREATE INDEX idx_entregas_geo ON entregas_despacho USING GIST(coordenadas_entrega);
CREATE INDEX idx_entregas_cliente ON entregas_despacho(cliente_id);
CREATE INDEX idx_entregas_estado ON entregas_despacho(estado_entrega);

CREATE INDEX idx_despachos_estado ON despachos(estado_viaje) WHERE deleted_at IS NULL;
CREATE INDEX idx_movimientos_geo ON vehiculo_movimientos USING GIST(ubicacion);
CREATE INDEX idx_movimientos_despacho ON vehiculo_movimientos(despacho_id, fecha_registro DESC);

CREATE INDEX idx_audit_logistics ON audit_log_logistics(table_name, record_id, changed_at DESC);

-- =========================================
-- 13. VISTA DE REPORTE
-- =========================================
CREATE OR REPLACE VIEW reporte_efectividad_conductores AS
SELECT 
    c.nombre_completo AS conductor,
    v.placa AS vehiculo,
    e.estado_entrega,
    COUNT(*) as total_paquetes
FROM entregas_despacho e
JOIN despachos d ON e.despacho_id = d.id
JOIN conductores c ON d.conductor_id = c.id
JOIN vehiculos v ON d.vehiculo_id = v.id
GROUP BY c.nombre_completo, v.placa, e.estado_entrega;
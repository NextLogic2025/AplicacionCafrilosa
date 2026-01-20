-- ==================================================================================
-- MICROSERVICIO: LOGISTICS SERVICE (svc-logistics) - VERSIÓN MULTI-PEDIDO
-- BASE DE DATOS: logistics_db
-- MOTOR: PostgreSQL 14+
-- ==================================================================================

\c logistics_db;

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
-- 3. CONDUCTORES (CORREGIDO: Con Auth Link)
-- =========================================
CREATE TABLE conductores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID UNIQUE,             -- Referencia lógica a auth_db.usuarios (LOGIN APP)
    nombre_completo VARCHAR(150) NOT NULL,
    cedula VARCHAR(15) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    licencia VARCHAR(20),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- =========================================
-- 4. DESPACHOS (CABECERA - EL VIAJE)
-- =========================================
-- Esta tabla agrupa el viaje completo. Un camión sale de bodega una vez.
CREATE TABLE despachos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_manifiesto SERIAL,            -- Número legible (ej. Despacho #1054)
    vehiculo_id UUID REFERENCES vehiculos(id),
    conductor_id UUID REFERENCES conductores(id),
    
    estado_viaje VARCHAR(30) DEFAULT 'PLANIFICACION', -- PLANIFICACION | CARGANDO | EN_RUTA | COMPLETADO | CANCELADO
    
    peso_total_kg NUMERIC(10,2) DEFAULT 0,
    fecha_programada DATE,
    hora_inicio_real TIMESTAMPTZ,        -- Cuando el camión sale de bodega
    hora_fin_real TIMESTAMPTZ,           -- Cuando el camión regresa o termina
    
    observaciones_ruta TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Regla: Un vehículo solo puede tener UN viaje activo (En Ruta o Cargando)
CREATE UNIQUE INDEX ux_vehiculo_viaje_activo
ON despachos(vehiculo_id)
WHERE estado_viaje IN ('CARGANDO', 'EN_RUTA') AND deleted_at IS NULL;

-- =========================================
-- 5. ENTREGAS DEL DESPACHO (DETALLE - LOS PEDIDOS)
-- =========================================
-- Aquí vinculamos N pedidos a 1 despacho.
CREATE TABLE entregas_despacho (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    despacho_id UUID NOT NULL REFERENCES despachos(id) ON DELETE CASCADE,
    
    pedido_id UUID NOT NULL,            -- Referencia lógica a orders_db.pedidos
    cliente_id UUID NOT NULL,           -- Referencia lógica a catalog_db.clientes
    sucursal_id UUID,                   -- Referencia lógica a catalog_db.sucursales
    
    -- SECUENCIA DE RUTA (OPTIMIZACIÓN)
    orden_visita INT NOT NULL,          -- 1 = Primera parada, 2 = Segunda, etc.
    
    -- SNAPSHOT DE DIRECCIÓN (Congelado al momento de planificar)
    direccion_texto TEXT,
    coordenadas_entrega GEOGRAPHY(POINT, 4326),
    contacto_nombre VARCHAR(100),
    contacto_telefono VARCHAR(20),
    
    -- ESTADO INDIVIDUAL DEL PEDIDO
    estado_entrega VARCHAR(20) DEFAULT 'PENDIENTE', -- PENDIENTE | ENTREGADO | RECHAZADO | REPROGRAMADO
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(despacho_id, pedido_id) -- Un pedido no puede estar duplicado en el mismo viaje
);

CREATE INDEX idx_entregas_pedido ON entregas_despacho(pedido_id);
CREATE INDEX idx_entregas_geo ON entregas_despacho USING GIST(coordenadas_entrega);

-- =========================================
-- 6. PRUEBAS DE ENTREGA (POD) - POR PEDIDO
-- =========================================
-- La prueba de entrega se vincula a la LÍNEA (entregas_despacho), no al viaje general.
CREATE TABLE pruebas_entrega (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entrega_id UUID NOT NULL UNIQUE REFERENCES entregas_despacho(id) ON DELETE CASCADE,
    
    nombre_receptor VARCHAR(150),
    documento_receptor VARCHAR(20),
    firma_url TEXT,
    foto_evidencia_url TEXT,
    
    latitud_confirmacion NUMERIC(10,8), -- GPS donde se firmó (para validar vs coordenadas_entrega)
    longitud_confirmacion NUMERIC(10,8),
    
    fecha_confirmacion TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- 7. VEHÍCULO MOVIMIENTOS (TRACKING GPS)
-- =========================================
-- Esto rastrea al camión (Despacho Padre)
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
    despacho_id UUID REFERENCES despachos(id) ON DELETE CASCADE, -- Novedad del viaje (ej. llanta baja)
    entrega_id UUID REFERENCES entregas_despacho(id),            -- Novedad de un pedido (ej. cliente cerrado)
    
    motivo VARCHAR(50),
    descripcion TEXT,
    foto_url TEXT,
    reportado_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- 9. AUDITORÍA (Estándar)
-- =========================================
CREATE TABLE audit_log_logistics (
    id BIGSERIAL PRIMARY KEY,
    table_name VARCHAR(100),
    record_id TEXT,
    operation VARCHAR(10),
    old_data JSONB,
    new_data JSONB,
    changed_by UUID,
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION fn_audit_logistics()
RETURNS TRIGGER AS $$
DECLARE
    v_changed_by UUID := NULL; -- Simulado, obtener de config si existe
BEGIN
    INSERT INTO audit_log_logistics (table_name, record_id, operation, old_data, new_data, changed_by)
    VALUES (TG_TABLE_NAME, COALESCE(NEW.id::text, OLD.id::text), TG_OP, 
            CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) END, 
            CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) END, v_changed_by);
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_despachos AFTER INSERT OR UPDATE OR DELETE ON despachos FOR EACH ROW EXECUTE FUNCTION fn_audit_logistics();
CREATE TRIGGER trg_audit_entregas AFTER INSERT OR UPDATE OR DELETE ON entregas_despacho FOR EACH ROW EXECUTE FUNCTION fn_audit_logistics();
CREATE TRIGGER trg_audit_pod AFTER INSERT OR UPDATE OR DELETE ON pruebas_entrega FOR EACH ROW EXECUTE FUNCTION fn_audit_logistics();

-- =========================================
-- 10. AUTOMATIZACIÓN DE ESTADOS (Trigger Inteligente)
-- =========================================
-- Si todas las entregas de un despacho están finalizadas, completamos el viaje automáticamente.
CREATE OR REPLACE FUNCTION fn_check_fin_despacho()
RETURNS TRIGGER AS $$
DECLARE
    v_total INT;
    v_completados INT;
BEGIN
    -- Contar total de entregas en este despacho
    SELECT COUNT(*) INTO v_total FROM entregas_despacho WHERE despacho_id = NEW.despacho_id;
    
    -- Contar cuántas ya no están PENDIENTE
    SELECT COUNT(*) INTO v_completados FROM entregas_despacho 
    WHERE despacho_id = NEW.despacho_id AND estado_entrega IN ('ENTREGADO', 'RECHAZADO', 'REPROGRAMADO');
    
    -- Si coinciden, cerrar el viaje
    IF v_total > 0 AND v_total = v_completados THEN
        UPDATE despachos SET estado_viaje = 'COMPLETADO', hora_fin_real = NOW() 
        WHERE id = NEW.despacho_id AND estado_viaje = 'EN_RUTA';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_completar_viaje
AFTER UPDATE ON entregas_despacho
FOR EACH ROW EXECUTE FUNCTION fn_check_fin_despacho();

-- =========================================
-- 11. EVENTOS ASÍNCRONOS (NOTIFICACIONES)
-- =========================================

-- A. NOTIFICAR AL CLIENTE CUANDO EL CAMIÓN SALE (Despacho EN_RUTA)
CREATE OR REPLACE FUNCTION notify_inicio_ruta()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.estado_viaje = 'EN_RUTA' AND OLD.estado_viaje <> 'EN_RUTA' THEN
        PERFORM pg_notify('viaje-iniciado', NEW.id::text);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notify_inicio_ruta AFTER UPDATE ON despachos FOR EACH ROW EXECUTE FUNCTION notify_inicio_ruta();

-- B. NOTIFICAR ENTREGA INDIVIDUAL CONFIRMADA (Actualizar Pedido en Orders)
CREATE OR REPLACE FUNCTION notify_entrega_realizada()
RETURNS TRIGGER AS $$
DECLARE
    v_pedido_id UUID;
BEGIN
    -- Obtenemos el ID del pedido original
    SELECT pedido_id INTO v_pedido_id FROM entregas_despacho WHERE id = NEW.entrega_id;
    
    -- Enviamos notificación con el ID del PEDIDO para que orders_db se actualice
    PERFORM pg_notify('entrega-confirmada', v_pedido_id::text);
    
    -- Actualizamos estado local en entregas_despacho a ENTREGADO
    UPDATE entregas_despacho SET estado_entrega = 'ENTREGADO', updated_at = NOW() 
    WHERE id = NEW.entrega_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notify_pod_ok AFTER INSERT ON pruebas_entrega FOR EACH ROW EXECUTE FUNCTION notify_entrega_realizada();

-- =========================================
-- FIN DEL MICROSERVICIO LOGISTICS (MULTI-PEDIDO)
-- =========================================

-- =========================================
-- 12. ÍNDICES OPTIMIZADOS (PERFORMANCE PACK)
-- =========================================

-- ---------------------------------------------------------
-- A. ÍNDICES PARA DESPACHOS (La Cabecera del Viaje)
-- ---------------------------------------------------------
-- Buscar viajes activos rápidamente (para el dashboard de tráfico)
CREATE INDEX idx_despachos_estado 
ON despachos(estado_viaje) 
WHERE deleted_at IS NULL;

-- Buscar historial por fechas (reportes mensuales)
CREATE INDEX idx_despachos_fecha_prog 
ON despachos(fecha_programada DESC);

-- Buscar historial por conductor y vehículo (FKs)
CREATE INDEX idx_despachos_conductor 
ON despachos(conductor_id) WHERE deleted_at IS NULL;

CREATE INDEX idx_despachos_vehiculo 
ON despachos(vehiculo_id) WHERE deleted_at IS NULL;


-- ---------------------------------------------------------
-- B. ÍNDICES PARA ENTREGAS (El Detalle de Pedidos)
-- ---------------------------------------------------------
-- CRÍTICO: Para unir rápidamente el viaje con sus pedidos (JOIN)
CREATE INDEX idx_entregas_despacho_id 
ON entregas_despacho(despacho_id);

-- Buscar por estado del pedido individual (¿Cuántos rechazados hubo hoy?)
CREATE INDEX idx_entregas_estado 
ON entregas_despacho(estado_entrega);

-- Historial por Cliente (¿Qué tan cumplidos somos con el Cliente X?)
CREATE INDEX idx_entregas_cliente 
ON entregas_despacho(cliente_id);

-- Optimización Geoespacial: Buscar entregas cercanas a un punto (PostGIS)
-- (Ya tenías uno similar, aseguramos que sea GIST)
CREATE INDEX IF NOT EXISTS idx_entregas_geo_location 
ON entregas_despacho USING GIST(coordenadas_entrega);


-- ---------------------------------------------------------
-- C. ÍNDICES PARA TRACKING (GPS en tiempo real)
-- ---------------------------------------------------------
-- Consultar la ruta histórica de un viaje específico (ordenado por tiempo)
CREATE INDEX idx_movimientos_despacho_tiempo 
ON vehiculo_movimientos(despacho_id, fecha_registro DESC);

-- Última ubicación conocida (para mapas en vivo)
CREATE INDEX idx_movimientos_vehiculo_tiempo 
ON vehiculo_movimientos(vehiculo_id, fecha_registro DESC);

-- Búsquedas espaciales sobre el rastro (ej: ¿Pasó algún camión por esta zona?)
CREATE INDEX idx_movimientos_geo 
ON vehiculo_movimientos USING GIST(ubicacion);


-- ---------------------------------------------------------
-- D. ÍNDICES PARA NOVEDADES Y AUDITORÍA
-- ---------------------------------------------------------
-- Ver novedades de un viaje específico
CREATE INDEX idx_novedades_despacho 
ON novedades_ruta(despacho_id);

-- Auditoría: Ver cambios recientes primero
CREATE INDEX idx_audit_logistics_time 
ON audit_log_logistics(changed_at DESC);

-- Auditoría: Buscar cambios sobre un registro específico (ej. ¿Quién modificó el despacho X?)
CREATE INDEX idx_audit_logistics_record 
ON audit_log_logistics(table_name, record_id);
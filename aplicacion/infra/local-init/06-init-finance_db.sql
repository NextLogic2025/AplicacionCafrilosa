-- ==================================================================================
-- MICROSERVICIO: finance_db SERVICE (svc-finance) - VERSIÓN MULTI-PEDIDO
-- BASE DE DATOS: finance_db
-- MOTOR: PostgreSQL 14+
-- ==================================================================================
\c finance_db;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- Para geolocalizar cobros

-- =========================================================
-- 1. FACTURACIÓN ELECTRÓNICA
-- =========================================================
CREATE TABLE puntos_emision (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_establecimiento VARCHAR(10) NOT NULL, -- Ej: 001
    codigo_punto_emision VARCHAR(10) NOT NULL,   -- Ej: 002
    secuencia_actual BIGINT DEFAULT 1,
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE facturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID NOT NULL,          -- Ref orders_db
    cliente_id UUID NOT NULL,         -- Ref catalog_db
    vendedor_id UUID,                 
    
    -- Datos Legales
    ruc_cliente VARCHAR(20) NOT NULL,
    razon_social_cliente VARCHAR(200) NOT NULL,
    fecha_emision TIMESTAMPTZ DEFAULT NOW(),
    
    -- Numeración
    punto_emision_id UUID REFERENCES puntos_emision(id),
    numero_completo VARCHAR(50) UNIQUE, -- 001-002-000000123
    clave_acceso_sri VARCHAR(49),
    
    -- Totales
    subtotal DECIMAL(12,2) NOT NULL,
    impuestos DECIMAL(12,2) NOT NULL,
    total_final DECIMAL(12,2) NOT NULL,
    
    -- Estado
    estado_sri VARCHAR(20) DEFAULT 'PENDIENTE', 
    url_xml TEXT,
    url_pdf TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE detalles_factura (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    factura_id UUID REFERENCES facturas(id),
    producto_id UUID,
    descripcion VARCHAR(300),
    cantidad DECIMAL(12,2),
    precio_unitario DECIMAL(12,2),
    total_linea DECIMAL(12,2)
);

-- =========================================================
-- 2. CARTERA (CUENTAS POR COBRAR)
-- =========================================================
CREATE TABLE cuentas_por_cobrar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL,
    factura_id UUID REFERENCES facturas(id),
    
    numero_cuota INT DEFAULT 1,
    fecha_vencimiento DATE NOT NULL,
    
    monto_original DECIMAL(12,2) NOT NULL,
    monto_pagado DECIMAL(12,2) DEFAULT 0,
    saldo_pendiente DECIMAL(12,2) GENERATED ALWAYS AS (monto_original - monto_pagado) STORED,
    
    estado VARCHAR(20) DEFAULT 'PENDIENTE', -- PENDIENTE, PARCIAL, PAGADO
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================
-- 3. COBRANZA MÓVIL (APP VENDEDOR)
-- =========================================================
-- Control de caja chica del vendedor
CREATE TABLE saldo_vendedor_caja (
    vendedor_usuario_id UUID PRIMARY KEY, 
    saldo_efectivo_mano DECIMAL(12,2) DEFAULT 0,
    saldo_cheques_mano DECIMAL(12,2) DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recibos generados en la calle
CREATE TABLE recibos_cobro (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL,
    vendedor_id UUID NOT NULL,
    codigo_recibo VARCHAR(50),
    fecha_cobro TIMESTAMPTZ DEFAULT NOW(),
    
    monto_total DECIMAL(12,2) NOT NULL,
    forma_pago VARCHAR(20) DEFAULT 'EFECTIVO', 
    
    foto_comprobante_url TEXT,
    ubicacion_gps GEOMETRY(POINT, 4326),
    estado_liquidacion VARCHAR(20) DEFAULT 'EN_MANO_VENDEDOR', 
    
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Imputación (Cruce de cuentas)
CREATE TABLE imputaciones_pago (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recibo_id UUID REFERENCES recibos_cobro(id),
    cuota_id UUID REFERENCES cuentas_por_cobrar(id),
    monto_aplicado DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================
-- 4. TRIGGERS DE SINCRONIZACIÓN
-- =========================================================
-- Actualizar estado de cuota al pagar
CREATE OR REPLACE FUNCTION fn_actualizar_deuda_finance()
RETURNS TRIGGER AS $$
DECLARE
    v_pagado DECIMAL(12,2);
    v_original DECIMAL(12,2);
BEGIN
    SELECT COALESCE(SUM(monto_aplicado), 0) INTO v_pagado FROM imputaciones_pago WHERE cuota_id = NEW.cuota_id;
    SELECT monto_original INTO v_original FROM cuentas_por_cobrar WHERE id = NEW.cuota_id;

    UPDATE cuentas_por_cobrar
    SET monto_pagado = v_pagado,
        estado = CASE WHEN v_pagado >= v_original THEN 'PAGADO' ELSE 'PARCIAL' END,
        updated_at = NOW()
    WHERE id = NEW.cuota_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_imputacion_update_deuda AFTER INSERT ON imputaciones_pago FOR EACH ROW EXECUTE FUNCTION fn_actualizar_deuda_finance();

-- Notificar cambio de saldo a Catalog
CREATE OR REPLACE FUNCTION notify_saldo_cliente()
RETURNS TRIGGER AS $$
DECLARE
    v_cliente_id UUID;
    v_nuevo_saldo DECIMAL(12,2);
BEGIN
    IF TG_TABLE_NAME = 'cuentas_por_cobrar' THEN v_cliente_id := NEW.cliente_id;
    ELSE SELECT cliente_id INTO v_cliente_id FROM recibos_cobro WHERE id = NEW.recibo_id;
    END IF;

    SELECT COALESCE(SUM(saldo_pendiente), 0) INTO v_nuevo_saldo
    FROM cuentas_por_cobrar WHERE cliente_id = v_cliente_id AND estado != 'ANULADO';

    PERFORM pg_notify('saldo_update', json_build_object('cliente_id', v_cliente_id, 'saldo', v_nuevo_saldo)::text);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notify_saldo_cxc AFTER INSERT OR UPDATE ON cuentas_por_cobrar FOR EACH ROW EXECUTE FUNCTION notify_saldo_cliente();
CREATE TRIGGER trg_notify_saldo_pago AFTER INSERT ON imputaciones_pago FOR EACH ROW EXECUTE FUNCTION notify_saldo_cliente();
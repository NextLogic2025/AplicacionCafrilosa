-- ==================================================================================
-- MICROSERVICIO: finance_db (PostgreSQL 17)
-- DOMINIO: Facturación, Cartera (CxC), Cobranza, Saldo a Favor
-- ==================================================================================

\c finance_db


-- Extensiones requeridas
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS postgis;

-- ==================================================================================
-- 0) Tipos y dominios
-- ==================================================================================

CREATE DOMAIN money_12_2 AS numeric(12,2)
  CHECK (VALUE >= 0);

CREATE DOMAIN pct_5_2 AS numeric(5,2)
  CHECK (VALUE >= 0 AND VALUE <= 100);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'factura_estado') THEN
    CREATE TYPE factura_estado AS ENUM ('BORRADOR','EMITIDA','ANULADA');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sri_estado') THEN
    CREATE TYPE sri_estado AS ENUM ('PENDIENTE','AUTORIZADO','RECHAZADO','ANULADO');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cxc_estado') THEN
    CREATE TYPE cxc_estado AS ENUM ('PENDIENTE','VENCIDA','PARCIAL','PAGADA','ANULADA');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'recibo_estado') THEN
    CREATE TYPE recibo_estado AS ENUM ('BORRADOR','CONFIRMADO','ANULADO','LIQUIDADO');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pago_forma') THEN
    CREATE TYPE pago_forma AS ENUM ('EFECTIVO','TRANSFERENCIA','CHEQUE','TARJETA','QR');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'aplicacion_estado') THEN
    CREATE TYPE aplicacion_estado AS ENUM ('ACTIVA','ANULADA');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'credito_motivo') THEN
    CREATE TYPE credito_motivo AS ENUM ('REMANENTE_RECIBO','NOTA_CREDITO','ANTICIPO','APLICACION_A_FACTURA','AJUSTE');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'conciliacion_estado') THEN
    CREATE TYPE conciliacion_estado AS ENUM ('PENDIENTE','CONCILIADO','OBSERVADO');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gestion_resultado') THEN
    CREATE TYPE gestion_resultado AS ENUM ('PROMESA_PAGO','NO_ENCONTRADO','RECHAZA_PAGO','SIN_EFECTIVO','REAGENDADO','OTRO');
  END IF;
END$$;

-- ==================================================================================
-- 1) Emisión y facturación
-- ==================================================================================

CREATE TABLE punto_emision (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_establecimiento varchar(10) NOT NULL,
  codigo_punto_emision  varchar(10) NOT NULL,
  secuencia_actual bigint NOT NULL DEFAULT 1,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_punto_emision UNIQUE (codigo_establecimiento, codigo_punto_emision)
);

CREATE TABLE factura (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  pedido_id uuid NOT NULL,      -- external: orders_db
  cliente_id uuid NOT NULL,     -- external: catalog_db
  vendedor_id uuid NULL,        -- external: auth/users

  punto_emision_id uuid NULL REFERENCES punto_emision(id) ON DELETE RESTRICT,

  fecha_emision timestamptz NOT NULL DEFAULT now(),
  estado factura_estado NOT NULL DEFAULT 'BORRADOR',

  numero_completo varchar(50) UNIQUE,
  clave_acceso_sri varchar(49),
  estado_sri sri_estado NOT NULL DEFAULT 'PENDIENTE',
  url_xml text,
  url_pdf text,

  -- Datos del cliente (cifrados + hash para búsqueda exacta sin exponer)
  ruc_cliente_enc bytea NOT NULL,
  ruc_cliente_hash bytea NOT NULL,
  razon_social_cliente_enc bytea NOT NULL,

  -- Totales
  subtotal money_12_2 NOT NULL DEFAULT 0,
  impuestos money_12_2 NOT NULL DEFAULT 0,
  total_final money_12_2 NOT NULL DEFAULT 0,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE factura_detalle (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  factura_id uuid NOT NULL REFERENCES factura(id) ON DELETE RESTRICT,

  producto_id uuid NOT NULL, -- external: catalog_db
  descripcion varchar(300) NOT NULL,

  cantidad numeric(12,2) NOT NULL CHECK (cantidad > 0),
  precio_unitario money_12_2 NOT NULL,
  descuento money_12_2 NOT NULL DEFAULT 0,
  impuesto_pct pct_5_2 NOT NULL DEFAULT 0,

  total_linea money_12_2 NOT NULL DEFAULT 0,

  created_at timestamptz NOT NULL DEFAULT now()
);

-- ==================================================================================
-- 2) Cartera (CxC) + movimientos (auditoría)
-- ==================================================================================

CREATE TABLE cuenta_por_cobrar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  cliente_id uuid NOT NULL,
  factura_id uuid NOT NULL REFERENCES factura(id) ON DELETE RESTRICT,

  numero_cuota int NOT NULL DEFAULT 1,
  fecha_vencimiento date NOT NULL,

  monto_original money_12_2 NOT NULL,
  monto_pagado money_12_2 NOT NULL DEFAULT 0,

  -- Campo derivado por triggers a partir de movimientos.
  -- Decisión de rendimiento: evita SUM constante en reportes; la fuente de verdad son los movimientos.
  saldo_pendiente money_12_2 GENERATED ALWAYS AS (monto_original - monto_pagado) STORED,

  estado cxc_estado NOT NULL DEFAULT 'PENDIENTE',

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT chk_cxc_pagado_le_original CHECK (monto_pagado <= monto_original),
  CONSTRAINT uq_cxc_factura_cuota UNIQUE (factura_id, numero_cuota)
);

CREATE TABLE cxc_movimiento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_por_cobrar_id uuid NOT NULL REFERENCES cuenta_por_cobrar(id) ON DELETE RESTRICT,

  -- + aumenta deuda, - reduce deuda (pago, nota crédito aplicada a esa cuota, ajuste)
  monto numeric(12,2) NOT NULL CHECK (monto <> 0),

  referencia_tipo varchar(30) NOT NULL, -- 'FACTURA'|'RECIBO'|'NOTA_CREDITO'|'AJUSTE'
  referencia_id uuid NULL,

  created_at timestamptz NOT NULL DEFAULT now()
);

-- ==================================================================================
-- 3) Cobranza móvil: recibo + pagos (split) + aplicaciones
-- ==================================================================================

CREATE TABLE recibo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL,
  vendedor_id uuid NOT NULL,

  codigo varchar(50) UNIQUE,
  fecha timestamptz NOT NULL DEFAULT now(),

  estado recibo_estado NOT NULL DEFAULT 'BORRADOR',
  observacion text,

  foto_comprobante_url text,
  ubicacion_gps geometry(point, 4326),

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE recibo_pago (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recibo_id uuid NOT NULL REFERENCES recibo(id) ON DELETE RESTRICT,

  forma pago_forma NOT NULL,
  monto money_12_2 NOT NULL CHECK (monto > 0),
  referencia varchar(120), -- número transferencia, cheque, operación QR, etc.

  conciliacion_estado conciliacion_estado NOT NULL DEFAULT 'PENDIENTE',
  conciliado_at timestamptz NULL,

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE pago_aplicacion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  recibo_id uuid NOT NULL REFERENCES recibo(id) ON DELETE RESTRICT,
  cuenta_por_cobrar_id uuid NOT NULL REFERENCES cuenta_por_cobrar(id) ON DELETE RESTRICT,

  monto_aplicado money_12_2 NOT NULL CHECK (monto_aplicado > 0),
  estado aplicacion_estado NOT NULL DEFAULT 'ACTIVA',

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_aplicacion UNIQUE (recibo_id, cuenta_por_cobrar_id, id)
);

-- ==================================================================================
-- 4) Saldo a favor (crédito) por ledger
-- ==================================================================================

CREATE TABLE cliente_credito_movimiento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL,

  -- Si proviene de un recibo o nota de crédito se referencia aquí
  referencia_tipo varchar(30) NOT NULL, -- 'RECIBO'|'NOTA_CREDITO'|'AJUSTE'|'FACTURA'
  referencia_id uuid NULL,

  motivo credito_motivo NOT NULL,
  monto numeric(12,2) NOT NULL CHECK (monto <> 0), -- + genera crédito, - consume crédito

  expiracion date NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Resumen opcional por rendimiento (desnormalización controlada).
-- Fuente de verdad: cliente_credito_movimiento.
CREATE TABLE cliente_credito_resumen (
  cliente_id uuid PRIMARY KEY,
  saldo numeric(12,2) NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ==================================================================================
-- 5) Notas de crédito (afectan factura y/o generan crédito)
-- ==================================================================================

CREATE TABLE nota_credito (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL,
  factura_id uuid NULL REFERENCES factura(id) ON DELETE RESTRICT,

  fecha timestamptz NOT NULL DEFAULT now(),
  motivo text NOT NULL,

  subtotal money_12_2 NOT NULL DEFAULT 0,
  impuestos money_12_2 NOT NULL DEFAULT 0,
  total money_12_2 NOT NULL DEFAULT 0,

  estado varchar(20) NOT NULL DEFAULT 'EMITIDA', -- EMITIDA|ANULADA
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT chk_nc_estado CHECK (estado IN ('EMITIDA','ANULADA'))
);

-- ==================================================================================
-- 6) Gestión de cobranza (no pago / promesas)
-- ==================================================================================

CREATE TABLE cobranza_gestion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL,
  vendedor_id uuid NOT NULL,

  fecha timestamptz NOT NULL DEFAULT now(),
  resultado gestion_resultado NOT NULL,
  promesa_pago_fecha date NULL,
  observacion text,

  ubicacion_gps geometry(point, 4326),

  created_at timestamptz NOT NULL DEFAULT now()
);

-- ==================================================================================
-- 7) Índices (WHERE/JOIN/ORDER BY típicos)
-- ==================================================================================

CREATE INDEX idx_factura_cliente_fecha ON factura (cliente_id, fecha_emision DESC);
CREATE INDEX idx_factura_pedido ON factura (pedido_id);
CREATE INDEX idx_factura_sri ON factura (estado_sri, fecha_emision DESC);

CREATE INDEX idx_factura_detalle_factura ON factura_detalle (factura_id);

CREATE INDEX idx_cxc_cliente_estado_venc ON cuenta_por_cobrar (cliente_id, estado, fecha_vencimiento);
CREATE INDEX idx_cxc_factura ON cuenta_por_cobrar (factura_id);

CREATE INDEX idx_cxc_mov_cuenta ON cxc_movimiento (cuenta_por_cobrar_id, created_at DESC);

CREATE INDEX idx_recibo_cliente_fecha ON recibo (cliente_id, fecha DESC);
CREATE INDEX idx_recibo_vendedor_fecha ON recibo (vendedor_id, fecha DESC);
CREATE INDEX idx_recibo_estado_fecha ON recibo (estado, fecha DESC);

CREATE INDEX idx_recibo_pago_recibo ON recibo_pago (recibo_id);
CREATE INDEX idx_recibo_pago_conciliacion ON recibo_pago (conciliacion_estado, created_at DESC);

CREATE INDEX idx_aplicacion_recibo_activa ON pago_aplicacion (recibo_id) WHERE estado = 'ACTIVA';
CREATE INDEX idx_aplicacion_cxc_activa ON pago_aplicacion (cuenta_por_cobrar_id) WHERE estado = 'ACTIVA';

CREATE INDEX idx_credito_cliente_fecha ON cliente_credito_movimiento (cliente_id, created_at DESC);

CREATE INDEX idx_recibo_gps ON recibo USING gist (ubicacion_gps);
CREATE INDEX idx_gestion_gps ON cobranza_gestion USING gist (ubicacion_gps);

-- ==================================================================================
-- 8) Vistas útiles (mora y saldos)
-- ==================================================================================

CREATE OR REPLACE VIEW v_cxc_mora AS
SELECT
  c.id AS cuenta_por_cobrar_id,
  c.cliente_id,
  c.factura_id,
  c.numero_cuota,
  c.fecha_vencimiento,
  c.monto_original,
  c.monto_pagado,
  c.saldo_pendiente,
  c.estado,
  GREATEST(0, (current_date - c.fecha_vencimiento))::int AS dias_mora
FROM cuenta_por_cobrar c
WHERE c.estado <> 'ANULADA';

CREATE OR REPLACE VIEW v_cliente_credito AS
SELECT
  m.cliente_id,
  COALESCE(SUM(m.monto), 0)::numeric(12,2) AS saldo
FROM cliente_credito_movimiento m
WHERE (m.expiracion IS NULL OR m.expiracion >= current_date)
GROUP BY m.cliente_id;

-- ==================================================================================
-- 9) Funciones auxiliares (internas)
-- ==================================================================================

CREATE OR REPLACE FUNCTION fn_factura_recalcular_totales(p_factura_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_sub money_12_2;
  v_imp money_12_2;
BEGIN
  SELECT
    COALESCE(SUM((cantidad * precio_unitario) - descuento), 0)::numeric(12,2),
    COALESCE(SUM((((cantidad * precio_unitario) - descuento) * (impuesto_pct / 100))), 0)::numeric(12,2)
  INTO v_sub, v_imp
  FROM factura_detalle
  WHERE factura_id = p_factura_id;

  UPDATE factura
  SET subtotal = v_sub,
      impuestos = v_imp,
      total_final = (v_sub + v_imp),
      updated_at = now()
  WHERE id = p_factura_id;
END$$;

-- Asignación atómica de numeración por punto de emisión (evita colisiones en concurrencia)
CREATE OR REPLACE FUNCTION fn_punto_emision_tomar_secuencia(p_punto_emision_id uuid)
RETURNS bigint
LANGUAGE plpgsql
AS $$
DECLARE
  v_seq bigint;
BEGIN
  UPDATE punto_emision
  SET secuencia_actual = secuencia_actual + 1,
      updated_at = now()
  WHERE id = p_punto_emision_id
  RETURNING secuencia_actual INTO v_seq;

  IF v_seq IS NULL THEN
    RAISE EXCEPTION 'Punto de emisión no existe o no actualizable: %', p_punto_emision_id;
  END IF;

  RETURN v_seq;
END$$;

CREATE OR REPLACE FUNCTION fn_recibo_total(p_recibo_id uuid)
RETURNS numeric(12,2)
LANGUAGE sql
AS $$
  SELECT COALESCE(SUM(monto), 0)::numeric(12,2)
  FROM recibo_pago
  WHERE recibo_id = $1
$$;

CREATE OR REPLACE FUNCTION fn_recibo_aplicado_total(p_recibo_id uuid)
RETURNS numeric(12,2)
LANGUAGE sql
AS $$
  SELECT COALESCE(SUM(monto_aplicado), 0)::numeric(12,2)
  FROM pago_aplicacion
  WHERE recibo_id = $1 AND estado = 'ACTIVA'
$$;

-- ==================================================================================
-- 10) Triggers de consistencia (fuente de verdad: movimientos)
-- ==================================================================================

CREATE OR REPLACE FUNCTION trg_factura_detalle_set_total_linea()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.total_linea :=
    (((NEW.cantidad * NEW.precio_unitario) - NEW.descuento)
     + (((NEW.cantidad * NEW.precio_unitario) - NEW.descuento) * (NEW.impuesto_pct / 100)))::numeric(12,2);
  RETURN NEW;
END$$;

CREATE TRIGGER factura_detalle_biub_total_linea
BEFORE INSERT OR UPDATE ON factura_detalle
FOR EACH ROW
EXECUTE FUNCTION trg_factura_detalle_set_total_linea();

CREATE OR REPLACE FUNCTION trg_factura_detalle_aiud_recalcular_totales()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_factura_id uuid;
BEGIN
  v_factura_id := COALESCE(NEW.factura_id, OLD.factura_id);
  PERFORM fn_factura_recalcular_totales(v_factura_id);
  RETURN NULL;
END$$;

CREATE TRIGGER factura_detalle_aiud_totales
AFTER INSERT OR UPDATE OR DELETE ON factura_detalle
FOR EACH ROW
EXECUTE FUNCTION trg_factura_detalle_aiud_recalcular_totales();

-- Recalcula monto_pagado/estado de CxC a partir de movimientos y aplicaciones activas
CREATE OR REPLACE FUNCTION fn_cxc_recalcular(p_cxc_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_original numeric(12,2);
  v_pagado numeric(12,2);
  v_venc date;
  v_estado cxc_estado;
BEGIN
  SELECT monto_original, fecha_vencimiento
  INTO v_original, v_venc
  FROM cuenta_por_cobrar
  WHERE id = p_cxc_id
  FOR UPDATE;

  SELECT COALESCE(SUM(m.monto), 0)::numeric(12,2)
  INTO v_pagado
  FROM (
    -- Pagos aplicados (reducción de deuda)
    SELECT (-1 * pa.monto_aplicado)::numeric(12,2) AS monto
    FROM pago_aplicacion pa
    JOIN recibo r ON r.id = pa.recibo_id
    WHERE pa.cuenta_por_cobrar_id = p_cxc_id
      AND pa.estado = 'ACTIVA'
      AND r.estado IN ('CONFIRMADO','LIQUIDADO')

    UNION ALL

    -- Ajustes directos a cartera (p.ej. nota de crédito aplicada a esa cuota)
    SELECT cm.monto::numeric(12,2)
    FROM cxc_movimiento cm
    WHERE cm.cuenta_por_cobrar_id = p_cxc_id
  ) m;

  -- v_pagado aquí representa "movimiento neto" contra la deuda; lo convertimos a pagado positivo.
  -- Si los movimientos cm incluyen aumentos de deuda (+), también afectan el saldo y por ende el pagado efectivo.
  -- Regla: monto_pagado se clampa [0..monto_original] y el resto se maneja por ajustes/crédito.
  v_pagado := GREATEST(0, LEAST(v_original, v_pagado * -1));

  IF v_pagado = 0 THEN
    v_estado := CASE WHEN current_date > v_venc THEN 'VENCIDA' ELSE 'PENDIENTE' END;
  ELSIF v_pagado < v_original THEN
    v_estado := 'PARCIAL';
  ELSE
    v_estado := 'PAGADA';
  END IF;

  UPDATE cuenta_por_cobrar
  SET monto_pagado = v_pagado::numeric(12,2),
      estado = v_estado,
      updated_at = now()
  WHERE id = p_cxc_id;
END$$;

CREATE OR REPLACE FUNCTION trg_aplicacion_aiud_recalcular_cxc()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_cxc_id uuid;
BEGIN
  v_cxc_id := COALESCE(NEW.cuenta_por_cobrar_id, OLD.cuenta_por_cobrar_id);
  PERFORM fn_cxc_recalcular(v_cxc_id);
  RETURN NULL;
END$$;

CREATE TRIGGER pago_aplicacion_aiud_cxc
AFTER INSERT OR UPDATE OR DELETE ON pago_aplicacion
FOR EACH ROW
EXECUTE FUNCTION trg_aplicacion_aiud_recalcular_cxc();

CREATE OR REPLACE FUNCTION trg_cxc_mov_aiud_recalcular_cxc()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_cxc_id uuid;
BEGIN
  v_cxc_id := COALESCE(NEW.cuenta_por_cobrar_id, OLD.cuenta_por_cobrar_id);
  PERFORM fn_cxc_recalcular(v_cxc_id);
  RETURN NULL;
END$$;

CREATE TRIGGER cxc_mov_aiud_cxc
AFTER INSERT OR UPDATE OR DELETE ON cxc_movimiento
FOR EACH ROW
EXECUTE FUNCTION trg_cxc_mov_aiud_recalcular_cxc();

-- Mantiene resumen de crédito por rendimiento (desnormalización controlada)
CREATE OR REPLACE FUNCTION fn_credito_resumen_recalcular(p_cliente_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_saldo numeric(12,2);
BEGIN
  SELECT COALESCE(SUM(monto),0)::numeric(12,2)
  INTO v_saldo
  FROM cliente_credito_movimiento
  WHERE cliente_id = p_cliente_id
    AND (expiracion IS NULL OR expiracion >= current_date);

  INSERT INTO cliente_credito_resumen (cliente_id, saldo, updated_at)
  VALUES (p_cliente_id, v_saldo, now())
  ON CONFLICT (cliente_id)
  DO UPDATE SET saldo = EXCLUDED.saldo, updated_at = EXCLUDED.updated_at;
END$$;

CREATE OR REPLACE FUNCTION trg_credito_mov_aiud_resumen()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_cliente_id uuid;
BEGIN
  v_cliente_id := COALESCE(NEW.cliente_id, OLD.cliente_id);
  PERFORM fn_credito_resumen_recalcular(v_cliente_id);
  RETURN NULL;
END$$;

CREATE TRIGGER credito_mov_aiud_resumen
AFTER INSERT OR UPDATE OR DELETE ON cliente_credito_movimiento
FOR EACH ROW
EXECUTE FUNCTION trg_credito_mov_aiud_resumen();

-- ==================================================================================
-- 11) Procedimientos transaccionales (ACID)
-- ==================================================================================

-- Alta de factura (cabecera en BORRADOR; detalle se inserta aparte)
-- La cartera se crea al emitir para evitar deuda por borradores.
CREATE OR REPLACE PROCEDURE sp_factura_crear_borrador(
  IN p_pedido_id uuid,
  IN p_cliente_id uuid,
  IN p_vendedor_id uuid,
  IN p_punto_emision_id uuid,
  IN p_ruc_enc bytea,
  IN p_ruc_hash bytea,
  IN p_razon_enc bytea,
  OUT o_factura_id uuid
)
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO factura (
    pedido_id, cliente_id, vendedor_id,
    punto_emision_id,
    ruc_cliente_enc, ruc_cliente_hash, razon_social_cliente_enc,
    estado, estado_sri
  )
  VALUES (
    p_pedido_id, p_cliente_id, p_vendedor_id,
    p_punto_emision_id,
    p_ruc_enc, p_ruc_hash, p_razon_enc,
    'BORRADOR', 'PENDIENTE'
  )
  RETURNING id INTO o_factura_id;
END$$;

-- Emisión de factura + creación de cartera (1 cuota por defecto)
CREATE OR REPLACE PROCEDURE sp_factura_emitir(
  IN p_factura_id uuid,
  IN p_fecha_vencimiento date,
  IN p_crear_cuotas int DEFAULT 1
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_factura factura%ROWTYPE;
  v_seq bigint;
  v_numero varchar(50);
  v_total numeric(12,2);
  i int;
  v_cuota_total numeric(12,2);
BEGIN
  SELECT * INTO v_factura
  FROM factura
  WHERE id = p_factura_id
  FOR UPDATE;

  IF v_factura.id IS NULL THEN
    RAISE EXCEPTION 'Factura no existe: %', p_factura_id;
  END IF;

  IF v_factura.estado <> 'BORRADOR' THEN
    RAISE EXCEPTION 'Solo se puede emitir una factura en BORRADOR. Estado actual: %', v_factura.estado;
  END IF;

  PERFORM fn_factura_recalcular_totales(p_factura_id);

  SELECT total_final INTO v_total
  FROM factura
  WHERE id = p_factura_id;

  IF v_total <= 0 THEN
    RAISE EXCEPTION 'No se puede emitir factura con total <= 0';
  END IF;

  v_seq := fn_punto_emision_tomar_secuencia(v_factura.punto_emision_id);
  v_numero := v_factura.punto_emision_id::text; -- placeholder defensivo

  v_numero :=
    (SELECT codigo_establecimiento FROM punto_emision WHERE id = v_factura.punto_emision_id)
    || '-' ||
    (SELECT codigo_punto_emision FROM punto_emision WHERE id = v_factura.punto_emision_id)
    || '-' ||
    lpad(v_seq::text, 9, '0');

  UPDATE factura
  SET estado = 'EMITIDA',
      numero_completo = v_numero,
      updated_at = now()
  WHERE id = p_factura_id;

  -- Crea cuotas (diferido) repartiendo el total de forma simple.
  -- Si quieres planes sofisticados (interés / fechas escalonadas), se recomienda crear cuotas explícitas desde la app.
  IF p_crear_cuotas < 1 THEN
    RAISE EXCEPTION 'p_crear_cuotas debe ser >= 1';
  END IF;

  v_cuota_total := round((v_total / p_crear_cuotas)::numeric, 2);

  FOR i IN 1..p_crear_cuotas LOOP
    INSERT INTO cuenta_por_cobrar (
      cliente_id, factura_id, numero_cuota, fecha_vencimiento, monto_original, estado
    )
    VALUES (
      v_factura.cliente_id, p_factura_id, i, p_fecha_vencimiento, v_cuota_total,
      CASE WHEN current_date > p_fecha_vencimiento THEN 'VENCIDA' ELSE 'PENDIENTE' END
    );
  END LOOP;

  -- Ajuste por redondeo: última cuota absorbe diferencia
  IF p_crear_cuotas > 1 THEN
    UPDATE cuenta_por_cobrar
    SET monto_original = (monto_original + (v_total - (v_cuota_total * p_crear_cuotas)))::numeric(12,2)
    WHERE factura_id = p_factura_id
      AND numero_cuota = p_crear_cuotas;
  END IF;

  -- Movimiento de auditoría: nace la deuda por factura (por cuota).
  INSERT INTO cxc_movimiento (cuenta_por_cobrar_id, monto, referencia_tipo, referencia_id)
  SELECT id, (monto_original)::numeric(12,2), 'FACTURA', p_factura_id
  FROM cuenta_por_cobrar
  WHERE factura_id = p_factura_id;

  -- Recalcula estado por consistencia
  PERFORM fn_cxc_recalcular(id) FROM cuenta_por_cobrar WHERE factura_id = p_factura_id;

END$$;

-- Anulación de factura: anula factura y anula CxC asociada (deuda pasa a 0 vía ajuste)
CREATE OR REPLACE PROCEDURE sp_factura_anular(
  IN p_factura_id uuid,
  IN p_motivo text
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_factura factura%ROWTYPE;
  v_cxc record;
BEGIN
  SELECT * INTO v_factura
  FROM factura
  WHERE id = p_factura_id
  FOR UPDATE;

  IF v_factura.id IS NULL THEN
    RAISE EXCEPTION 'Factura no existe: %', p_factura_id;
  END IF;

  IF v_factura.estado = 'ANULADA' THEN
    RETURN;
  END IF;

  UPDATE factura
  SET estado = 'ANULADA',
      estado_sri = 'ANULADO',
      updated_at = now()
  WHERE id = p_factura_id;

  FOR v_cxc IN
    SELECT id, saldo_pendiente, estado
    FROM cuenta_por_cobrar
    WHERE factura_id = p_factura_id
    FOR UPDATE
  LOOP
    IF v_cxc.estado <> 'ANULADA' THEN
      -- Ajuste que elimina saldo pendiente sin borrar historial
      INSERT INTO cxc_movimiento (cuenta_por_cobrar_id, monto, referencia_tipo, referencia_id)
      VALUES (v_cxc.id, (-1 * v_cxc.saldo_pendiente)::numeric(12,2), 'AJUSTE', p_factura_id);

      UPDATE cuenta_por_cobrar
      SET estado = 'ANULADA', updated_at = now()
      WHERE id = v_cxc.id;

      PERFORM fn_cxc_recalcular(v_cxc.id);
    END IF;
  END LOOP;

  -- Motivo se registra en nota de auditoría vía app o tabla de auditoría externa.
  -- p_motivo se deja para trazabilidad a nivel servicio.
  PERFORM 1;
END$$;
-- Nota de crédito: puede aplicarse a una factura (reduce deuda) o generar crédito (saldo a favor)
CREATE OR REPLACE PROCEDURE sp_nota_credito_emitir(
  IN p_cliente_id uuid,
  IN p_factura_id uuid,
  IN p_motivo text,
  IN p_total numeric(12,2),
  OUT o_nota_credito_id uuid,              -- <--- MOVIDO AQUÍ (antes del default)
  IN p_genera_credito boolean DEFAULT true -- <--- MOVIDO AL FINAL
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_total numeric(12,2);
  v_restante numeric(12,2);
  v_cxc record;
BEGIN
  IF p_total <= 0 THEN
    RAISE EXCEPTION 'Nota de crédito requiere total > 0';
  END IF;

  INSERT INTO nota_credito (cliente_id, factura_id, motivo, total, estado)
  VALUES (p_cliente_id, p_factura_id, p_motivo, p_total::numeric(12,2), 'EMITIDA')
  RETURNING id INTO o_nota_credito_id;

  v_total := p_total;
  v_restante := v_total;

  -- Si hay factura, primero reduce deuda (FIFO por vencimiento)
  IF p_factura_id IS NOT NULL THEN
    FOR v_cxc IN
      SELECT id, saldo_pendiente
      FROM cuenta_por_cobrar
      WHERE factura_id = p_factura_id
        AND estado <> 'ANULADA'
        AND saldo_pendiente > 0
      ORDER BY fecha_vencimiento, numero_cuota
      FOR UPDATE
    LOOP
      EXIT WHEN v_restante <= 0;

      IF v_cxc.saldo_pendiente <= v_restante THEN
        INSERT INTO cxc_movimiento (cuenta_por_cobrar_id, monto, referencia_tipo, referencia_id)
        VALUES (v_cxc.id, (-1 * v_cxc.saldo_pendiente)::numeric(12,2), 'NOTA_CREDITO', o_nota_credito_id);

        v_restante := (v_restante - v_cxc.saldo_pendiente);
      ELSE
        INSERT INTO cxc_movimiento (cuenta_por_cobrar_id, monto, referencia_tipo, referencia_id)
        VALUES (v_cxc.id, (-1 * v_restante)::numeric(12,2), 'NOTA_CREDITO', o_nota_credito_id);

        v_restante := 0;
      END IF;

      PERFORM fn_cxc_recalcular(v_cxc.id);
    END LOOP;
  END IF;

  -- Remanente: si se permite saldo a favor, se registra como crédito del cliente
  IF v_restante > 0 AND p_genera_credito THEN
    INSERT INTO cliente_credito_movimiento (
      cliente_id, referencia_tipo, referencia_id, motivo, monto
    )
    VALUES (
      p_cliente_id, 'NOTA_CREDITO', o_nota_credito_id, 'NOTA_CREDITO', v_restante::numeric(12,2)
    );
  END IF;

END$$;

-- Confirmación de recibo: valida total y permite que aplicaciones impacten CxC
CREATE OR REPLACE PROCEDURE sp_recibo_confirmar(
  IN p_recibo_id uuid
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_recibo recibo%ROWTYPE;
  v_total numeric(12,2);
BEGIN
  SELECT * INTO v_recibo
  FROM recibo
  WHERE id = p_recibo_id
  FOR UPDATE;

  IF v_recibo.id IS NULL THEN
    RAISE EXCEPTION 'Recibo no existe: %', p_recibo_id;
  END IF;

  IF v_recibo.estado <> 'BORRADOR' THEN
    RAISE EXCEPTION 'Solo se puede confirmar un recibo en BORRADOR. Estado actual: %', v_recibo.estado;
  END IF;

  v_total := fn_recibo_total(p_recibo_id);
  IF v_total <= 0 THEN
    RAISE EXCEPTION 'Recibo sin pagos asociados (total <= 0)';
  END IF;

  UPDATE recibo
  SET estado = 'CONFIRMADO',
      updated_at = now()
  WHERE id = p_recibo_id;

  -- Si existen aplicaciones ya creadas, el trigger de CxC las considerará porque el recibo pasó a CONFIRMADO.
END$$;

-- Anulación de recibo: anula aplicaciones y genera ajuste de crédito por remanentes previos
CREATE OR REPLACE PROCEDURE sp_recibo_anular(
  IN p_recibo_id uuid,
  IN p_motivo text
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_recibo recibo%ROWTYPE;
  v_cliente_id uuid;
BEGIN
  SELECT * INTO v_recibo
  FROM recibo
  WHERE id = p_recibo_id
  FOR UPDATE;

  IF v_recibo.id IS NULL THEN
    RAISE EXCEPTION 'Recibo no existe: %', p_recibo_id;
  END IF;

  IF v_recibo.estado = 'ANULADO' THEN
    RETURN;
  END IF;

  UPDATE recibo
  SET estado = 'ANULADO',
      updated_at = now()
  WHERE id = p_recibo_id;

  UPDATE pago_aplicacion
  SET estado = 'ANULADA',
      updated_at = now()
  WHERE recibo_id = p_recibo_id
    AND estado = 'ACTIVA';

  v_cliente_id := v_recibo.cliente_id;

  -- Reverso del crédito generado por remanente asociado a este recibo (si existió)
  INSERT INTO cliente_credito_movimiento (
    cliente_id, referencia_tipo, referencia_id, motivo, monto
  )
  SELECT
    v_cliente_id, 'RECIBO', p_recibo_id, 'AJUSTE', (-1 * COALESCE(SUM(monto),0))::numeric(12,2)
  FROM cliente_credito_movimiento
  WHERE referencia_tipo = 'RECIBO'
    AND referencia_id = p_recibo_id
    AND motivo = 'REMANENTE_RECIBO'
  HAVING COALESCE(SUM(monto),0) <> 0;

  PERFORM fn_credito_resumen_recalcular(v_cliente_id);

  PERFORM 1;
END$$;

-- Aplicación FIFO: usa recibo contra CxC vencidas/antiguas; si sobra, genera crédito (remanente)
CREATE OR REPLACE PROCEDURE sp_recibo_aplicar_fifo(
  IN p_recibo_id uuid
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_recibo recibo%ROWTYPE;
  v_total numeric(12,2);
  v_aplicado numeric(12,2);
  v_disponible numeric(12,2);
  v_cxc record;
  v_monto numeric(12,2);
BEGIN
  SELECT * INTO v_recibo
  FROM recibo
  WHERE id = p_recibo_id
  FOR UPDATE;

  IF v_recibo.id IS NULL THEN
    RAISE EXCEPTION 'Recibo no existe: %', p_recibo_id;
  END IF;

  IF v_recibo.estado NOT IN ('CONFIRMADO','LIQUIDADO') THEN
    RAISE EXCEPTION 'Recibo debe estar CONFIRMADO o LIQUIDADO para aplicar. Estado: %', v_recibo.estado;
  END IF;

  v_total := fn_recibo_total(p_recibo_id);
  v_aplicado := fn_recibo_aplicado_total(p_recibo_id);
  v_disponible := v_total - v_aplicado;

  IF v_disponible <= 0 THEN
    RETURN;
  END IF;

  FOR v_cxc IN
    SELECT id, saldo_pendiente, fecha_vencimiento
    FROM cuenta_por_cobrar
    WHERE cliente_id = v_recibo.cliente_id
      AND estado IN ('VENCIDA','PENDIENTE','PARCIAL')
      AND saldo_pendiente > 0
    ORDER BY (fecha_vencimiento <= current_date) DESC, fecha_vencimiento, id
    FOR UPDATE
  LOOP
    EXIT WHEN v_disponible <= 0;

    v_monto := LEAST(v_disponible, v_cxc.saldo_pendiente);

    INSERT INTO pago_aplicacion (recibo_id, cuenta_por_cobrar_id, monto_aplicado, estado)
    VALUES (p_recibo_id, v_cxc.id, v_monto::numeric(12,2), 'ACTIVA');

    v_disponible := v_disponible - v_monto;

    PERFORM fn_cxc_recalcular(v_cxc.id);
  END LOOP;

  -- Remanente a crédito del cliente
  IF v_disponible > 0 THEN
    INSERT INTO cliente_credito_movimiento (
      cliente_id, referencia_tipo, referencia_id, motivo, monto
    )
    VALUES (
      v_recibo.cliente_id, 'RECIBO', p_recibo_id, 'REMANENTE_RECIBO', v_disponible::numeric(12,2)
    );

    PERFORM fn_credito_resumen_recalcular(v_recibo.cliente_id);
  END IF;

END$$;

-- Aplicación de crédito a facturas nuevas: consume saldo a favor y reduce CxC (FIFO dentro de esa factura)
CREATE OR REPLACE PROCEDURE sp_credito_aplicar_a_factura(
  IN p_factura_id uuid
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_factura factura%ROWTYPE;
  v_credito numeric(12,2);
  v_cxc record;
  v_monto numeric(12,2);
BEGIN
  SELECT * INTO v_factura
  FROM factura
  WHERE id = p_factura_id
  FOR UPDATE;

  IF v_factura.id IS NULL THEN
    RAISE EXCEPTION 'Factura no existe: %', p_factura_id;
  END IF;

  SELECT saldo INTO v_credito
  FROM cliente_credito_resumen
  WHERE cliente_id = v_factura.cliente_id;

  v_credito := COALESCE(v_credito, 0);

  IF v_credito <= 0 THEN
    RETURN;
  END IF;

  FOR v_cxc IN
    SELECT id, saldo_pendiente
    FROM cuenta_por_cobrar
    WHERE factura_id = p_factura_id
      AND estado IN ('PENDIENTE','VENCIDA','PARCIAL')
      AND saldo_pendiente > 0
    ORDER BY fecha_vencimiento, numero_cuota
    FOR UPDATE
  LOOP
    EXIT WHEN v_credito <= 0;

    v_monto := LEAST(v_credito, v_cxc.saldo_pendiente);

    -- Reduce deuda por ajuste (fuente de verdad en movimientos)
    INSERT INTO cxc_movimiento (cuenta_por_cobrar_id, monto, referencia_tipo, referencia_id)
    VALUES (v_cxc.id, (-1 * v_monto)::numeric(12,2), 'FACTURA', p_factura_id);

    -- Consume crédito
    INSERT INTO cliente_credito_movimiento (
      cliente_id, referencia_tipo, referencia_id, motivo, monto
    )
    VALUES (
      v_factura.cliente_id, 'FACTURA', p_factura_id, 'APLICACION_A_FACTURA', (-1 * v_monto)::numeric(12,2)
    );

    v_credito := v_credito - v_monto;

    PERFORM fn_cxc_recalcular(v_cxc.id);
  END LOOP;

  PERFORM fn_credito_resumen_recalcular(v_factura.cliente_id);
END$$;

-- ==================================================================================
-- 12) Seguridad: mínimo privilegio (roles)
-- ==================================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'finance_app_ro') THEN
    CREATE ROLE finance_app_ro;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'finance_app_rw') THEN
    CREATE ROLE finance_app_rw;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'finance_admin') THEN
    CREATE ROLE finance_admin;
  END IF;
END$$;

REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO finance_app_ro, finance_app_rw, finance_admin;

-- Permisos sobre objetos YA CREADOS
GRANT SELECT ON ALL TABLES IN SCHEMA public TO finance_app_ro;

GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO finance_app_rw;
-- Nota: En tu script original listabas tabla por tabla, pero ALL TABLES es más limpio 
-- si el esquema es exclusivo del microservicio. Si prefieres lista explícita, mantenla.

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO finance_app_rw;
GRANT EXECUTE ON ALL PROCEDURES IN SCHEMA public TO finance_app_rw;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO finance_admin;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO finance_admin;
GRANT ALL PRIVILEGES ON ALL PROCEDURES IN SCHEMA public TO finance_admin;

-- Permisos por DEFECTO (Para objetos futuros)
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO finance_app_ro;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE ON TABLES TO finance_app_rw;

-- CORRECCIÓN AQUÍ: Usamos ROUTINES en lugar de FUNCTIONS + PROCEDURES
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT EXECUTE ON ROUTINES TO finance_app_rw;
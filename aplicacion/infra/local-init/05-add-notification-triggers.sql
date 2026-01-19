-- ==================================================================================
-- MIGRATION: Add notification triggers for catalog_db
-- Purpose: Enable real-time notifications via PostgreSQL LISTEN/NOTIFY
-- Database: catalog_db
-- ==================================================================================

\c catalog_db;

-- ==================================================================================
-- 1. CREATE NOTIFICATION FUNCTION
-- ==================================================================================
-- This function sends a notification to the 'catalogo-cambio' channel
-- whenever a row is inserted, updated, or deleted in subscribed tables

CREATE OR REPLACE FUNCTION notify_catalogo_cambio()
RETURNS TRIGGER AS $$
DECLARE
  payload JSON;
  vendedor_id UUID;
BEGIN
  -- For rutero_planificado, we need to get the vendedor_usuario_id from asignacion_vendedores
  IF TG_TABLE_NAME = 'rutero_planificado' AND TG_OP = 'INSERT' THEN
    -- Get the vendedor assigned to this zone
    SELECT vendedor_usuario_id INTO vendedor_id
    FROM asignacion_vendedores
    WHERE zona_id = NEW.zona_id
      AND deleted_at IS NULL
      AND (fecha_fin IS NULL OR fecha_fin >= CURRENT_DATE)
    LIMIT 1;
    
    -- Build payload with vendedor_usuario_id included
    payload = json_build_object(
      'table', TG_TABLE_NAME,
      'action', TG_OP,
      'data', json_build_object(
        'id', NEW.id,
        'cliente_id', NEW.cliente_id,
        'zona_id', NEW.zona_id,
        'dia_semana', NEW.dia_semana,
        'vendedor_usuario_id', vendedor_id
      )
    );
  ELSE
    -- Standard payload for other tables
    payload = json_build_object(
      'table', TG_TABLE_NAME,
      'action', TG_OP,
      'data', CASE
        WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)
        ELSE row_to_json(NEW)
      END
    );
  END IF;
  
  -- Send notification to the channel
  PERFORM pg_notify('catalogo-cambio', payload::text);
  
  RETURN CASE
    WHEN TG_OP = 'DELETE' THEN OLD
    ELSE NEW
  END;
END;
$$ LANGUAGE plpgsql;

-- ==================================================================================
-- 2. CREATE TRIGGERS FOR NOTIFICATIONS
-- ==================================================================================

-- Trigger for rutero_planificado (route creation/updates)
DROP TRIGGER IF EXISTS trg_notify_rutero ON rutero_planificado;
CREATE TRIGGER trg_notify_rutero
AFTER INSERT OR UPDATE OR DELETE ON rutero_planificado
FOR EACH ROW
EXECUTE FUNCTION notify_catalogo_cambio();

-- Trigger for asignacion_vendedores (vendor zone assignments)
DROP TRIGGER IF EXISTS trg_notify_asignacion ON asignacion_vendedores;
CREATE TRIGGER trg_notify_asignacion
AFTER INSERT OR UPDATE OR DELETE ON asignacion_vendedores
FOR EACH ROW
EXECUTE FUNCTION notify_catalogo_cambio();

-- Trigger for precios_items (price changes)
DROP TRIGGER IF EXISTS trg_notify_precios ON precios_items;
CREATE TRIGGER trg_notify_precios
AFTER INSERT OR UPDATE OR DELETE ON precios_items
FOR EACH ROW
EXECUTE FUNCTION notify_catalogo_cambio();

-- Trigger for campañas_promocionales (promotional campaigns)
DROP TRIGGER IF EXISTS trg_notify_campanas ON campañas_promocionales;
CREATE TRIGGER trg_notify_campanas
AFTER INSERT OR UPDATE OR DELETE ON campañas_promocionales
FOR EACH ROW
EXECUTE FUNCTION notify_catalogo_cambio();

-- Trigger for sucursales_cliente (client branches)
DROP TRIGGER IF EXISTS trg_notify_sucursales ON sucursales_cliente;
CREATE TRIGGER trg_notify_sucursales
AFTER INSERT OR UPDATE OR DELETE ON sucursales_cliente
FOR EACH ROW
EXECUTE FUNCTION notify_catalogo_cambio();

-- ==================================================================================
-- 3. VERIFY TRIGGERS WERE CREATED
-- ==================================================================================
SELECT 
  tgname AS trigger_name,
  tgrelid::regclass AS table_name,
  tgenabled AS enabled,
  pg_get_triggerdef(oid) AS definition
FROM pg_trigger
WHERE tgname LIKE 'trg_notify_%'
ORDER BY tgrelid::regclass::text, tgname;

-- ==================================================================================
-- 4. TEST THE NOTIFICATION SYSTEM (Optional)
-- ==================================================================================
-- Uncomment to test manually:
-- SELECT pg_notify('catalogo-cambio', '{"test": "manual notification", "timestamp": "' || NOW()::text || '"}');

-- ==================================================================================
-- END OF MIGRATION
-- ==================================================================================

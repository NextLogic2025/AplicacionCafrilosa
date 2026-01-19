-- Script para crear trigger de notificaciones para rutero_planificado
-- Este trigger enviará notificaciones cuando se cree una nueva ruta

-- 1. Crear la función trigger si no existe
CREATE OR REPLACE FUNCTION notify_catalogo_cambio()
RETURNS TRIGGER AS $$
DECLARE
  payload JSON;
BEGIN
  -- Construir el payload con la información del cambio
  payload = json_build_object(
    'table', TG_TABLE_NAME,
    'action', TG_OP,
    'data', row_to_json(NEW)
  );
  
  -- Enviar la notificación al canal
  PERFORM pg_notify('catalogo-cambio', payload::text);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Crear el trigger para rutero_planificado
DROP TRIGGER IF EXISTS rutero_planificado_notify ON rutero_planificado;

CREATE TRIGGER rutero_planificado_notify
AFTER INSERT OR UPDATE OR DELETE ON rutero_planificado
FOR EACH ROW
EXECUTE FUNCTION notify_catalogo_cambio();

-- 3. Verificar que el trigger fue creado
SELECT 
  tgname AS trigger_name,
  tgrelid::regclass AS table_name,
  tgenabled AS enabled
FROM pg_trigger
WHERE tgname = 'rutero_planificado_notify';

-- 4. Opcional: Crear triggers para otras tablas si no existen
-- (Descomenta si necesitas agregar triggers a otras tablas)

/*
-- Para asignacion_vendedores
DROP TRIGGER IF EXISTS asignacion_vendedores_notify ON asignacion_vendedores;
CREATE TRIGGER asignacion_vendedores_notify
AFTER INSERT OR UPDATE OR DELETE ON asignacion_vendedores
FOR EACH ROW
EXECUTE FUNCTION notify_catalogo_cambio();

-- Para precios_items (precios)
DROP TRIGGER IF EXISTS precios_notify ON precios;
CREATE TRIGGER precios_notify
AFTER INSERT OR UPDATE OR DELETE ON precios
FOR EACH ROW
EXECUTE FUNCTION notify_catalogo_cambio();

-- Para campañas_promocionales
DROP TRIGGER IF EXISTS campanas_notify ON campañas_promocionales;
CREATE TRIGGER campanas_notify
AFTER INSERT OR UPDATE OR DELETE ON campañas_promocionales
FOR EACH ROW
EXECUTE FUNCTION notify_catalogo_cambio();
*/

-- 5. Probar el trigger (opcional)
-- Inserta una fila de prueba y verifica que se envíe la notificación
-- SELECT pg_notify('catalogo-cambio', '{"test": "manual notification"}');

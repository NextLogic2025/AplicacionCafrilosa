-- =========================================
-- FIX: Agregar columna campania_id a promociones_aplicadas
-- SIN BORRAR DATOS EXISTENTES
-- =========================================

\c orders_db;

-- Verificar si la columna ya existe, si no, agregarla
ALTER TABLE promociones_aplicadas
ADD COLUMN IF NOT EXISTS campania_id INT;

-- Confirmar que la columna existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'promociones_aplicadas' AND column_name = 'campania_id';

-- Mensaje de confirmación
\echo '✓ Columna campania_id agregada exitosamente (o ya existía)'

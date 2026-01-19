-- Script para poblar productos y precios de prueba
-- Ejecutar en la base de datos del servicio de catálogo

-- 1. Verificar que existe la lista de precios general
INSERT INTO listas_precios (id, nombre, descripcion, activo)
VALUES (1, 'Lista General', 'Lista de precios por defecto', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Insertar productos de ejemplo (si no existen)
INSERT INTO productos (id, codigo_sku, nombre, descripcion, categoria_id, peso_unitario_kg, volumen_m3, requiere_frio, unidad_medida, activo, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'PROD-001', 'Jamón Premium', 'Jamón de la más alta calidad', 1, 0.5, 0.001, true, 'KG', true, NOW(), NOW()),
  (gen_random_uuid(), 'PROD-002', 'Salchicha Tradicional', 'Salchicha estilo tradicional', 1, 0.3, 0.0008, true, 'KG', true, NOW(), NOW()),
  (gen_random_uuid(), 'PROD-003', 'Mortadela Clásica', 'Mortadela de cerdo', 1, 0.4, 0.0009, true, 'KG', true, NOW(), NOW()),
  (gen_random_uuid(), 'PROD-004', 'Chorizo Parrillero', 'Chorizo para asar', 1, 0.25, 0.0007, true, 'KG', true, NOW(), NOW()),
  (gen_random_uuid(), 'PROD-005', 'Salchichón Premium', 'Salchichón curado', 1, 0.35, 0.0008, false, 'KG', true, NOW(), NOW())
ON CONFLICT (codigo_sku) DO NOTHING;

-- 3. Asignar precios a los productos en la lista general
-- Primero obtenemos los IDs de los productos recién creados
WITH productos_ids AS (
  SELECT id, codigo_sku FROM productos WHERE codigo_sku IN ('PROD-001', 'PROD-002', 'PROD-003', 'PROD-004', 'PROD-005')
)
INSERT INTO precios (lista_id, producto_id, precio, created_at, updated_at)
SELECT 
  1, -- lista_id
  p.id, -- producto_id
  CASE p.codigo_sku
    WHEN 'PROD-001' THEN 45.50
    WHEN 'PROD-002' THEN 28.00
    WHEN 'PROD-003' THEN 32.00
    WHEN 'PROD-004' THEN 38.50
    WHEN 'PROD-005' THEN 52.00
  END, -- precio
  NOW(),
  NOW()
FROM productos_ids p
ON CONFLICT (lista_id, producto_id) DO UPDATE SET precio = EXCLUDED.precio, updated_at = NOW();

-- 4. Verificar que los clientes tengan asignada la lista de precios
UPDATE clientes SET lista_precios_id = 1 WHERE lista_precios_id IS NULL;

-- 5. Verificar los datos insertados
SELECT 
  p.codigo_sku,
  p.nombre,
  pr.precio,
  lp.nombre as lista_precio
FROM productos p
JOIN precios pr ON p.id = pr.producto_id
JOIN listas_precios lp ON pr.lista_id = lp.id
WHERE p.activo = true
ORDER BY p.codigo_sku;

# Categorías — API quick test

Este README explica cómo probar las rutas del módulo `categories` del servicio `catalog`.

Base URL (development): http://localhost:3000/api

Autenticación
- Endpoints protegidos requieren `Authorization: Bearer <JWT>` (roles: `admin`, `supervisor`).

Rutas y ejemplos

1) Listar categorías activas
GET /categories

curl:
```
curl -sS GET http://localhost:3000/api/categories
```
Respuesta (200): array de objetos `Category`.

2) Obtener categoría por ID
GET /categories/:id

curl:
```
curl -sS GET http://localhost:3000/api/categories/1
```
Respuesta (200): objeto `Category` o 404 si no existe.

3) Crear categoría (admin/supervisor)
POST /categories

Payload:
```json
{
  "nombre": "Lácteos",
  "descripcion": "Productos derivados de la leche",
  "imagen_url": "https://example.com/img/lacteos.png",
  "activo": true
}
```

curl (ejemplo):
```
curl -X POST http://localhost:3000/api/categories \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Lácteos","descripcion":"Productos derivados de la leche","imagen_url":"https://example.com/img/lacteos.png"}'
```
Respuesta (201): objeto `Category` creado.

4) Actualizar categoría
PUT /categories/:id

Payload (parcial permitido):
```json
{
  "descripcion": "Nueva descripción",
  "activo": false
}
```

curl:
```
curl -X PUT http://localhost:3000/api/categories/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"descripcion":"Nueva descripción","activo":false}'
```
Respuesta (200): categoría actualizada.

5) Eliminar (soft delete)
DELETE /categories/:id

curl:
```
curl -X DELETE http://localhost:3000/api/categories/1 \
  -H "Authorization: Bearer $TOKEN"
```
Respuesta (200): `{ success: true, id, deleted_at }`.

6) Restaurar categoría eliminada
POST /categories/:id/restore

curl:
```
curl -X POST http://localhost:3000/api/categories/1/restore \
  -H "Authorization: Bearer $TOKEN"
```
Respuesta (200): categoría restaurada.

Notas y tips
- Valida que `nombre` tenga longitud <= 50 y `descripcion` <= 150.
- `imagen_url` debe ser una URL válida.
- Para probar en entorno Docker Compose, reemplaza `localhost:3000` por la URL/alias del servicio en la red (`catalog-service:3000` si aplica).
- Si obtienes 401/403, verifica token y roles (`admin` o `supervisor`).

Errores comunes
- 400 Bad Request: validación DTO fallida (revisar payload).
- 404 Not Found: ID inexistente.

Si quieres, puedo añadir un script `make test-categories` o un archivo `postman_collection.json` con las peticiones listadas.

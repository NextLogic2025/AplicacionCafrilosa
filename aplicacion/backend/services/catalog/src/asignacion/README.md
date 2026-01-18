# Asignación de Vendedores

Resumen
-------
Microservicio: `catalog` — módulo `asignacion`.
Gestiona la asignación de vendedores a zonas comerciales. Implementa:
- Creación/actualización/eliminación lógica de asignaciones.
- Regla de negocio: solo puede existir un `es_principal: true` por `zona_id`.
- Operaciones realizadas en transacciones para evitar condiciones de carrera.

Rutas / Endpoints
------------------
Base: `/api/asignacion`

- GET `/asignacion`
  - Descripción: Listar todas las asignaciones activas (no borradas).
  - Roles: `admin`, `supervisor` (JWT required)
  - Respuesta: array de objetos `AsignacionVendedores`.

- POST `/asignacion`
  - Descripción: Crear una asignación de vendedor a zona.
  - Roles: `admin`, `supervisor` (JWT required)
  - Payload (ejemplo):

```json
{
  "zona_id": 1,
  "vendedor_usuario_id": "550e8400-e29b-41d4-a716-446655440000",
  "nombre_vendedor_cache": "Juan Perez",
  "es_principal": true,
  "fecha_inicio": "2026-01-01"
}
```

  - Comportamiento clave:
    - Si `es_principal: true`, el servicio valida (dentro de una transacción) que no exista otra asignación principal activa para la misma `zona_id`. Si ya existe, responde con 400 Bad Request y mensaje `Ya existe un vendedor principal activo para esta zona.`
    - La creación fuerza `created_at`/`updated_at` en servidor.

  - Respuesta (ejemplo exitoso):

```json
{
  "id": 42,
  "zona_id": 1,
  "vendedor_usuario_id": "550e8400-e29b-41d4-a716-446655440000",
  "nombre_vendedor_cache": "Juan Perez",
  "fecha_inicio": "2026-01-01",
  "fecha_fin": null,
  "es_principal": true,
  "created_at": "2026-01-17T10:00:00Z",
  "updated_at": "2026-01-17T10:00:00Z",
  "deleted_at": null
}
```

- PUT `/asignacion/:id`
  - Descripción: Actualizar campos de la asignación.
  - Roles: `admin`, `supervisor` (JWT required)
  - Payload (parcial permitido):

```json
{
  "es_principal": false,
  "fecha_fin": "2026-06-30"
}
```

  - Comportamiento clave:
    - Si el registro se actualiza a `es_principal: true` y antes no lo era, se valida que no choque con otro principal activo en la misma zona.
    - Operación en transacción para evitar condiciones de carrera.

- DELETE `/asignacion/:id`
  - Descripción: Soft delete (marcar `deleted_at`).
  - Roles: `admin`, `supervisor` (JWT required)
  - Respuesta: `{ success: true, message: 'Asignación eliminada correctamente (soft delete)' }`

Entidad (Resumen)
------------------
`AsignacionVendedores` campos principales:
- `id` (int)
- `zona_id` (int)
- `vendedor_usuario_id` (uuid)
- `nombre_vendedor_cache` (string|null)
- `fecha_inicio` (date|null)
- `fecha_fin` (date|null)
- `es_principal` (boolean)
- `created_at`, `updated_at`, `deleted_at`

Errores comunes
---------------
- 400 Bad Request: intentar crear/actualizar una asignación con `es_principal: true` cuando ya existe otro `principal` activo para la misma `zona_id`.
- 404 Not Found: actualizar o eliminar una asignación inexistente.

Notas de implementación
-----------------------
- La regla de unicidad de `es_principal` no se basa en un constraint único en DB sino en una comprobación dentro de una transacción con bloqueo pesimista (`pessimistic_write`) para evitar condiciones de carrera al crear simultáneamente.
- Las eliminaciones son lógicas (soft delete) exigiendo que las consultas filtren `deleted_at IS NULL`.
- El servicio usa `CreateAsignacionDto` con `class-validator` para validar payloads entrantes.

Ejemplos `curl`
---------------
Crear asignación (suponiendo `TOKEN` válido):

```bash
curl -X POST https://catalog.example.com/api/asignacion \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"zona_id":1,"vendedor_usuario_id":"550e8400-e29b-41d4-a716-446655440000","es_principal":true}'
```

Actualizar:

```bash
curl -X PUT https://catalog.example.com/api/asignacion/42 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"es_principal":false, "fecha_fin":"2026-06-30"}'
```

Eliminar (soft):

```bash
curl -X DELETE https://catalog.example.com/api/asignacion/42 \
  -H "Authorization: Bearer $TOKEN"
```

Preguntas / Extensiones
-----------------------
- Si quieres, puedo añadir ejemplos de respuestas de error exactas (payloads) o añadir tests unitarios que verifiquen la regla `es_principal`.
- También puedo añadir un script SQL para crear un índice parcial útil si decides reforzar la unicidad por DB (ejemplo: índice único en `zona_id WHERE es_principal = true AND deleted_at IS NULL`).

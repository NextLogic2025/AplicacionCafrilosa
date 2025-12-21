import { z } from 'zod'

/**
 * Schema base reutilizable para credenciales (web + mobile).
 * Nota: si algún cliente necesita campos extra (ej. "remember"), extiende este schema.
 */
export const credentialsSchema = z.object({
  email: z.string().email('Ingresa un correo válido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

export type Credentials = z.infer<typeof credentialsSchema>


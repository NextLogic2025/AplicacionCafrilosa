import { z } from 'zod'

export const credentialsSchema = z.object({
  email: z.string().email('Ingresa un correo válido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

export type Credentials = z.infer<typeof credentialsSchema>

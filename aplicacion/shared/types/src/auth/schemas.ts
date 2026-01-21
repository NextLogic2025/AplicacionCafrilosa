import { z } from 'zod'

export const credentialsSchema = z.object({
  email: z.string().email('Ingresa un correo válido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
})

export type Credentials = z.infer<typeof credentialsSchema>

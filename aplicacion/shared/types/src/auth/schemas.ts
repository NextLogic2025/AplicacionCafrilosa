import { z } from 'zod'

export const emailSchema = z.string().email('Ingresa un correo válido')

export const credentialsSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

export type Credentials = z.infer<typeof credentialsSchema>

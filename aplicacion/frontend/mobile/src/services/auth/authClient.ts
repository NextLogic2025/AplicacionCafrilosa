import type { SignInResponse } from '@cafrilosa/shared-types'

import { env } from '../../config/env'

type ErrorResponse = { message?: string }

export async function signIn(email: string, password: string) {
  const url = env.auth.loginUrl
  if (!url) throw new Error('Servicio de inicio de sesión no disponible')

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const data = (await res.json().catch(() => null)) as (Partial<SignInResponse> & ErrorResponse) | null
  if (!res.ok) throw new Error(typeof data?.message === 'string' ? data.message : 'No se pudo iniciar sesión')
  if (!data?.token) throw new Error('Respuesta inválida del servidor (falta token)')

  return { token: data.token }
}

export async function requestPasswordReset(email: string) {
  const url = env.auth.forgotPasswordUrl
  if (!url) throw new Error('Servicio de recuperación no disponible')

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })

  if (res.ok) return

  const data = (await res.json().catch(() => null)) as ErrorResponse | null
  throw new Error(
    typeof data?.message === 'string' ? data.message : 'No se pudo enviar el correo de recuperación'
  )
}

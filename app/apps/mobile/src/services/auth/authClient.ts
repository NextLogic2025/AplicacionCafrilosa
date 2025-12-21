import type { SignInResponse } from '@cafrilosa/shared-types'

type ErrorResponse = { message?: string }

export async function signIn(email: string, password: string) {
  // Endpoint externo configurado por env (no se hardcodea).
  const url = (process.env.EXPO_PUBLIC_AUTH_LOGIN_URL ?? '').trim()
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


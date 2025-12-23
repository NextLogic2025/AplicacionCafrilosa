import type { SignInResponse } from '@cafrilosa/shared-types'

import { env } from '../../config/env'

type ErrorResponse = { message?: string }

export async function signInWithPassword(email: string, password: string) {
  const url = env.auth.loginUrl
  if (!url) throw new Error('Servicio de inicio de sesión no disponible')

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 10_000)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      signal: controller.signal,
    })

    const data = (await res.json().catch(() => null)) as (Partial<SignInResponse> & ErrorResponse) | null

    if (!res.ok)
      throw new Error(typeof data?.message === 'string' ? data.message : 'No se pudo iniciar sesión')
    if (!data?.token) throw new Error('Respuesta inválida del servidor (falta token)')

    return { token: data.token }
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new Error('Tiempo de espera agotado')
    }
    throw e
  } finally {
    window.clearTimeout(timeout)
  }
}

export async function requestPasswordReset(email: string) {
  const url = env.auth.forgotPasswordUrl
  if (!url) throw new Error('Servicio de recuperación no disponible')

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 10_000)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
      signal: controller.signal,
    })

    if (res.ok) return

    const data = (await res.json().catch(() => null)) as ErrorResponse | null
    throw new Error(
      typeof data?.message === 'string' ? data.message : 'No se pudo enviar el correo de recuperación'
    )
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new Error('Tiempo de espera agotado')
    }
    throw e
  } finally {
    window.clearTimeout(timeout)
  }
}

import type { SignInResponse } from '@cafrilosa/shared-types'
import { jwtDecode } from 'jwt-decode'
import { getToken, setToken, getRefreshToken, setRefreshToken, clearTokens, setUserName } from '../../storage/authStorage'

import { env } from '../../config/env'

type ErrorResponse = { message?: string }

type DecodedToken = {
  exp: number
  sub: string
  role?: string
}

export async function signIn(email: string, password: string) {
  const url = env.auth.loginUrl
  if (!url) throw new Error('Servicio de inicio de sesión no disponible')

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (await res.json().catch(() => null)) as any
  if (!res.ok) throw new Error(typeof data?.message === 'string' ? data.message : 'No se pudo iniciar sesión')

  const accessToken = data?.access_token || data?.token
  const refreshToken = data?.refresh_token

  if (!accessToken) throw new Error('Respuesta inválida del servidor (falta token)')

  await setToken(accessToken)
  if (refreshToken) {
    await setRefreshToken(refreshToken)
  }

  if (data?.usuario?.nombre) {
    await setUserName(data.usuario.nombre)
  }

  return { token: accessToken, user: data?.usuario }
}

export async function getValidToken(): Promise<string | null> {
  const token = await getToken()
  if (!token) return null

  try {
    const decoded = jwtDecode<DecodedToken>(token)
    // Check if expired (with 10s buffer)
    if (decoded.exp * 1000 > Date.now() + 10000) {
      return token
    }
    console.log('Token expired, upgrading...')
  } catch {
    return null
  }

  // Token expired, try refresh
  return await refreshAccessToken()
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken()
  if (!refreshToken) {
    await signOut()
    return null
  }

  const url = env.api.baseUrl + '/auth/refresh' // Assuming standard path, adjust if needed

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    if (!res.ok) {
      throw new Error('Refresh failed')
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (await res.json()) as any
    const newAccessToken = data.access_token
    const newRefreshToken = data.refresh_token

    if (newAccessToken) {
      await setToken(newAccessToken)
      if (newRefreshToken) await setRefreshToken(newRefreshToken)
      return newAccessToken
    }
  } catch (error) {
    console.log('Error refreshing token:', error)
    await signOut()
  }
  return null
}

export async function signOut() {
  try {
    const refreshToken = await getRefreshToken()
    if (refreshToken) {
      const url = env.api.baseUrl + '/auth/logout'
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshToken}`
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      }).catch(err => console.warn('Logout backend failed', err))
    }
  } catch (error) {
    console.warn('Error during sign out process', error)
  } finally {
    // Siempre limpiar credenciales locales
    await clearTokens()
  }
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

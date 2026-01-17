import { jwtDecode } from 'jwt-decode'
import { getToken, setToken, getRefreshToken, setRefreshToken, clearTokens, setUserName } from '../../storage/authStorage'

import { env } from '../../config/env'
import { ERROR_MESSAGES, logErrorForDebugging } from '../../utils/errorMessages'

type ErrorResponse = { message?: string }

type SignedInUser = {
  id?: string
  email?: string
  nombre?: string
  role?: string | null
}

type SignInApiResponse = {
  access_token?: string
  refresh_token?: string
  token?: string
  usuario?: SignedInUser
  message?: string
}

type RefreshApiResponse = {
  access_token?: string
  refresh_token?: string
  message?: string
}

type DecodedToken = {
  exp: number
  sub: string
  role?: string
  rol?: string
  userId?: string
}

export async function signIn(email: string, password: string) {
  const url = env.auth.loginUrl
  if (!url) throw new Error(ERROR_MESSAGES.SERVER_UNAVAILABLE)

  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
  } catch (networkError) {
    logErrorForDebugging(networkError, 'signIn', { email })
    throw new Error(ERROR_MESSAGES.NETWORK_ERROR)
  }

  const data = (await res.json().catch(() => null)) as SignInApiResponse | null

  if (!res.ok) {
    const backendMsg = typeof data?.message === 'string' ? data.message.toLowerCase() : ''

    if (res.status === 401 || backendMsg.includes('credenciales') || backendMsg.includes('inválid')) {
      throw new Error(ERROR_MESSAGES.INVALID_CREDENTIALS)
    }
    if (backendMsg.includes('desactivado') || backendMsg.includes('bloqueado')) {
      throw new Error(ERROR_MESSAGES.ACCOUNT_DISABLED)
    }

    throw new Error(ERROR_MESSAGES.INVALID_CREDENTIALS)
  }

  const accessToken = data?.access_token || data?.token
  const refreshToken = data?.refresh_token

  if (!accessToken) {
    logErrorForDebugging(new Error('Missing token in response'), 'signIn', { data })
    throw new Error(ERROR_MESSAGES.SERVER_UNAVAILABLE)
  }

  await setToken(accessToken)
  if (refreshToken) {
    await setRefreshToken(refreshToken)
  }

  if (data?.usuario?.nombre) {
    await setUserName(data.usuario.nombre)
  }

  const role = typeof data?.usuario?.role === 'string' ? data.usuario.role : undefined
  return { token: accessToken, user: data?.usuario ? { ...data.usuario, role } : undefined }
}

export async function getValidToken(): Promise<string | null> {
  const token = await getToken()
  if (!token) return null

  try {
    const decoded = jwtDecode<DecodedToken>(token)
    if (decoded.exp * 1000 > Date.now() + 10000) {
      return token
    }
  } catch {
    return null
  }

  return await refreshAccessToken()
}

const AUTH_PATHS = {
  refresh: '/auth/refresh',
  logout: '/auth/logout',
} as const

function normalizeTokenString(token: string) {
  return token.trim().replace(/^"|"$/g, '')
}

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
  const refreshToken = await getRefreshToken()
  if (!refreshToken) {
    await signOut()
    return null
  }

  const authBaseUrl = env.auth.baseUrl || env.api.baseUrl
  const url = authBaseUrl + AUTH_PATHS.refresh
  const cleanRefreshToken = normalizeTokenString(refreshToken)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: cleanRefreshToken }),
    })

    if (!res.ok) {
      throw new Error('Refresh failed')
    }

    const data = (await res.json().catch(() => null)) as RefreshApiResponse | null
    const newAccessToken = data?.access_token
    const newRefreshToken = data?.refresh_token

    if (newAccessToken) {
      await setToken(newAccessToken)
      if (newRefreshToken) await setRefreshToken(newRefreshToken)
      return newAccessToken
    }
  } catch (error) {
    logErrorForDebugging(error, 'refreshAccessToken')
    await clearTokens()
  }
  return null
  })().finally(() => {
    refreshPromise = null
  })

  return refreshPromise
}

export async function signOut() {
  try {
    const refreshToken = await getRefreshToken()
    const accessToken = await getToken()
    if (refreshToken && accessToken) {
      const cleanToken = normalizeTokenString(refreshToken)
      const authBaseUrl = env.auth.baseUrl || env.api.baseUrl
      const url = authBaseUrl + AUTH_PATHS.logout
      await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ refresh_token: cleanToken }),
      }).catch(err => logErrorForDebugging(err, 'signOut.backendLogout'))
    }
  } catch (error) {
    logErrorForDebugging(error, 'signOut')
  } finally {
    await clearTokens()
  }
}

export async function requestPasswordReset(email: string) {
  const url = env.auth.forgotPasswordUrl
  if (!url) throw new Error(ERROR_MESSAGES.SERVER_UNAVAILABLE)

  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
  } catch (networkError) {
    logErrorForDebugging(networkError, 'requestPasswordReset', { email })
    throw new Error(ERROR_MESSAGES.NETWORK_ERROR)
  }

  if (res.ok) return

  const data = (await res.json().catch(() => null)) as ErrorResponse | null
  logErrorForDebugging(data, 'requestPasswordReset', { status: res.status })
  throw new Error(ERROR_MESSAGES.PASSWORD_RESET_ERROR)
}

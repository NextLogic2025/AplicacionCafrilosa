import { env } from '../../config/env'
import { getValidToken, signOut } from '../auth/authClient'
import { ApiError } from './ApiError'
import { resetToLogin } from '../../navigation/navigationRef'

export type HttpOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  headers?: Record<string, string>
  body?: unknown
  auth?: boolean
}

export async function http<T>(path: string, options: HttpOptions = {}): Promise<T> {
  const baseUrl = env.api.baseUrl
  if (!baseUrl) throw new Error('API base URL no configurada (EXPO_PUBLIC_API_BASE_URL)')

  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers ?? {}) }
  if (options.auth !== false) {
    const token = await getValidToken()
    if (token && !('Authorization' in headers)) headers.Authorization = `Bearer ${token}`
  }

  let res: Response
  try {
    res = await fetch(`${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body == null ? undefined : JSON.stringify(options.body),
    })
  } catch (networkError) {
    throw new ApiError('API Error 0: Network request failed', 0, networkError)
  }

  if (res.status === 401 && options.auth !== false) {
    console.warn('[API] 401 Unauthorized - Redirecting to Login')
    await signOut()
    resetToLogin()
    throw new Error('SESSION_EXPIRED')
  }

  if (res.status === 204) return undefined as T

  const text = await res.text().catch(() => '')
  const isJson = (res.headers.get('content-type') ?? '').includes('application/json')
  const data = (isJson ? (() => { try { return JSON.parse(text) } catch { return null } })() : null) as
    | T
    | { message?: string }
    | null

  if (!res.ok) {
    const message =
      typeof (data as { message?: string } | null)?.message === 'string'
        ? (data as { message: string }).message
        : text.trim() || 'Error de API'
    throw new ApiError(`API Error ${res.status}: ${message}`, res.status, data ?? text)
  }
  if (data == null && !text) throw new ApiError('API Error 200: Respuesta inválida del servidor', res.status)
  if (data == null) return {} as T
  return data as T
}

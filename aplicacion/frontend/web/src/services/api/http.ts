import { env } from '../../config/env'
import { getToken } from '../storage/tokenStorage'

export class ApiError extends Error {
  readonly status: number
  readonly payload?: unknown

  constructor(message: string, status: number, payload?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

export type HttpOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  headers?: Record<string, string>
  body?: unknown
  signal?: AbortSignal
  auth?: boolean
}

export async function http<T>(path: string, options: HttpOptions = {}): Promise<T> {
  const baseUrl = env.api.baseUrl
  if (!baseUrl) throw new Error('API base URL no configurada (VITE_API_BASE_URL)')

  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers ?? {}) }
  if (options.auth !== false) {
    const token = getToken()
    if (token && !('Authorization' in headers)) headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body == null ? undefined : JSON.stringify(options.body),
    signal: options.signal,
  })

  if (res.status === 204) return undefined as T

  const data = (await res.json().catch(() => null)) as T | { message?: string } | null
  if (!res.ok) {
    const message =
      typeof (data as { message?: string } | null)?.message === 'string'
        ? (data as { message: string }).message
        : 'Error de API'
    throw new ApiError(message, res.status, data)
  }
  if (data == null) throw new ApiError('Respuesta inválida del servidor', res.status)
  return data as T
}

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

// Función HTTP genérica interna
async function httpRequest<T>(baseUrl: string, path: string, options: HttpOptions = {}): Promise<T> {
  if (!baseUrl) throw new Error('URL base no configurada')

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

// Función para servicio de Autenticación (puerto 3001)
export async function httpAuth<T>(path: string, options: HttpOptions = {}): Promise<T> {
  return httpRequest<T>(env.api.auth, path, options)
}

// Función para servicio de Usuarios (puerto 3002) - incluye /auth prefix
export async function httpUsuarios<T>(path: string, options: HttpOptions = {}): Promise<T> {
  const pathWithAuth = path.startsWith('/auth') ? path : `/auth${path.startsWith('/') ? '' : '/'}${path}`
  return httpRequest<T>(env.api.usuarios, pathWithAuth, options)
}

// Función para servicio de Catálogo (puerto 3003) - incluye /api prefix
export async function httpCatalogo<T>(path: string, options: HttpOptions = {}): Promise<T> {
  const pathWithApi = path.startsWith('/api') ? path : `/api${path.startsWith('/') ? '' : '/'}${path}`
  return httpRequest<T>(env.api.catalogo, pathWithApi, options)
}

// Exportar también la versión genérica (deprecada, usar las específicas)
/** @deprecated Usa httpAuth, httpUsuarios o httpCatalogo según el servicio */
export async function http<T>(path: string, options: HttpOptions = {}): Promise<T> {
  // Por compatibilidad, usa auth por defecto
  return httpAuth<T>(path, options)
}

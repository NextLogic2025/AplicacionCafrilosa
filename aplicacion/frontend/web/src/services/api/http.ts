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
    let message = 'Error de API'
    if (data && typeof (data as any).message === 'string') {
      message = (data as any).message
    } else if (data && Array.isArray((data as any).message)) {
      message = (data as any).message.join(', ')
    }
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
  // No agregar prefijo /auth automáticamente, usar la ruta tal cual
  return httpRequest<T>(env.api.usuarios, path, options)
}

// Función para servicio de Catálogo (puerto 3003) - incluye /api prefix
export async function httpCatalogo<T>(path: string, options: HttpOptions = {}): Promise<T> {
  const pathWithApi = path.startsWith('/api') ? path : `/api${path.startsWith('/') ? '' : '/'}${path}`
  return httpRequest<T>(env.api.catalogo, pathWithApi, options)
}

// Función para servicio de Orders/Pedidos (puerto 3004) - NO incluye /api prefix
export async function httpOrders<T>(path: string, options: HttpOptions = {}): Promise<T> {
  // El servicio de orders usa /orders directamente, sin prefijo /api
  return httpRequest<T>(env.api.orders, path, options)
}

// Función para servicio de Warehouse (puerto 3005)
export async function httpWarehouse<T>(path: string, options: HttpOptions = {}): Promise<T> {
  const pathWithApi = path.startsWith('/api') ? path : `/api${path.startsWith('/') ? '' : '/'}${path}`
  return httpRequest<T>(env.api.warehouse, pathWithApi, options)
}

// Exportar también la versión genérica (deprecada, usar las específicas)
/** @deprecated Usa httpAuth, httpUsuarios o httpCatalogo según el servicio */
export async function http<T>(path: string, options: HttpOptions = {}): Promise<T> {
  // Por compatibilidad, usa auth por defecto
  return httpAuth<T>(path, options)
}

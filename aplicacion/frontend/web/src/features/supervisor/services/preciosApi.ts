import { getToken } from '../../../services/storage/tokenStorage'

const CATALOG_BASE_URL = 'http://localhost:3002'

export interface ListaPrecio {
  id: number
  nombre: string
}

export interface PrecioItem {
  lista_id: number
  producto_id: string
  precio: number
  lista?: ListaPrecio
  producto?: {
    id: string
    codigo_sku: string
    nombre: string
  }
}

export interface AsignarPrecioDto {
  productoId: string
  listaId: number
  precio: number
}

class PrecioApiError extends Error {
  readonly status: number
  readonly payload?: unknown

  constructor(message: string, status: number, payload?: unknown) {
    super(message)
    this.name = 'PrecioApiError'
    this.status = status
    this.payload = payload
  }
}

async function precioHttp<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const fullPath = `${CATALOG_BASE_URL}/api${path.startsWith('/') ? '' : '/'}${path}`
  const res = await fetch(fullPath, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (res.status === 204) return undefined as T

  const data = (await res.json().catch(() => null)) as T | { message?: string } | null
  if (!res.ok) {
    const message =
      typeof (data as { message?: string } | null)?.message === 'string'
        ? (data as { message: string }).message
        : 'Error de API'
    throw new PrecioApiError(message, res.status, data)
  }
  if (data == null) throw new PrecioApiError('Respuesta inválida del servidor', res.status)
  return data as T
}

export async function asignarPrecio(data: AsignarPrecioDto): Promise<PrecioItem> {
  return precioHttp<PrecioItem>('/precios', {
    method: 'POST',
    body: data,
  })
}

export async function obtenerPreciosDeProducto(productoId: string): Promise<PrecioItem[]> {
  return precioHttp<PrecioItem[]>(`/precios/producto/${productoId}`)
}

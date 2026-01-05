import { getToken } from '../../../services/storage/tokenStorage'

const CATALOG_BASE_URL = 'http://localhost:3002'

export interface Campania {
  id: number
  nombre: string
  descripcion: string | null
  fecha_inicio: string
  fecha_fin: string
  tipo_descuento: string | null
  valor_descuento: string | null
  alcance?: string | null
  lista_precios_objetivo_id?: number | null
  imagen_banner_url: string | null
  activo: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface ProductoPromocion {
  campania_id: number
  producto_id: string
  precio_oferta_fijo: string | null
  producto?: {
    id: string
    codigo_sku: string
    nombre: string
  }
}

export interface CreateCampaniaDto {
  nombre: string
  descripcion?: string
  fecha_inicio: string
  fecha_fin: string
  tipo_descuento?: 'PORCENTAJE' | 'MONTO_FIJO'
  valor_descuento?: number
  alcance?: 'GLOBAL' | 'POR_LISTA' | 'POR_CLIENTE'
  lista_precios_objetivo_id?: number
  imagen_banner_url?: string
  activo?: boolean
}

export interface AddProductoPromoDto {
  producto_id: string
  precio_oferta_fijo?: number
}

export interface ClienteCampania {
  campania_id: number
  cliente_id: string
  cliente?: {
    id: string
    identificacion: string
    razon_social: string
  }
}

export interface AddClienteCampaniaDto {
  cliente_id: string
}

class PromocionApiError extends Error {
  readonly status: number
  readonly payload?: unknown

  constructor(message: string, status: number, payload?: unknown) {
    super(message)
    this.name = 'PromocionApiError'
    this.status = status
    this.payload = payload
  }
}

async function promocionHttp<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
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
    throw new PromocionApiError(message, res.status, data)
  }
  if (data == null) throw new PromocionApiError('Respuesta inválida del servidor', res.status)
  return data as T
}

export async function getAllCampanias(): Promise<Campania[]> {
  return promocionHttp<Campania[]>('/promociones')
}

export async function getCampania(id: number): Promise<Campania> {
  return promocionHttp<Campania>(`/promociones/${id}`)
}

export async function createCampania(data: CreateCampaniaDto): Promise<Campania> {
  return promocionHttp<Campania>('/promociones', {
    method: 'POST',
    body: data,
  })
}

export async function updateCampania(id: number, data: Partial<CreateCampaniaDto>): Promise<Campania> {
  return promocionHttp<Campania>(`/promociones/${id}`, {
    method: 'PUT',
    body: data,
  })
}

export async function deleteCampania(id: number): Promise<void> {
  return promocionHttp<void>(`/promociones/${id}`, {
    method: 'DELETE',
  })
}

export async function getProductosByCampania(campaniaId: number): Promise<ProductoPromocion[]> {
  return promocionHttp<ProductoPromocion[]>(`/promociones/${campaniaId}/productos`)
}

export async function addProductoPromo(campaniaId: number, data: AddProductoPromoDto): Promise<ProductoPromocion> {
  return promocionHttp<ProductoPromocion>(`/promociones/${campaniaId}/productos`, {
    method: 'POST',
    body: data,
  })
}

export async function deleteProductoPromo(campaniaId: number, productoId: string): Promise<void> {
  return promocionHttp<void>(`/promociones/${campaniaId}/productos/${productoId}`, {
    method: 'DELETE',
  })
}

export async function getClientesByCampania(campaniaId: number): Promise<ClienteCampania[]> {
  return promocionHttp<ClienteCampania[]>(`/promociones/${campaniaId}/clientes`)
}

export async function addClienteCampania(campaniaId: number, data: AddClienteCampaniaDto): Promise<ClienteCampania> {
  return promocionHttp<ClienteCampania>(`/promociones/${campaniaId}/clientes`, {
    method: 'POST',
    body: data,
  })
}

export async function deleteClienteCampania(campaniaId: number, clienteId: string): Promise<void> {
  return promocionHttp<void>(`/promociones/${campaniaId}/clientes/${clienteId}`, {
    method: 'DELETE',
  })
}

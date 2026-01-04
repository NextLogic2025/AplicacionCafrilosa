import { getToken } from '../../../services/storage/tokenStorage'

const CATALOG_BASE_URL = 'http://localhost:3002'

export interface Product {
  id: string
  codigo_sku: string
  nombre: string
  descripcion: string | null
  categoria_id: number | null
  peso_unitario_kg: string
  volumen_m3: string | null
  requiere_frio: boolean
  unidad_medida: string
  imagen_url: string | null
  activo: boolean
  created_at: string
  deleted_at: string | null
}

export interface CreateProductDto {
  codigo_sku: string
  nombre: string
  descripcion?: string
  categoria_id?: number | null
  peso_unitario_kg: number
  volumen_m3?: number | null
  requiere_frio?: boolean
  unidad_medida?: string
  imagen_url?: string
  activo?: boolean
}

class ProductApiError extends Error {
  readonly status: number
  readonly payload?: unknown

  constructor(message: string, status: number, payload?: unknown) {
    super(message)
    this.name = 'ProductApiError'
    this.status = status
    this.payload = payload
  }
}

async function productHttp<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
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
    throw new ProductApiError(message, res.status, data)
  }
  if (data == null) throw new ProductApiError('Respuesta inválida del servidor', res.status)
  return data as T
}

export async function getAllProducts(): Promise<Product[]> {
  const response = await productHttp<{ metadata: any; items: Product[] }>('/products')
  return response.items || []
}

export async function createProduct(data: CreateProductDto): Promise<Product> {
  return productHttp<Product>('/products', {
    method: 'POST',
    body: data,
  })
}

export async function updateProduct(id: string, data: Partial<CreateProductDto>): Promise<Product> {
  return productHttp<Product>(`/products/${id}`, {
    method: 'PUT',
    body: data,
  })
}

export async function deleteProduct(id: string): Promise<void> {
  await productHttp<void>(`/products/${id}`, {
    method: 'DELETE',
  })
}

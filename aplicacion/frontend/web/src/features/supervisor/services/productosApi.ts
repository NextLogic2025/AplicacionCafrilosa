import { httpCatalogo } from '../../../services/api/http'

export interface Product {
  id: string
  codigo_sku: string
  nombre: string
  descripcion: string | null
  categoria_id?: number | null
  categoria?: {
    id: number
    nombre: string
  } | null
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

export async function getAllProducts(): Promise<Product[]> {
  const response = await httpCatalogo<{ metadata: any; items: Product[] }>('/products')
  return response.items || []
}

export async function createProduct(data: CreateProductDto): Promise<Product> {
  return httpCatalogo<Product>('/products', {
    method: 'POST',
    body: data,
  })
}

export async function updateProduct(id: string, data: Partial<CreateProductDto>): Promise<Product> {
  return httpCatalogo<Product>(`/products/${id}`, {
    method: 'PUT',
    body: data,
  })
}

export async function deleteProduct(id: string): Promise<void> {
  await httpCatalogo<void>(`/products/${id}`, {
    method: 'DELETE',
  })
}

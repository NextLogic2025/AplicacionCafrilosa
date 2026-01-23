import { httpCatalogo } from '../../../services/api/http'

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

export async function getAllCampanias(): Promise<Campania[]> {
  return httpCatalogo<Campania[]>('/promociones')
}

export async function getCampania(id: number): Promise<Campania> {
  return httpCatalogo<Campania>(`/promociones/${id}`)
}

export async function createCampania(data: CreateCampaniaDto): Promise<Campania> {
  return httpCatalogo<Campania>('/promociones', {
    method: 'POST',
    body: data,
  })
}

export async function updateCampania(id: number, data: Partial<CreateCampaniaDto>): Promise<Campania> {
  return httpCatalogo<Campania>(`/promociones/${id}`, {
    method: 'PUT',
    body: data,
  })
}

export async function deleteCampania(id: number): Promise<void> {
  return httpCatalogo<void>(`/promociones/${id}`, {
    method: 'DELETE',
  })
}

export async function getProductosByCampania(campaniaId: number): Promise<ProductoPromocion[]> {
  const response = await httpCatalogo<{ items: ProductoPromocion[] } | ProductoPromocion[]>(`/promociones/${campaniaId}/productos`)
  // La API puede devolver {items: [...]} o directamente [...]
  return Array.isArray(response) ? response : (response as any).items || []
}

export async function addProductoPromo(campaniaId: number, data: AddProductoPromoDto): Promise<ProductoPromocion> {
  return httpCatalogo<ProductoPromocion>(`/promociones/${campaniaId}/productos`, {
    method: 'POST',
    body: data,
  })
}

export async function deleteProductoPromo(campaniaId: number, productoId: string): Promise<void> {
  return httpCatalogo<void>(`/promociones/${campaniaId}/productos/${productoId}`, {
    method: 'DELETE',
  })
}

export async function getClientesByCampania(campaniaId: number): Promise<ClienteCampania[]> {
  const response = await httpCatalogo<{ items: ClienteCampania[] } | ClienteCampania[]>(`/promociones/${campaniaId}/clientes`)
  // La API puede devolver {items: [...]} o directamente [...]
  return Array.isArray(response) ? response : (response as any).items || []
}

export async function addClienteCampania(campaniaId: number, data: AddClienteCampaniaDto): Promise<ClienteCampania> {
  return httpCatalogo<ClienteCampania>(`/promociones/${campaniaId}/clientes`, {
    method: 'POST',
    body: data,
  })
}

export async function deleteClienteCampania(campaniaId: number, clienteId: string): Promise<void> {
  return httpCatalogo<void>(`/promociones/${campaniaId}/clientes/${clienteId}`, {
    method: 'DELETE',
  })
}

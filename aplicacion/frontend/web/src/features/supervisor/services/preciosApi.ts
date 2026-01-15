import { httpCatalogo } from '../../../services/api/http'

export interface ListaPrecio {
  id: number
  nombre: string
}

export interface PrecioItem {
  lista_id: number
  producto_id: string
  precio: number
  habilitado?: boolean
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
  habilitado?: boolean
}

export interface CreateListaPrecioDto {
  nombre: string
}

export async function asignarPrecio(data: AsignarPrecioDto): Promise<PrecioItem> {
  // El backend espera productoId y listaId en camelCase
  const payload = {
    productoId: data.productoId,
    listaId: data.listaId,
    precio: data.precio
  }
  return httpCatalogo<PrecioItem>('/precios', {
    method: 'POST',
    body: payload,
  })
}

export async function obtenerPreciosDeProducto(productoId: string): Promise<PrecioItem[]> {
  return httpCatalogo<PrecioItem[]>(`/precios/producto/${productoId}`)
}

export async function getAllListasPrecios(): Promise<ListaPrecio[]> {
  return httpCatalogo<ListaPrecio[]>('/precios/listas')
}

export async function createListaPrecio(data: CreateListaPrecioDto): Promise<ListaPrecio> {
  return httpCatalogo<ListaPrecio>('/precios/listas', {
    method: 'POST',
    body: data,
  })
}

export async function updateListaPrecio(id: number, data: CreateListaPrecioDto): Promise<ListaPrecio> {
  return httpCatalogo<ListaPrecio>(`/precios/listas/${id}`, {
    method: 'PUT',
    body: data,
  })
}

export async function deleteListaPrecio(id: number): Promise<void> {
  return httpCatalogo<void>(`/precios/listas/${id}`, {
    method: 'DELETE',
  })
}

// Elimina un precio asignado a un producto en una lista específica
export async function eliminarPrecioAsignado(listaId: number, productoId: string): Promise<void> {
  return httpCatalogo<void>(`/precios/lista/${listaId}/producto/${productoId}`, {
    method: 'DELETE',
  })
}

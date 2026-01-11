import { httpCatalogo } from '../../../services/api/http'

export interface Sucursal {
  id: string
  cliente_id: string
  nombre_sucursal: string
  direccion_entrega: string | null
  ubicacion_gps?: { type: 'Point'; coordinates: [number, number] } | null
  contacto_nombre: string | null
  contacto_telefono: string | null
  activo: boolean
  created_at: string
  updated_at: string
}

export interface CreateSucursalDto {
  cliente_id: string
  nombre_sucursal: string
  direccion_entrega?: string
  ubicacion_gps?: { type: 'Point'; coordinates: [number, number] }
  contacto_nombre?: string
  contacto_telefono?: string
  activo?: boolean
  zona_id?: number
}

export interface UpdateSucursalDto {
  nombre_sucursal?: string
  direccion_entrega?: string
  ubicacion_gps?: { type: 'Point'; coordinates: [number, number] }
  contacto_nombre?: string
  contacto_telefono?: string
  activo?: boolean
  zona_id?: number
}

export async function crearSucursal(clienteId: string, data: CreateSucursalDto): Promise<Sucursal> {
  return httpCatalogo<Sucursal>(`/clientes/${clienteId}/sucursales`, {
    method: 'POST',
    body: data,
  })
}

export async function obtenerSucursales(clienteId: string): Promise<Sucursal[]> {
  return httpCatalogo<Sucursal[]>(`/clientes/${clienteId}/sucursales`)
}

export async function obtenerSucursal(_clienteId: string, sucursalId: string): Promise<Sucursal> {
  return httpCatalogo<Sucursal>(`/sucursales/${sucursalId}`)
}

export async function actualizarSucursal(
  _clienteId: string,
  sucursalId: string,
  data: UpdateSucursalDto
): Promise<Sucursal> {
  return httpCatalogo<Sucursal>(`/sucursales/${sucursalId}`, {
    method: 'PUT',
    body: data,
  })
}

export async function eliminarSucursal(_clienteId: string, sucursalId: string): Promise<{ id: string; deleted: boolean }> {
  return httpCatalogo<{ id: string; deleted: boolean }>(`/sucursales/${sucursalId}`, {
    method: 'DELETE',
  })
}

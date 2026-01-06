import { getToken } from '../../../services/storage/tokenStorage'

const CATALOG_BASE_URL = 'http://localhost:3002'

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
}

export interface UpdateSucursalDto {
  nombre_sucursal?: string
  direccion_entrega?: string
  ubicacion_gps?: { type: 'Point'; coordinates: [number, number] }
  contacto_nombre?: string
  contacto_telefono?: string
  activo?: boolean
}

export async function crearSucursal(clienteId: string, data: CreateSucursalDto): Promise<Sucursal> {
  const token = getToken()
  const response = await fetch(`${CATALOG_BASE_URL}/api/clientes/${clienteId}/sucursales`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error(`Error creating sucursal: ${response.statusText}`)
  }

  return response.json()
}

export async function obtenerSucursales(clienteId: string): Promise<Sucursal[]> {
  const token = getToken()
  const response = await fetch(`${CATALOG_BASE_URL}/api/clientes/${clienteId}/sucursales`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Error fetching sucursales: ${response.statusText}`)
  }

  return response.json()
}

export async function obtenerSucursal(clienteId: string, sucursalId: string): Promise<Sucursal> {
  const token = getToken()
  const response = await fetch(`${CATALOG_BASE_URL}/api/clientes/${clienteId}/sucursales/${sucursalId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Error fetching sucursal: ${response.statusText}`)
  }

  return response.json()
}

export async function actualizarSucursal(
  clienteId: string,
  sucursalId: string,
  data: UpdateSucursalDto
): Promise<Sucursal> {
  const token = getToken()
  const response = await fetch(`${CATALOG_BASE_URL}/api/clientes/${clienteId}/sucursales/${sucursalId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error(`Error updating sucursal: ${response.statusText}`)
  }

  return response.json()
}

export async function eliminarSucursal(clienteId: string, sucursalId: string): Promise<{ id: string; deleted: boolean }> {
  const token = getToken()
  const response = await fetch(`${CATALOG_BASE_URL}/api/clientes/${clienteId}/sucursales/${sucursalId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Error deleting sucursal: ${response.statusText}`)
  }

  return response.json()
}

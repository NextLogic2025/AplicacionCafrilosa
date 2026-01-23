import { httpCatalogo } from '../../../services/api/http'

export interface Cliente {
  id: string
  usuario_principal_id: string | null
  identificacion: string
  tipo_identificacion: string
  razon_social: string
  nombre_comercial: string | null
  lista_precios_id: number | null
  vendedor_asignado_id: string | null
  zona_comercial_id: number | null
  bloqueado: boolean
  direccion_texto: string | null
  ubicacion_gps?: { type: 'Point'; coordinates: [number, number] } | null
  latitud?: number | null
  longitud?: number | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  zona_comercial?: { id: number; nombre: string }
  lista_precios?: { id: number; nombre: string }
}

export interface CreateClienteDto {
  identificacion: string
  tipo_identificacion?: string
  razon_social: string
  nombre_comercial?: string
  usuario_principal_id?: string | null
  lista_precios_id?: number | null
  vendedor_asignado_id?: string | null
  zona_comercial_id?: number | null
  direccion_texto?: string
  ubicacion_gps?: { type: 'Point'; coordinates: [number, number] } | null
  sucursales?: Array<{
    nombre_sucursal?: string
    direccion_entrega?: string
    ubicacion_gps?: { type: 'Point'; coordinates: [number, number] } | null
    contacto_nombre?: string
    contacto_telefono?: string
    zona_id?: number
    activo?: boolean
  }>
}

export interface ZonaComercial {
  id: number
  nombre: string
  descripcion?: string
  vendedor_asignado?: {
    id: number
    vendedor_usuario_id: string
    nombre_vendedor_cache: string | null
  } | null
}

export interface ListaPrecio {
  id: number
  nombre: string
  descripcion?: string
  activo?: boolean
}

export async function obtenerClientes(): Promise<Cliente[]> {
  return httpCatalogo<Cliente[]>('/clientes')
}

export async function obtenerCliente(id: string): Promise<Cliente> {
  return httpCatalogo<Cliente>(`/clientes/${id}`)
}

export async function crearCliente(data: CreateClienteDto): Promise<Cliente> {
  return httpCatalogo<Cliente>('/clientes', {
    method: 'POST',
    body: data,
  })
}

export async function actualizarCliente(id: string, data: Partial<CreateClienteDto>): Promise<Cliente> {
  return httpCatalogo<Cliente>(`/clientes/${id}`, {
    method: 'PUT',
    body: data,
  })
}

export async function eliminarCliente(id: string): Promise<void> {
  await httpCatalogo<void>(`/clientes/${id}`, {
    method: 'DELETE',
  })
}

export async function obtenerZonas(): Promise<ZonaComercial[]> {
  return httpCatalogo<ZonaComercial[]>('/zonas')
}

export async function obtenerListasPrecios(): Promise<ListaPrecio[]> {
  return httpCatalogo<ListaPrecio[]>('/precios/listas')
}

// Servicio para obtener clientes por zona desde el backend
export async function obtenerClientesPorZona(zonaId: string) {
  if (!zonaId) return []
  const url = `${import.meta.env.VITE_CATALOGO_BASE_URL}/api/clientes?zonaId=${zonaId}`
  const token = localStorage.getItem('cafrilosa.token') || sessionStorage.getItem('cafrilosa.token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error('Error al cargar clientes')
  const data = await res.json()
  // Ajusta aquí según la estructura real de tu respuesta
  if (Array.isArray(data)) return data
  if (Array.isArray(data.clientes)) return data.clientes
  return []
}

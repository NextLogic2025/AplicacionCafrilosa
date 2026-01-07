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
  tiene_credito: boolean
  limite_credito: string
  saldo_actual: string
  dias_plazo: number
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
  tiene_credito?: boolean
  limite_credito?: number
  dias_plazo?: number
  direccion_texto?: string
  ubicacion_gps?: { type: 'Point'; coordinates: [number, number] } | null
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

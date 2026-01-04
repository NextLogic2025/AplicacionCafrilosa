import { getToken } from '../../../services/storage/tokenStorage'

const CATALOG_BASE_URL = 'http://localhost:3002'

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
  created_at: string
  updated_at: string
  deleted_at: string | null
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
}

export interface ZonaComercial {
  id: number
  nombre: string
  descripcion?: string
}

export interface ListaPrecio {
  id: number
  nombre: string
  descripcion?: string
  activo?: boolean
}

class ClienteApiError extends Error {
  readonly status: number
  readonly payload?: unknown

  constructor(message: string, status: number, payload?: unknown) {
    super(message)
    this.name = 'ClienteApiError'
    this.status = status
    this.payload = payload
  }
}

async function clienteHttp<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
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
    throw new ClienteApiError(message, res.status, data)
  }
  if (data == null) throw new ClienteApiError('Respuesta inválida del servidor', res.status)
  return data as T
}

export async function obtenerClientes(): Promise<Cliente[]> {
  return clienteHttp<Cliente[]>('/clientes')
}

export async function obtenerCliente(id: string): Promise<Cliente> {
  return clienteHttp<Cliente>(`/clientes/${id}`)
}

export async function crearCliente(data: CreateClienteDto): Promise<Cliente> {
  return clienteHttp<Cliente>('/clientes', {
    method: 'POST',
    body: data,
  })
}

export async function actualizarCliente(id: string, data: Partial<CreateClienteDto>): Promise<Cliente> {
  return clienteHttp<Cliente>(`/clientes/${id}`, {
    method: 'PUT',
    body: data,
  })
}

export async function eliminarCliente(id: string): Promise<void> {
  await clienteHttp<void>(`/clientes/${id}`, {
    method: 'DELETE',
  })
}

export async function obtenerZonas(): Promise<ZonaComercial[]> {
  return clienteHttp<ZonaComercial[]>('/zonas')
}

export async function obtenerListasPrecios(): Promise<ListaPrecio[]> {
  return clienteHttp<ListaPrecio[]>('/precios/listas')
}

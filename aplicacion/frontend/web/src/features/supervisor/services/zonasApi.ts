import { getToken } from '../../../services/storage/tokenStorage'

const CATALOG_BASE_URL = 'http://localhost:3002'

export interface ZonaComercial {
  id: number
  codigo: string
  nombre: string
  ciudad: string | null
  macrorregion: string | null
  poligono_geografico: unknown | null
  activo: boolean
  created_at: string
  deleted_at: string | null
  vendedor_asignado?: {
    id: number
    vendedor_usuario_id: string
    nombre_vendedor_cache: string | null
  } | null
}

export interface AsignacionVendedor {
  id?: number
  zona_id: number
  vendedor_usuario_id: string
  nombre_vendedor_cache?: string
  es_principal?: boolean
}

export interface CreateZonaDto {
  codigo: string
  nombre: string
  ciudad?: string
  macrorregion?: string
  poligono_geografico?: unknown
}

class ZonasApiError extends Error {
  readonly status: number
  readonly payload?: unknown

  constructor(message: string, status: number, payload?: unknown) {
    super(message)
    this.name = 'ZonasApiError'
    this.status = status
    this.payload = payload
  }
}

async function zonasHttp<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
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

  const data = (await res.json().catch(() => null)) as T | { message?: string; error?: string } | null
  if (!res.ok) {
    let message = 'Error de API'
    if (data && typeof data === 'object' && 'message' in data && typeof (data as any).message === 'string') {
      message = (data as any).message
    } else if (data && typeof data === 'object' && 'error' in data && typeof (data as any).error === 'string') {
      message = (data as any).error
    }
    throw new ZonasApiError(message, res.status, data)
  }
  if (data == null) throw new ZonasApiError('Respuesta inválida del servidor', res.status)
  return data as T
}

export async function getAllZonas(): Promise<ZonaComercial[]> {
  return zonasHttp<ZonaComercial[]>('/zonas')
}

export async function getAllAsignaciones(): Promise<AsignacionVendedor[]> {
  return zonasHttp<AsignacionVendedor[]>('/asignacion')
}

export async function getZonasConVendedores(): Promise<ZonaComercial[]> {
  const [zonas, asignaciones] = await Promise.all([
    getAllZonas(),
    getAllAsignaciones().catch(() => []),
  ])

  return (zonas || []).map((zona) => {
    const asignacion = (asignaciones || []).find((a) => a.zona_id === zona.id && a.es_principal)
    return {
      ...zona,
      vendedor_asignado: asignacion
        ? {
            id: asignacion.id || 0,
            vendedor_usuario_id: asignacion.vendedor_usuario_id,
            nombre_vendedor_cache: asignacion.nombre_vendedor_cache || null,
          }
        : null,
    } as ZonaComercial
  })
}

export async function createZona(data: CreateZonaDto): Promise<ZonaComercial> {
  const payload: Record<string, unknown> = {
    codigo: data.codigo,
    nombre: data.nombre,
  }

  if (data.ciudad) payload.ciudad = data.ciudad
  if (data.macrorregion) payload.macrorregion = data.macrorregion
  if (data.poligono_geografico) payload.poligono_geografico = data.poligono_geografico

  return zonasHttp<ZonaComercial>('/zonas', {
    method: 'POST',
    body: payload,
  })
}

export async function updateZona(id: number, data: Partial<CreateZonaDto>): Promise<ZonaComercial> {
  const payload: Record<string, unknown> = {}

  if (data.codigo) payload.codigo = data.codigo
  if (data.nombre) payload.nombre = data.nombre
  if (data.ciudad !== undefined) payload.ciudad = data.ciudad
  if (data.macrorregion !== undefined) payload.macrorregion = data.macrorregion
  if (data.poligono_geografico !== undefined) payload.poligono_geografico = data.poligono_geografico

  return zonasHttp<ZonaComercial>(`/zonas/${id}`, {
    method: 'PUT',
    body: payload,
  })
}

export async function toggleZonaActivo(id: number, nuevoEstado: boolean): Promise<ZonaComercial> {
  return zonasHttp<ZonaComercial>(`/zonas/${id}`, {
    method: 'PUT',
    body: { activo: nuevoEstado },
  })
}

export async function asignarVendedorAZona(data: AsignacionVendedor): Promise<AsignacionVendedor> {
  return zonasHttp<AsignacionVendedor>('/asignacion', {
    method: 'POST',
    body: data,
  })
}

export async function actualizarAsignacionVendedor(id: number, data: Partial<AsignacionVendedor>): Promise<AsignacionVendedor> {
  return zonasHttp<AsignacionVendedor>(`/asignacion/${id}`, {
    method: 'PUT',
    body: data,
  })
}

export async function eliminarAsignacionVendedor(id: number): Promise<void> {
  await zonasHttp<void>(`/asignacion/${id}`, {
    method: 'DELETE',
  })
}

export async function obtenerAsignacionesDeZona(zonaId: number): Promise<AsignacionVendedor[]> {
  const todas = await zonasHttp<AsignacionVendedor[]>('/asignacion')
  return (todas || []).filter((a) => a.zona_id === zonaId)
}

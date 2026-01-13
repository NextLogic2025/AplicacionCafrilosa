// Servicio para obtener zonas desde el backend
export async function obtenerZonas() {
  const url = import.meta.env.VITE_CATALOGO_BASE_URL + '/api/zonas';
  // Obtener token desde localStorage o sessionStorage
  const token = localStorage.getItem('cafrilosa.token') || sessionStorage.getItem('cafrilosa.token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error('Error al cargar zonas');
  const data = await res.json();
  // Ajusta aquí según la estructura real de tu respuesta
  // Si tu backend responde { zonas: [...] }:
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.zonas)) return data.zonas;
  return [];
}import { httpCatalogo } from '../../../services/api/http'

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

export async function getAllZonas(): Promise<ZonaComercial[]> {
  return httpCatalogo<ZonaComercial[]>('/zonas')
}

export async function getAllAsignaciones(): Promise<AsignacionVendedor[]> {
  return httpCatalogo<AsignacionVendedor[]>('/asignacion')
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

  return httpCatalogo<ZonaComercial>('/zonas', {
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

  return httpCatalogo<ZonaComercial>(`/zonas/${id}`, {
    method: 'PUT',
    body: payload,
  })
}

export async function toggleZonaActivo(id: number, nuevoEstado: boolean): Promise<ZonaComercial> {
  return httpCatalogo<ZonaComercial>(`/zonas/${id}`, {
    method: 'PUT',
    body: { activo: nuevoEstado },
  })
}

export async function asignarVendedorAZona(data: AsignacionVendedor): Promise<AsignacionVendedor> {
  return httpCatalogo<AsignacionVendedor>('/asignacion', {
    method: 'POST',
    body: data,
  })
}

export async function actualizarAsignacionVendedor(id: number, data: Partial<AsignacionVendedor>): Promise<AsignacionVendedor> {
  return httpCatalogo<AsignacionVendedor>(`/asignacion/${id}`, {
    method: 'PUT',
    body: data,
  })
}

export async function eliminarAsignacionVendedor(id: number): Promise<void> {
  await httpCatalogo<void>(`/asignacion/${id}`, {
    method: 'DELETE',
  })
}

export async function obtenerAsignacionesDeZona(zonaId: number): Promise<AsignacionVendedor[]> {
  const todas = await httpCatalogo<AsignacionVendedor[]>('/asignacion')
  return (todas || []).filter((a) => a.zona_id === zonaId)
}

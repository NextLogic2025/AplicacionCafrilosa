export interface ClienteRutero {
  id: string
  nombre?: string | null
  razon_social: string
  nombre_comercial?: string | null
  zona_comercial_id?: number | null
  zona_comercial?: { id?: number | null; nombre?: string | null } | null
  prioridad?: 'ALTA' | 'MEDIA' | 'BAJA'
  frecuencia?: 'SEMANAL' | 'QUINCENAL' | 'MENSUAL'
  orden?: number
  hora_estimada?: string | null
  activo?: boolean
  ruteroId?: string | null
  fueraDeZona?: boolean
  zonaAsignadaId?: number | null
  zonaAsignadaNombre?: string | null
  ubicacion_gps?: {
    type: 'Point'
    coordinates: [number, number]
  } | null
  sucursales?: SucursalRutero[]
}

export interface SucursalRutero {
  id: string
  nombre_sucursal: string
  ubicacion_gps?: {
    type: 'Point'
    coordinates: [number, number]
  } | null
}

export interface RuteroPlanificado {
  id?: string
  cliente_id: string
  zona_id: number
  dia_semana: DiaSemana
  frecuencia: 'SEMANAL' | 'QUINCENAL' | 'MENSUAL'
  prioridad_visita: 'ALTA' | 'MEDIA' | 'BAJA'
  orden_sugerido: number
  hora_estimada: string | null
  activo: boolean
  created_by?: string
  updated_at?: string
}

export type DiaSemana = 'LUNES' | 'MARTES' | 'MIERCOLES' | 'JUEVES' | 'VIERNES' 

export const DIAS_SEMANA: DiaSemana[] = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES']

export const PRIORIDAD_COLORS = {
  ALTA: 'bg-red-100 text-red-800 border-red-300',
  MEDIA: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  BAJA: 'bg-green-100 text-green-800 border-green-300',
} as const

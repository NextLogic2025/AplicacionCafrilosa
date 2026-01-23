import { env } from '../../config/env'
import { ApiService } from './ApiService'
import { endpoints } from './endpoints'
import { createService } from './createService'

export type DespachoEstadoViaje = 'PLANIFICACION' | 'CONFIRMADO' | 'EN_RUTA' | 'COMPLETADO' | 'CANCELADO'

export interface Despacho {
    id: string
    codigo_manifiesto: number | null
    vehiculo_id: string | null
    conductor_id: string | null
    estado_viaje: DespachoEstadoViaje
    peso_total_kg: string
    fecha_programada: string | null
    hora_inicio_real: string | null
    hora_fin_real: string | null
    observaciones_ruta: string | null
    created_at: string
    updated_at: string
    deleted_at: string | null
    vehiculo?: {
        id: string
        placa: string
        marca: string | null
        modelo: string | null
    }
    conductor?: {
        id: string
        nombre_completo: string
        cedula: string
        licencia: string | null
    }
}

export interface CreateDespachoDto {
    vehiculo_id?: string
    conductor_id?: string
    fecha_programada?: string
    observaciones_ruta?: string
    estado_viaje?: DespachoEstadoViaje
}

export interface UpdateDespachoDto {
    vehiculo_id?: string
    conductor_id?: string
    fecha_programada?: string
    observaciones_ruta?: string
    estado_viaje?: DespachoEstadoViaje
    hora_inicio_real?: string
    hora_fin_real?: string
}

export interface DespachoFilters {
    estado_viaje?: DespachoEstadoViaje
    conductor_id?: string
    vehiculo_id?: string
    fecha_desde?: string
    fecha_hasta?: string
}

export interface DespachoStats {
    total: number
    planificacion: number
    confirmado: number
    enRuta: number
    completado: number
    cancelado: number
    pesoTotalKg: number
}

export const DESPACHO_ESTADO_COLORS: Record<DespachoEstadoViaje, string> = {
    PLANIFICACION: '#6B7280',
    CONFIRMADO: '#3B82F6',
    EN_RUTA: '#F59E0B',
    COMPLETADO: '#10B981',
    CANCELADO: '#EF4444',
}

export const DESPACHO_ESTADO_LABELS: Record<DespachoEstadoViaje, string> = {
    PLANIFICACION: 'Planificación',
    CONFIRMADO: 'Confirmado',
    EN_RUTA: 'En Ruta',
    COMPLETADO: 'Completado',
    CANCELADO: 'Cancelado',
}

function formatDespachoCodigoManifiesto(value?: number | null): string {
    if (value === null || value === undefined) return '---'
    return value.toString().padStart(6, '0')
}

const logisticsEndpoint = (path: string) => `${env.api.logisticsUrl}${path}`

function applyFilters(despachos: Despacho[], filters?: DespachoFilters): Despacho[] {
    let result = despachos

    if (filters?.estado_viaje) {
        result = result.filter(d => d.estado_viaje === filters.estado_viaje)
    }

    if (filters?.conductor_id) {
        result = result.filter(d => d.conductor_id === filters.conductor_id)
    }

    if (filters?.vehiculo_id) {
        result = result.filter(d => d.vehiculo_id === filters.vehiculo_id)
    }

    if (filters?.fecha_desde) {
        const desde = new Date(filters.fecha_desde)
        result = result.filter(d => d.fecha_programada && new Date(d.fecha_programada) >= desde)
    }

    if (filters?.fecha_hasta) {
        const hasta = new Date(filters.fecha_hasta)
        result = result.filter(d => d.fecha_programada && new Date(d.fecha_programada) <= hasta)
    }

    return result
}

function sortByCreation(despachos: Despacho[]): Despacho[] {
    return [...despachos].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
}

async function fetchAndFilter(filters?: DespachoFilters): Promise<Despacho[]> {
    const data = await ApiService.get<Despacho[]>(logisticsEndpoint(endpoints.logistics.despachos))
    return sortByCreation(applyFilters(data, filters))
}

async function updateDespacho(id: string, payload: UpdateDespachoDto): Promise<Despacho> {
    return await ApiService.put<Despacho>(logisticsEndpoint(endpoints.logistics.despachoById(id)), payload)
}

const rawService = {
    list: fetchAndFilter,

    getById: async (id: string): Promise<Despacho> => {
        return await ApiService.get<Despacho>(logisticsEndpoint(endpoints.logistics.despachoById(id)))
    },

    create: async (payload: CreateDespachoDto): Promise<Despacho> => {
        return await ApiService.post<Despacho>(logisticsEndpoint(endpoints.logistics.despachos), payload)
    },

    update: updateDespacho,

    delete: async (id: string): Promise<void> => {
        await ApiService.delete<void>(logisticsEndpoint(endpoints.logistics.despachoById(id)))
    },

    cambiarEstado: async (id: string, nuevoEstado: DespachoEstadoViaje): Promise<Despacho> => {
        const update: UpdateDespachoDto = { estado_viaje: nuevoEstado }

        if (nuevoEstado === 'EN_RUTA') {
            update.hora_inicio_real = new Date().toISOString()
        } else if (nuevoEstado === 'COMPLETADO') {
            update.hora_fin_real = new Date().toISOString()
        }

        return await updateDespacho(id, update)
    },

    getEnRuta: async (): Promise<Despacho[]> => {
        return await fetchAndFilter({ estado_viaje: 'EN_RUTA' })
    },

    formatCodigoManifiesto: (codigo?: number | null): string => {
        return formatDespachoCodigoManifiesto(codigo)
    }
}

export const DespachosService = createService('DespachosService', rawService)

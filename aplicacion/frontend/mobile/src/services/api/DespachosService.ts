import { apiRequest } from './client'
import { env } from '../../config/env'
import { endpoints } from './endpoints'
import { logErrorForDebugging } from '../../utils/errorMessages'

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
    // Relaciones populadas (opcional, depende del backend)
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

const logisticsEndpoint = (path: string) => `${env.api.logisticsUrl}${path}`

export const DespachosService = {
    async list(filters?: DespachoFilters): Promise<Despacho[]> {
        try {
            const despachos = await apiRequest<Despacho[]>(
                logisticsEndpoint(endpoints.logistics.despachos)
            )

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

            return result.sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
        } catch (error) {
            logErrorForDebugging(error, 'DespachosService.list', { filters })
            throw error
        }
    },

    async getById(id: string): Promise<Despacho> {
        try {
            return await apiRequest<Despacho>(
                logisticsEndpoint(endpoints.logistics.despachoById(id))
            )
        } catch (error) {
            logErrorForDebugging(error, 'DespachosService.getById', { id })
            throw error
        }
    },

    async create(data: CreateDespachoDto): Promise<Despacho> {
        try {
            return await apiRequest<Despacho>(
                logisticsEndpoint(endpoints.logistics.despachos),
                {
                    method: 'POST',
                    body: JSON.stringify(data)
                }
            )
        } catch (error) {
            logErrorForDebugging(error, 'DespachosService.create', { data })
            throw error
        }
    },

    async update(id: string, data: UpdateDespachoDto): Promise<Despacho> {
        try {
            return await apiRequest<Despacho>(
                logisticsEndpoint(endpoints.logistics.despachoById(id)),
                {
                    method: 'PUT',
                    body: JSON.stringify(data)
                }
            )
        } catch (error) {
            logErrorForDebugging(error, 'DespachosService.update', { id, data })
            throw error
        }
    },

    async delete(id: string): Promise<void> {
        try {
            await apiRequest<void>(
                logisticsEndpoint(endpoints.logistics.despachoById(id)),
                {
                    method: 'DELETE'
                }
            )
        } catch (error) {
            logErrorForDebugging(error, 'DespachosService.delete', { id })
            throw error
        }
    },

    async cambiarEstado(id: string, nuevoEstado: DespachoEstadoViaje): Promise<Despacho> {
        const update: UpdateDespachoDto = { estado_viaje: nuevoEstado }

        if (nuevoEstado === 'EN_RUTA') {
            update.hora_inicio_real = new Date().toISOString()
        } else if (nuevoEstado === 'COMPLETADO') {
            update.hora_fin_real = new Date().toISOString()
        }

        return this.update(id, update)
    },

    async getEnRuta(): Promise<Despacho[]> {
        return this.list({ estado_viaje: 'EN_RUTA' })
    },

    async getStats(): Promise<DespachoStats> {
        try {
            const despachos = await this.list()

            return {
                total: despachos.length,
                planificacion: despachos.filter(d => d.estado_viaje === 'PLANIFICACION').length,
                confirmado: despachos.filter(d => d.estado_viaje === 'CONFIRMADO').length,
                enRuta: despachos.filter(d => d.estado_viaje === 'EN_RUTA').length,
                completado: despachos.filter(d => d.estado_viaje === 'COMPLETADO').length,
                cancelado: despachos.filter(d => d.estado_viaje === 'CANCELADO').length,
                pesoTotalKg: despachos.reduce((sum, d) => sum + (parseFloat(d.peso_total_kg) || 0), 0),
            }
        } catch (error) {
            logErrorForDebugging(error, 'DespachosService.getStats')
            throw error
        }
    },

    getEstadoBadgeColor(estado: DespachoEstadoViaje): string {
        return DESPACHO_ESTADO_COLORS[estado] || '#6B7280'
    },

    getEstadoLabel(estado: DespachoEstadoViaje): string {
        return DESPACHO_ESTADO_LABELS[estado] || estado
    },

    formatCodigoManifiesto(codigo: number | null): string {
        return codigo ? `#${codigo.toString().padStart(4, '0')}` : 'Sin Código'
    },
}

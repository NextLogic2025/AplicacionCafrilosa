import { apiRequest } from './client'
import { env } from '../../config/env'
import { endpoints } from './endpoints'
import { logErrorForDebugging } from '../../utils/errorMessages'

/**
 * Entidad Conductor (Driver)
 */
export interface Conductor {
    id: string
    usuario_id: string | null
    nombre_completo: string
    cedula: string
    telefono: string | null
    licencia: string | null
    activo: boolean
    created_at: string
    updated_at: string
    deleted_at: string | null
}

/**
 * DTO para crear conductor
 */
export interface CreateConductorDto {
    usuario_id?: string
    nombre_completo: string
    cedula: string
    telefono?: string
    licencia?: string
    activo?: boolean
}

/**
 * DTO para actualizar conductor
 */
export type UpdateConductorDto = Partial<CreateConductorDto>

/**
 * Filtros para listar conductores
 */
export interface ConductorFilters {
    activo?: boolean
    search?: string // Busca en nombre y cédula
}

const logisticsEndpoint = (path: string) => `${env.api.logisticsUrl}${path}`

/**
 * Servicio para gestión de conductores (drivers)
 */
export const ConductorService = {
    /**
     * Listar todos los conductores
     */
    async list(filters?: ConductorFilters): Promise<Conductor[]> {
        try {
            const conductores = await apiRequest<Conductor[]>(
                logisticsEndpoint(endpoints.logistics.conductores)
            )

            // Aplicar filtros del lado del cliente
            let result = conductores

            if (filters?.activo !== undefined) {
                result = result.filter(c => c.activo === filters.activo)
            }

            if (filters?.search) {
                const searchLower = filters.search.toLowerCase()
                result = result.filter(c =>
                    c.nombre_completo.toLowerCase().includes(searchLower) ||
                    c.cedula.includes(searchLower)
                )
            }

            return result.sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
        } catch (error) {
            logErrorForDebugging(error, 'ConductorService.list', { filters })
            throw error
        }
    },

    /**
     * Obtener conductor por ID
     */
    async getById(id: string): Promise<Conductor> {
        try {
            return await apiRequest<Conductor>(
                logisticsEndpoint(endpoints.logistics.conductorById(id))
            )
        } catch (error) {
            logErrorForDebugging(error, 'ConductorService.getById', { id })
            throw error
        }
    },

    /**
     * Crear nuevo conductor
     */
    async create(data: CreateConductorDto): Promise<Conductor> {
        try {
            const url = logisticsEndpoint(endpoints.logistics.conductores);
            return await apiRequest<Conductor>(
                url,
                {
                    method: 'POST',
                    body: JSON.stringify(data)
                }
            )
        } catch (error) {
            logErrorForDebugging(error, 'ConductorService.create', { data })
            throw error
        }
    },

    /**
     * Actualizar conductor existente
     */
    async update(id: string, data: UpdateConductorDto): Promise<Conductor> {
        try {
            return await apiRequest<Conductor>(
                logisticsEndpoint(endpoints.logistics.conductorById(id)),
                {
                    method: 'PUT',
                    body: JSON.stringify(data)
                }
            )
        } catch (error) {
            logErrorForDebugging(error, 'ConductorService.update', { id, data })
            throw error
        }
    },

    /**
     * Eliminar conductor (soft delete)
     */
    async delete(id: string): Promise<void> {
        try {
            await apiRequest<void>(
                logisticsEndpoint(endpoints.logistics.conductorById(id)),
                {
                    method: 'DELETE'
                }
            )
        } catch (error) {
            logErrorForDebugging(error, 'ConductorService.delete', { id })
            throw error
        }
    },

    /**
     * Obtener solo conductores activos
     */
    async getActivos(): Promise<Conductor[]> {
        return this.list({ activo: true })
    },

    /**
     * Obtener conductores disponibles (activos sin usuario vinculado)
     */
    async getDisponibles(): Promise<Conductor[]> {
        const conductores = await this.getActivos()
        return conductores.filter(c => !c.usuario_id)
    },

    /**
     * Obtener estadísticas de conductores
     */
    async getStats(): Promise<{
        total: number
        activos: number
        inactivos: number
        conLicencia: number
        sinLicencia: number
        vinculados: number
    }> {
        try {
            const conductores = await this.list()

            return {
                total: conductores.length,
                activos: conductores.filter(c => c.activo).length,
                inactivos: conductores.filter(c => !c.activo).length,
                conLicencia: conductores.filter(c => c.licencia).length,
                sinLicencia: conductores.filter(c => !c.licencia).length,
                vinculados: conductores.filter(c => c.usuario_id).length
            }
        } catch (error) {
            logErrorForDebugging(error, 'ConductorService.getStats')
            throw error
        }
    },

    /**
     * Obtener iniciales del nombre para avatar
     */
    getInitials(nombreCompleto: string): string {
        const parts = nombreCompleto.trim().split(' ')
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase()
        }
        return nombreCompleto.substring(0, 2).toUpperCase()
    }
}

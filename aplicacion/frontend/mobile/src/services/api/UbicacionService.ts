import { apiRequest } from './client'
import { env } from '../../config/env'
import { endpoints } from './endpoints'
import { logErrorForDebugging } from '../../utils/errorMessages'

export type UbicacionPayload = {
    almacenId: number
    codigoVisual: string
    tipo?: string
    capacidadMaxKg?: number
    esCuarentena?: boolean
}

export type Ubicacion = {
    id: string
    almacenId: number
    codigoVisual: string
    tipo: string
    capacidadMaxKg?: number | null
    esCuarentena: boolean
    createdAt?: string
    updatedAt?: string
    almacen?: { id: number; nombre: string }
}

function warehouse(path: string) {
    return `${env.api.warehouseUrl}${path}`
}

export const UbicacionService = {
    async list(almacenId?: number): Promise<Ubicacion[]> {
        try {
            const qs = almacenId ? `?almacen_id=${almacenId}` : ''
            return await apiRequest<Ubicacion[]>(warehouse(endpoints.warehouse.ubicaciones + qs))
        } catch (error) {
            logErrorForDebugging(error, 'UbicacionService.list', { almacenId })
            throw error
        }
    },

    async getById(id: string): Promise<Ubicacion> {
        try {
            return await apiRequest<Ubicacion>(warehouse(endpoints.warehouse.ubicacionById(id)))
        } catch (error) {
            logErrorForDebugging(error, 'UbicacionService.getById', { id })
            throw error
        }
    },

    async create(payload: UbicacionPayload): Promise<Ubicacion> {
        try {
            return await apiRequest<Ubicacion>(warehouse(endpoints.warehouse.ubicaciones), {
                method: 'POST',
                body: JSON.stringify(payload),
            })
        } catch (error) {
            logErrorForDebugging(error, 'UbicacionService.create', { payload })
            throw error
        }
    },

    async update(id: string, payload: Partial<UbicacionPayload>): Promise<Ubicacion> {
        try {
            return await apiRequest<Ubicacion>(warehouse(endpoints.warehouse.ubicacionById(id)), {
                method: 'PUT',
                body: JSON.stringify(payload),
            })
        } catch (error) {
            logErrorForDebugging(error, 'UbicacionService.update', { id, payload })
            throw error
        }
    },

    async remove(id: string): Promise<void> {
        try {
            await apiRequest<void>(warehouse(endpoints.warehouse.ubicacionById(id)), { method: 'DELETE' })
        } catch (error) {
            logErrorForDebugging(error, 'UbicacionService.remove', { id })
            throw error
        }
    },
}

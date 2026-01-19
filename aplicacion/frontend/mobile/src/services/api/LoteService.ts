import { apiRequest } from './client'
import { env } from '../../config/env'
import { endpoints } from './endpoints'
import { logErrorForDebugging } from '../../utils/errorMessages'

export type LotePayload = {
    productoId: string
    numeroLote: string
    fechaFabricacion: string
    fechaVencimiento: string
    estadoCalidad?: string
}

export type Lote = {
    id: string
    productoId: string
    numeroLote: string
    fechaFabricacion: string
    fechaVencimiento: string
    estadoCalidad: string
    createdAt?: string
    updatedAt?: string
}

const warehouse = (path: string) => `${env.api.warehouseUrl}${path}`

export const LoteService = {
    async list(productoId?: string): Promise<Lote[]> {
        try {
            const qs = productoId ? `?producto_id=${productoId}` : ''
            return await apiRequest<Lote[]>(warehouse(endpoints.warehouse.lotes + qs))
        } catch (error) {
            logErrorForDebugging(error, 'LoteService.list', { productoId })
            throw error
        }
    },

    async getById(id: string): Promise<Lote> {
        try {
            return await apiRequest<Lote>(warehouse(endpoints.warehouse.loteById(id)))
        } catch (error) {
            logErrorForDebugging(error, 'LoteService.getById', { id })
            throw error
        }
    },

    async create(payload: LotePayload): Promise<Lote> {
        try {
            return await apiRequest<Lote>(warehouse(endpoints.warehouse.lotes), {
                method: 'POST',
                body: JSON.stringify(payload),
            })
        } catch (error) {
            logErrorForDebugging(error, 'LoteService.create', { payload })
            throw error
        }
    },

    async update(id: string, payload: Partial<LotePayload>): Promise<Lote> {
        try {
            return await apiRequest<Lote>(warehouse(endpoints.warehouse.loteById(id)), {
                method: 'PUT',
                body: JSON.stringify(payload),
            })
        } catch (error) {
            logErrorForDebugging(error, 'LoteService.update', { id, payload })
            throw error
        }
    },

    async remove(id: string): Promise<void> {
        try {
            await apiRequest<void>(warehouse(endpoints.warehouse.loteById(id)), { method: 'DELETE' })
        } catch (error) {
            logErrorForDebugging(error, 'LoteService.remove', { id })
            throw error
        }
    },
}

import { ApiService } from './ApiService'
import { createService } from './createService'
import { env } from '../../config/env'
import { endpoints } from './endpoints'

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

const rawService = {
    async list(productoId?: string): Promise<Lote[]> {
        const qs = productoId ? `?producto_id=${productoId}` : ''
        return ApiService.get<Lote[]>(warehouse(endpoints.warehouse.lotes + qs))
    },

    async getById(id: string): Promise<Lote> {
        return ApiService.get<Lote>(warehouse(endpoints.warehouse.loteById(id)))
    },

    async create(payload: LotePayload): Promise<Lote> {
        return ApiService.post<Lote>(warehouse(endpoints.warehouse.lotes), payload)
    },

    async update(id: string, payload: Partial<LotePayload>): Promise<Lote> {
        return ApiService.put<Lote>(warehouse(endpoints.warehouse.loteById(id)), payload)
    },

    async remove(id: string): Promise<void> {
        return ApiService.delete<void>(warehouse(endpoints.warehouse.loteById(id)))
    }
}

export const LoteService = createService('LoteService', rawService)

import { apiRequest } from './client'
import { env } from '../../config/env'
import { endpoints } from './endpoints'
import { logErrorForDebugging } from '../../utils/errorMessages'

export type PickingEstado = 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO' | string

export type PickingItem = {
    id: string
    productoId: string
    nombreProducto?: string
    cantidadSolicitada: number
    cantidadPickeada?: number
    loteSugerido?: string | null
}

export type Picking = {
    id: string
    pedidoId?: string
    estado: PickingEstado
    bodegueroId?: string | null
    items?: PickingItem[]
    createdAt?: string
    updatedAt?: string
}

export type CreatePickingPayload = {
    pedidoId: string
    items: Array<{ productoId: string; cantidadSolicitada: number }>
}

const warehouse = (path: string) => `${env.api.warehouseUrl}${path}`

export const PickingService = {
    async list(estado?: string): Promise<Picking[]> {
        try {
            const qs = estado ? `?estado=${estado}` : ''
            return await apiRequest<Picking[]>(warehouse(endpoints.warehouse.picking + qs))
        } catch (error) {
            logErrorForDebugging(error, 'PickingService.list', { estado })
            throw error
        }
    },

    async listMine(): Promise<Picking[]> {
        try {
            return await apiRequest<Picking[]>(warehouse(endpoints.warehouse.pickingMis))
        } catch (error) {
            logErrorForDebugging(error, 'PickingService.listMine')
            throw error
        }
    },

    async getById(id: string): Promise<Picking> {
        try {
            return await apiRequest<Picking>(warehouse(endpoints.warehouse.pickingById(id)))
        } catch (error) {
            logErrorForDebugging(error, 'PickingService.getById', { id })
            throw error
        }
    },

    async create(payload: CreatePickingPayload): Promise<Picking> {
        try {
            return await apiRequest<Picking>(warehouse(endpoints.warehouse.picking), {
                method: 'POST',
                body: JSON.stringify(payload),
            })
        } catch (error) {
            logErrorForDebugging(error, 'PickingService.create', { payload })
            throw error
        }
    },

    async assign(id: string, bodegueroId: string): Promise<Picking> {
        try {
            return await apiRequest<Picking>(warehouse(endpoints.warehouse.pickingAssign(id)), {
                method: 'PUT',
                body: JSON.stringify({ bodegueroId }),
            })
        } catch (error) {
            logErrorForDebugging(error, 'PickingService.assign', { id, bodegueroId })
            throw error
        }
    },

    async confirmReservation(pedidoId: string | null, reservationId: string): Promise<Picking> {
        try {
            return await apiRequest<Picking>(warehouse(endpoints.warehouse.pickingConfirm), {
                method: 'POST',
                body: JSON.stringify({ pedidoId, reservation_id: reservationId }),
            })
        } catch (error) {
            logErrorForDebugging(error, 'PickingService.confirmReservation', { pedidoId, reservationId })
            throw error
        }
    },

    async start(id: string): Promise<Picking> {
        try {
            return await apiRequest<Picking>(warehouse(endpoints.warehouse.pickingStart(id)), { method: 'POST' })
        } catch (error) {
            logErrorForDebugging(error, 'PickingService.start', { id })
            throw error
        }
    },

    async complete(id: string): Promise<Picking> {
        try {
            return await apiRequest<Picking>(warehouse(endpoints.warehouse.pickingComplete(id)), { method: 'POST' })
        } catch (error) {
            logErrorForDebugging(error, 'PickingService.complete', { id })
            throw error
        }
    },

    async pickItem(id: string, itemId: string, cantidadPickeada: number, loteConfirmado?: string): Promise<Picking> {
        try {
            return await apiRequest<Picking>(warehouse(endpoints.warehouse.pickingPickItem(id, itemId)), {
                method: 'POST',
                body: JSON.stringify({ cantidadPickeada, loteConfirmado }),
            })
        } catch (error) {
            logErrorForDebugging(error, 'PickingService.pickItem', { id, itemId, cantidadPickeada, loteConfirmado })
            throw error
        }
    },
}

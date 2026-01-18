import { apiRequest } from './client'
import { env } from '../../config/env'
import { endpoints } from './endpoints'
import { logErrorForDebugging } from '../../utils/errorMessages'

export type ReservationItem = {
    id?: string
    productId: string
    sku?: string | null
    quantity: number
    stockUbicacionId?: string
}

export type Reservation = {
    id: string
    tempId?: string | null
    status: 'ACTIVE' | 'CONFIRMED' | 'CANCELLED'
    items?: ReservationItem[]
    createdAt?: string
    updatedAt?: string
}

export type CreateReservationPayload = {
    tempId?: string
    items: Array<{ productId: string; sku?: string | null; quantity: number }>
}

const warehouse = (path: string) => `${env.api.warehouseUrl}${path}`

export const ReservationService = {
    async list(): Promise<Reservation[]> {
        try {
            return await apiRequest<Reservation[]>(warehouse(endpoints.warehouse.reservations))
        } catch (error) {
            logErrorForDebugging(error, 'ReservationService.list')
            throw error
        }
    },

    async create(payload: CreateReservationPayload): Promise<{ id: string }> {
        try {
            return await apiRequest<{ id: string }>(warehouse(endpoints.warehouse.reservations), {
                method: 'POST',
                body: JSON.stringify(payload),
            })
        } catch (error) {
            logErrorForDebugging(error, 'ReservationService.create', { payload })
            throw error
        }
    },

    async cancel(id: string): Promise<void> {
        try {
            await apiRequest<void>(warehouse(endpoints.warehouse.reservationById(id)), { method: 'DELETE' })
        } catch (error) {
            logErrorForDebugging(error, 'ReservationService.cancel', { id })
            throw error
        }
    },

    async confirm(id: string, pedidoId?: string): Promise<void> {
        try {
            await apiRequest<void>(warehouse(endpoints.warehouse.reservationConfirm(id)), {
                method: 'POST',
                body: JSON.stringify(pedidoId ? { pedido_id: pedidoId } : {}),
            })
        } catch (error) {
            logErrorForDebugging(error, 'ReservationService.confirm', { id, pedidoId })
            throw error
        }
    },
}

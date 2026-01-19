import { apiRequest } from './client'
import { env } from '../../config/env'
import { endpoints } from './endpoints'
import { logErrorForDebugging } from '../../utils/errorMessages'

export type ReservationStatus = 'ACTIVE' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | string

// Item de reserva con campos enriquecidos del backend
export type ReservationItem = {
    id?: string | number
    productId: string
    sku?: string | null
    quantity: number
    stockUbicacionId?: string
    // Campos enriquecidos
    nombreProducto?: string
    descripcion?: string
    unidad?: string
    ubicacionCodigo?: string
    ubicacionNombre?: string
    loteNumero?: string
    cantidadDisponible?: number
    cantidadReservada?: number
}

// Información del pedido enriquecida
export type PedidoReservationInfo = {
    numero?: string | number
    clienteNombre?: string
    referenciaComercial?: string
}

// Reserva con campos enriquecidos del backend
export type Reservation = {
    id: string
    tempId?: string | null
    status: ReservationStatus
    createdAt?: string
    updatedAt?: string
    // Campos enriquecidos
    pedido?: PedidoReservationInfo
    items?: ReservationItem[]
}

export type CreateReservationPayload = {
    tempId?: string
    items: Array<{ productId: string; sku?: string | null; quantity: number }>
}

const warehouse = (path: string) => `${env.api.warehouseUrl}${path}`

export const ReservationService = {
    async list(status?: ReservationStatus): Promise<Reservation[]> {
        try {
            const qs = status ? `?status=${encodeURIComponent(status)}` : ''
            return await apiRequest<Reservation[]>(warehouse(endpoints.warehouse.reservations + qs))
        } catch (error) {
            logErrorForDebugging(error, 'ReservationService.list', { status })
            throw error
        }
    },

    async getById(id: string): Promise<Reservation> {
        try {
            return await apiRequest<Reservation>(warehouse(endpoints.warehouse.reservationById(id)))
        } catch (error) {
            logErrorForDebugging(error, 'ReservationService.getById', { id })
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

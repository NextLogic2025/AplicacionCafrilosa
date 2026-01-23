import { httpWarehouse } from '../../../services/api/http'

export interface Reservation {
    id: string
    tempId?: string
    status: 'ACTIVE' | 'CANCELLED' | 'CONFIRMED'
    createdAt: string
    items: ReservationItem[]
}

export interface ReservationItem {
    id: string
    productoId: string
    productoNombre?: string
    cantidad: number
    loteId?: string
    ubicacionId?: string
}

export const reservationsApi = {
    async getAll(status?: string): Promise<Reservation[]> {
        const url = status ? `/api/reservations?status=${status}` : '/api/reservations'
        return httpWarehouse<Reservation[]>(url)
    },

    async getById(id: string): Promise<Reservation> {
        return httpWarehouse<Reservation>(`/api/reservations/${id}`)
    },

    async cancel(id: string): Promise<void> {
        return httpWarehouse(`/api/reservations/${id}`, {
            method: 'DELETE',
        })
    },

    async confirm(id: string, pedidoId: string): Promise<void> {
        return httpWarehouse(`/api/reservations/${id}/confirm`, {
            method: 'POST',
            body: JSON.stringify({ pedidoId }),
        })
    },
}

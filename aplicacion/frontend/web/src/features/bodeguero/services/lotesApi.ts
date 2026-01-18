import { httpWarehouse } from '../../../services/api/http'

export interface Lote {
    id: string
    productoId: string
    numeroLote: string
    fechaFabricacion: string
    fechaVencimiento: string
    estadoCalidad: string // 'LIBERADO' | 'CUARENTENA' | 'RECHAZADO'
    createdAt: string
    updatedAt: string
}

export interface CreateLoteDto {
    productoId: string
    numeroLote: string
    fechaFabricacion: string // YYYY-MM-DD
    fechaVencimiento: string // YYYY-MM-DD
    estadoCalidad?: string
}

export interface UpdateLoteDto {
    fechaVencimiento?: string
    estadoCalidad?: string
}

export const lotesApi = {
    getAll: async (productoId?: string): Promise<Lote[]> => {
        const params = productoId ? `?producto_id=${productoId}` : ''
        return httpWarehouse<Lote[]>(`/lotes${params}`)
    },

    getById: async (id: string): Promise<Lote> => {
        return httpWarehouse<Lote>(`/lotes/${id}`)
    },

    create: async (data: CreateLoteDto): Promise<Lote> => {
        return httpWarehouse<Lote>('/lotes', {
            method: 'POST',
            body: data,
        })
    },

    update: async (id: string, data: UpdateLoteDto): Promise<Lote> => {
        return httpWarehouse<Lote>(`/lotes/${id}`, {
            method: 'PUT',
            body: data,
        })
    },

    delete: async (id: string): Promise<void> => {
        return httpWarehouse(`/lotes/${id}`, {
            method: 'DELETE',
        })
    },
}

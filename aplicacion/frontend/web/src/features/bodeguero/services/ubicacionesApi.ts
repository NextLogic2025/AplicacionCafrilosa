import { httpWarehouse } from '../../../services/api/http'

export interface Ubicacion {
    id: string
    almacenId: number
    codigoVisual: string
    tipo: string
    capacidadMaxKg: number
    esCuarentena: boolean
    createdAt?: string
    updatedAt?: string
    almacen?: {
        id: number
        nombre: string
    }
}

export interface CreateUbicacionDto {
    almacenId: number
    codigoVisual: string
    tipo?: string
    capacidadMaxKg?: number
    esCuarentena?: boolean
}

export interface UpdateUbicacionDto {
    codigoVisual?: string
    tipo?: string
    capacidadMaxKg?: number
    esCuarentena?: boolean
}

export const ubicacionesApi = {
    getAll: async (almacenId?: number): Promise<Ubicacion[]> => {
        const query = almacenId ? `?almacen_id=${almacenId}` : ''
        return httpWarehouse<Ubicacion[]>(`/ubicaciones${query}`)
    },

    getById: async (id: string): Promise<Ubicacion> => {
        return httpWarehouse<Ubicacion>(`/ubicaciones/${id}`)
    },

    getByAlmacen: async (almacenId: number): Promise<Ubicacion[]> => {
        // Keeping for compatibility but getAll matches controller logic
        return httpWarehouse<Ubicacion[]>(`/ubicaciones?almacen_id=${almacenId}`)
    },

    create: async (data: CreateUbicacionDto): Promise<Ubicacion> => {
        return httpWarehouse<Ubicacion>('/ubicaciones', {
            method: 'POST',
            body: data,
        })
    },

    update: async (id: string, data: UpdateUbicacionDto): Promise<Ubicacion> => {
        return httpWarehouse<Ubicacion>(`/ubicaciones/${id}`, {
            method: 'PUT',
            body: data,
        })
    },

    delete: async (id: string): Promise<void> => {
        return httpWarehouse(`/ubicaciones/${id}`, {
            method: 'DELETE',
        })
    },
}

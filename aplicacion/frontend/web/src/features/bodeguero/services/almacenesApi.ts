import { httpWarehouse } from '../../../services/api/http'

export interface Almacen {
    id: number
    nombre: string
    codigoRef?: string
    requiereFrio: boolean
    direccionFisica?: string
    activo: boolean
    createdAt: string
    updatedAt: string
}

export type CreateAlmacenDto = Omit<Almacen, 'id' | 'createdAt' | 'updatedAt' | 'activo'>
export type UpdateAlmacenDto = Partial<Omit<Almacen, 'id' | 'createdAt' | 'updatedAt'>>

export const almacenesApi = {
    getAll: async (): Promise<Almacen[]> => {
        return httpWarehouse<Almacen[]>('/almacenes')
    },

    getById: async (id: number): Promise<Almacen> => {
        return httpWarehouse<Almacen>(`/almacenes/${id}`)
    },

    create: async (data: CreateAlmacenDto): Promise<Almacen> => {
        return httpWarehouse<Almacen>('/almacenes', {
            method: 'POST',
            body: data,
        })
    },

    update: async (id: number, data: UpdateAlmacenDto): Promise<Almacen> => {
        return httpWarehouse<Almacen>(`/almacenes/${id}`, {
            method: 'PUT',
            body: data,
        })
    },

    delete: async (id: number): Promise<void> => {
        return httpWarehouse(`/almacenes/${id}`, {
            method: 'DELETE',
        })
    },
}

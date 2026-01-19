import { apiRequest } from './client'
import { env } from '../../config/env'
import { logErrorForDebugging } from '../../utils/errorMessages'
import { endpoints } from './endpoints'

export type AlmacenPayload = {
    nombre: string
    codigoRef?: string
    requiereFrio?: boolean
    direccionFisica?: string
    activo?: boolean
}

export type Almacen = {
    id: number
    nombre: string
    codigoRef?: string | null
    requiereFrio: boolean
    direccionFisica?: string | null
    activo: boolean
    createdAt?: string
    updatedAt?: string
}

function warehouseEndpoint(path: string) {
    return `${env.api.warehouseUrl}${path}`
}

export const AlmacenService = {
    async list(): Promise<Almacen[]> {
        try {
            return await apiRequest<Almacen[]>(warehouseEndpoint(endpoints.warehouse.almacenes))
        } catch (error) {
            logErrorForDebugging(error, 'AlmacenService.list')
            throw error
        }
    },

    async getById(id: number): Promise<Almacen> {
        try {
            return await apiRequest<Almacen>(warehouseEndpoint(endpoints.warehouse.almacenById(id)))
        } catch (error) {
            logErrorForDebugging(error, 'AlmacenService.getById', { id })
            throw error
        }
    },

    async create(payload: AlmacenPayload): Promise<Almacen> {
        try {
            return await apiRequest<Almacen>(warehouseEndpoint(endpoints.warehouse.almacenes), {
                method: 'POST',
                body: JSON.stringify(payload)
            })
        } catch (error) {
            logErrorForDebugging(error, 'AlmacenService.create', { payload })
            throw error
        }
    },

    async update(id: number, payload: Partial<AlmacenPayload>): Promise<Almacen> {
        try {
            return await apiRequest<Almacen>(warehouseEndpoint(endpoints.warehouse.almacenById(id)), {
                method: 'PUT',
                body: JSON.stringify(payload)
            })
        } catch (error) {
            logErrorForDebugging(error, 'AlmacenService.update', { id, payload })
            throw error
        }
    },

    async remove(id: number): Promise<void> {
        try {
            await apiRequest<void>(warehouseEndpoint(endpoints.warehouse.almacenById(id)), { method: 'DELETE' })
        } catch (error) {
            logErrorForDebugging(error, 'AlmacenService.remove', { id })
            throw error
        }
    }
}

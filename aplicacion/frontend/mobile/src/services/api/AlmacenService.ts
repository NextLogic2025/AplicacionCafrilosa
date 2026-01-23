import { ApiService } from './ApiService'
import { env } from '../../config/env'
import { endpoints } from './endpoints'
import { createService } from './createService'

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

const rawService = {
    async list(): Promise<Almacen[]> {
        return await ApiService.get<Almacen[]>(warehouseEndpoint(endpoints.warehouse.almacenes))
    },

    async getById(id: number): Promise<Almacen> {
        return await ApiService.get<Almacen>(warehouseEndpoint(endpoints.warehouse.almacenById(id)))
    },

    async create(payload: AlmacenPayload): Promise<Almacen> {
        return await ApiService.post<Almacen>(warehouseEndpoint(endpoints.warehouse.almacenes), payload)
    },

    async update(id: number, payload: Partial<AlmacenPayload>): Promise<Almacen> {
        return await ApiService.put<Almacen>(warehouseEndpoint(endpoints.warehouse.almacenById(id)), payload)
    },

    async remove(id: number): Promise<void> {
        await ApiService.delete<void>(warehouseEndpoint(endpoints.warehouse.almacenById(id)))
    }
}

export const AlmacenService = createService('AlmacenService', rawService)

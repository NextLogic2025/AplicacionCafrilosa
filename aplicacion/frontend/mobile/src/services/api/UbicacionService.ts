import { ApiService } from './ApiService'
import { createService } from './createService'
import { env } from '../../config/env'
import { endpoints } from './endpoints'
import { logErrorForDebugging } from '../../utils/errorMessages'

export type UbicacionPayload = {
    almacenId: number
    codigoVisual: string
    tipo?: string
    capacidadMaxKg?: number
    esCuarentena?: boolean
}

export type Ubicacion = {
    id: string
    almacenId: number
    codigoVisual: string
    tipo: string
    capacidadMaxKg?: number | null
    esCuarentena: boolean
    createdAt?: string
    updatedAt?: string
    almacen?: { id: number; nombre: string }
}

const warehouse = (path: string) => `${env.api.warehouseUrl}${path}`

const rawService = {
    async list(almacenId?: number): Promise<Ubicacion[]> {
        const qs = almacenId ? `?almacen_id=${almacenId}` : ''
        return ApiService.get<Ubicacion[]>(warehouse(endpoints.warehouse.ubicaciones + qs))
    },

    async getById(id: string): Promise<Ubicacion> {
        return ApiService.get<Ubicacion>(warehouse(endpoints.warehouse.ubicacionById(id)))
    },

    async create(payload: UbicacionPayload): Promise<Ubicacion> {
        return ApiService.post<Ubicacion>(warehouse(endpoints.warehouse.ubicaciones), payload)
    },

    async update(id: string, payload: Partial<UbicacionPayload>): Promise<Ubicacion> {
        return ApiService.put<Ubicacion>(warehouse(endpoints.warehouse.ubicacionById(id)), payload)
    },

    async remove(id: string): Promise<void> {
        return ApiService.delete<void>(warehouse(endpoints.warehouse.ubicacionById(id)))
    }
}

export const UbicacionService = createService('UbicacionService', rawService)

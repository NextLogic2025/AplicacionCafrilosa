import { ApiService } from './ApiService'
import { createService } from './createService'
import { endpoints } from './endpoints'

export interface Sucursal {
    id: string
    cliente_id: string
    nombre_sucursal: string
    direccion_entrega?: string
    ubicacion_gps?: {
        type: 'Point'
        coordinates: [number, number]
    } | null
    contacto_nombre?: string
    contacto_telefono?: string
    zona_id?: number
    activo: boolean
}

export interface CreateSucursalPayload {
    nombre_sucursal: string
    direccion_entrega?: string
    ubicacion_gps?: any
    contacto_nombre?: string
    contacto_telefono?: string
    zona_id?: number
    cliente_id?: string
}

export interface UpdateSucursalPayload {
    nombre_sucursal?: string
    direccion_entrega?: string
    ubicacion_gps?: any
    contacto_nombre?: string
    contacto_telefono?: string
    zona_id?: number
    activo?: boolean
}

const rawService = {
    getSucursalesByClient: async (clienteId: string): Promise<Sucursal[]> => {
        return ApiService.get<Sucursal[]>(endpoints.catalog.sucursalesByClienteId(clienteId))
    },

    createSucursal: async (clienteId: string, data: CreateSucursalPayload): Promise<Sucursal> => {
        return ApiService.post<Sucursal>(endpoints.catalog.sucursalesByClienteId(clienteId), {
            ...data,
            cliente_id: clienteId
        })
    },

    updateSucursal: async (id: string, data: UpdateSucursalPayload): Promise<Sucursal> => {
        return ApiService.put<Sucursal>(endpoints.catalog.sucursalById(id), data)
    },

    deleteSucursal: async (id: string): Promise<void> => {
        return ApiService.delete<void>(endpoints.catalog.sucursalById(id))
    }
}

export const SucursalService = createService('SucursalService', rawService)

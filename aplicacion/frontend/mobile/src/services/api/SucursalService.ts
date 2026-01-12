
import { apiRequest } from './client'

export interface Sucursal {
    id: string
    cliente_id: string
    nombre_sucursal: string
    direccion_entrega?: string
    ubicacion_gps?: {
        type: 'Point'
        coordinates: [number, number] // [lng, lat]
    } | null
    contacto_nombre?: string
    contacto_telefono?: string
    zona_id?: number  // Zona comercial de la sucursal
    activo: boolean
}

export interface CreateSucursalPayload {
    nombre_sucursal: string
    direccion_entrega?: string
    ubicacion_gps?: any
    contacto_nombre?: string
    contacto_telefono?: string
    zona_id?: number  // Zona comercial de la sucursal (diferente a la del cliente)
    cliente_id?: string // Added to satisfy backend DTO
}

export interface UpdateSucursalPayload {
    nombre_sucursal?: string
    direccion_entrega?: string
    ubicacion_gps?: any
    contacto_nombre?: string
    contacto_telefono?: string
    zona_id?: number  // Zona comercial de la sucursal
    activo?: boolean
}

export const SucursalService = {
    // List by Client
    getSucursalesByClient: async (clienteId: string): Promise<Sucursal[]> => {
        return apiRequest<Sucursal[]>(`/api/clientes/${clienteId}/sucursales`)
    },

    // Create for Client
    createSucursal: async (clienteId: string, data: CreateSucursalPayload): Promise<Sucursal> => {
        return apiRequest<Sucursal>(`/api/clientes/${clienteId}/sucursales`, {
            method: 'POST',
            body: JSON.stringify({ ...data, cliente_id: clienteId })
        })
    },

    // Update
    updateSucursal: async (id: string, data: UpdateSucursalPayload): Promise<Sucursal> => {
        return apiRequest<Sucursal>(`/api/sucursales/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        })
    },

    // Delete (Soft)
    deleteSucursal: async (id: string): Promise<void> => {
        return apiRequest<void>(`/api/sucursales/${id}`, {
            method: 'DELETE'
        })
    }
}

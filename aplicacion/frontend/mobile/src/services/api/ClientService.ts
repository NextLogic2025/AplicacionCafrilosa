import { env } from '../../config/env'
import { apiRequest } from './client'

export interface Client {
    id: string
    usuario_principal_id?: string
    identificacion: string
    tipo_identificacion: 'RUC' | 'CEDULA' | 'PASAPORTE'
    razon_social: string
    nombre_comercial?: string | null
    lista_precios_id: number | null
    zona_comercial_id?: number | null
    tiene_credito: boolean
    limite_credito: string  // Decimal de PostgreSQL devuelto como string
    saldo_actual: string    // Decimal de PostgreSQL devuelto como string
    dias_plazo: number
    bloqueado: boolean
    direccion_texto?: string | null
    ubicacion_gps?: {
        type: 'Point'
        coordinates: [number, number]
    } | null
    vendedor_asignado_id?: string | null
    created_at?: string
    updated_at?: string
    deleted_at?: string | null
    // Campos enriquecidos por el backend
    usuario_principal_nombre?: string | null
    vendedor_nombre?: string | null
    zona_comercial_nombre?: string | null
}

export interface PriceList {
    id: number
    nombre: string
    activa: boolean
    moneda: string
}

export interface CommercialZone {
    id: number
    codigo: string
    nombre: string
    ciudad?: string
    macrorregion?: string
    activo: boolean
    poligono?: {
        type: 'Polygon' | 'MultiPolygon'
        coordinates: any[]
    }
}

// Interfaz para Sucursales del Cliente
export interface ClientBranch {
    id: string
    cliente_id: string
    nombre_sucursal: string
    direccion_entrega: string
    zona_id?: number  // Zona de la sucursal (puede ser diferente a la zona del cliente)
    ubicacion_gps?: {
        type: 'Point'
        coordinates: [number, number] // [lng, lat]
    } | null
    contacto_nombre?: string
    contacto_telefono?: string
    activo: boolean
    created_at?: string
    updated_at?: string
}

export interface CreateClientPayload {
    usuario_principal_id: string
    identificacion: string
    tipo_identificacion: string
    razon_social: string
    nombre_comercial: string
    lista_precios_id: number
    direccion_texto: string
    zona_comercial_id?: number
    vendedor_asignado_id?: string | null
    tiene_credito?: boolean
    limite_credito?: number
    dias_plazo?: number
}

export const ClientService = {
    getClients: async (): Promise<Client[]> => {
        return apiRequest<Client[]>('/api/clientes')
    },

    getClient: async (id: string): Promise<Client> => {
        return apiRequest<Client>(`/api/clientes/${id}`)
    },

    createClient: async (client: CreateClientPayload): Promise<Client> => {
        return apiRequest<Client>('/api/clientes', {
            method: 'POST',
            body: JSON.stringify(client)
        })
    },

    updateClient: async (id: string, client: Partial<Client>): Promise<Client> => {
        return apiRequest<Client>(`/api/clientes/${id}`, {
            method: 'PUT',
            body: JSON.stringify(client)
        })
    },

    deleteClient: async (id: string): Promise<void> => {
        return apiRequest<void>(`/api/clientes/${id}`, {
            method: 'DELETE'
        })
    },

    unblockClient: async (id: string): Promise<void> => {
        return apiRequest<void>(`/api/clientes/${id}/desbloquear`, {
            method: 'PUT'
        })
    },

    getBlockedClients: async (): Promise<Client[]> => {
        return apiRequest<Client[]>('/api/clientes/bloqueados')
    },

    getMyClientData: async (): Promise<Client | null> => {
        try {
            // For 'cliente' role, the backend automatically searches by usuario_principal_id
            // when using GET /api/clientes/:id. Using 'me' as a placeholder ID.
            // The controller intercepts cliente role and fetches by authenticated user's ID.
            return await apiRequest<Client>('/api/clientes/me')
        } catch (error: any) {
            console.error('Error fetching client data:', error)
            return null
        }
    },

    /**
     * Obtiene los clientes asignados al vendedor autenticado
     * 
     * Endpoint: GET /api/clientes/mis
     * Roles permitidos: vendedor, admin, supervisor
     */
    getMyClients: async (): Promise<Client[]> => {
        try {
            return await apiRequest<Client[]>(`${env.api.catalogUrl}/api/clientes/mis`)
        } catch (error) {
            console.error('Error fetching my clients:', error)
            return []
        }
    },

    getPriceLists: async (): Promise<PriceList[]> => {
        try {
            return await apiRequest<PriceList[]>(`${env.api.catalogUrl}/api/precios/listas`)
        } catch (error) {
            console.error('Error fetching price lists:', error)
            return []
        }
    },

    getCommercialZones: async (silent = false): Promise<CommercialZone[]> => {
        try {
            return await apiRequest<CommercialZone[]>(`${env.api.catalogUrl}/api/zonas`, { silent })
        } catch (error) {
            if (!silent) console.error('Error fetching commercial zones:', error)
            return []
        }
    },

    getCommercialZoneById: async (id: number, silent = false): Promise<CommercialZone | null> => {
        try {
            return await apiRequest<CommercialZone>(`${env.api.catalogUrl}/api/zonas/${id}`, { silent })
        } catch (error) {
            if (!silent) console.error(`Error fetching commercial zone ${id}:`, error)
            return null
        }
    },

    /**
     * Obtiene las sucursales activas de un cliente
     *
     * Endpoint: GET /api/clientes/:clienteId/sucursales
     * Roles permitidos: admin, supervisor, cliente, vendedor
     */
    getClientBranches: async (clientId: string): Promise<ClientBranch[]> => {
        try {
            return await apiRequest<ClientBranch[]>(`${env.api.catalogUrl}/api/clientes/${clientId}/sucursales`)
        } catch (error) {
            console.error('Error fetching client branches:', error)
            return []
        }
    },

    createClientBranch: async (clientId: string, branch: Partial<ClientBranch>): Promise<ClientBranch> => {
        return apiRequest<ClientBranch>(`${env.api.catalogUrl}/api/clientes/${clientId}/sucursales`, {
            method: 'POST',
            body: JSON.stringify(branch)
        })
    }
}

import { apiRequest } from './client'
import { endpoints } from './endpoints'

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
    limite_credito: string
    saldo_actual: string
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
    poligono_geografico?: {
        type: 'Polygon' | 'MultiPolygon'
        coordinates: any[]
    }
}

export interface ClientBranch {
    id: string
    cliente_id: string
    nombre_sucursal: string
    direccion_entrega: string
    zona_id?: number
    ubicacion_gps?: {
        type: 'Point'
        coordinates: [number, number]
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
        return apiRequest<Client[]>(endpoints.catalog.clientes)
    },

    getClient: async (id: string): Promise<Client> => {
        return apiRequest<Client>(endpoints.catalog.clienteById(id))
    },

    createClient: async (client: CreateClientPayload): Promise<Client> => {
        return apiRequest<Client>(endpoints.catalog.clientes, {
            method: 'POST',
            body: JSON.stringify(client)
        })
    },

    updateClient: async (id: string, client: Partial<Client>): Promise<Client> => {
        return apiRequest<Client>(endpoints.catalog.clienteById(id), {
            method: 'PUT',
            body: JSON.stringify(client)
        })
    },

    deleteClient: async (id: string): Promise<void> => {
        return apiRequest<void>(endpoints.catalog.clienteById(id), {
            method: 'DELETE'
        })
    },

    unblockClient: async (id: string): Promise<void> => {
        return apiRequest<void>(endpoints.catalog.clienteDesbloquear(id), {
            method: 'PUT'
        })
    },

    getBlockedClients: async (): Promise<Client[]> => {
        return apiRequest<Client[]>(endpoints.catalog.clientesBloqueados)
    },

    getMyClientData: async (): Promise<Client | null> => {
        try {
            return await apiRequest<Client>(endpoints.catalog.clienteById('me'))
        } catch (error: any) {
            console.error('Error fetching client data:', error)
            return null
        }
    },

    getMyClients: async (): Promise<Client[]> => {
        try {
            return await apiRequest<Client[]>(endpoints.catalog.clientesMis)
        } catch (error) {
            console.error('Error fetching my clients:', error)
            return []
        }
    },

    getPriceLists: async (): Promise<PriceList[]> => {
        try {
            return await apiRequest<PriceList[]>(endpoints.catalog.preciosListas)
        } catch (error) {
            console.error('Error fetching price lists:', error)
            return []
        }
    },

    getCommercialZones: async (silent = false): Promise<CommercialZone[]> => {
        try {
            return await apiRequest<CommercialZone[]>(endpoints.catalog.zonas, { silent })
        } catch (error) {
            if (!silent) console.error('Error fetching commercial zones:', error)
            return []
        }
    },

    getCommercialZoneById: async (id: number, silent = false): Promise<CommercialZone | null> => {
        try {
            return await apiRequest<CommercialZone>(endpoints.catalog.zonaById(id), { silent })
        } catch (error) {
            if (!silent) console.error(`Error fetching commercial zone ${id}:`, error)
            return null
        }
    },

    getClientBranches: async (clientId: string): Promise<ClientBranch[]> => {
        try {
            return await apiRequest<ClientBranch[]>(endpoints.catalog.sucursalesByClienteId(clientId))
        } catch (error) {
            console.error('Error fetching client branches:', error)
            return []
        }
    },

    createClientBranch: async (clientId: string, branch: Partial<ClientBranch>): Promise<ClientBranch> => {
        return apiRequest<ClientBranch>(endpoints.catalog.sucursalesByClienteId(clientId), {
            method: 'POST',
            body: JSON.stringify(branch)
        })
    },

    getDeactivatedClientBranches: async (clientId: string): Promise<ClientBranch[]> => {
        try {
            return await apiRequest<ClientBranch[]>(endpoints.catalog.sucursalesDesactivadasByClienteId(clientId))
        } catch (error) {
            console.error('Error fetching deactivated branches:', error)
            return []
        }
    },

    updateClientBranch: async (branchId: string, updates: Partial<ClientBranch>): Promise<ClientBranch> => {
        return apiRequest<ClientBranch>(endpoints.catalog.sucursalById(branchId), {
            method: 'PUT',
            body: JSON.stringify(updates)
        })
    },

    getClientBranchById: async (branchId: string): Promise<ClientBranch | null> => {
        try {
            return await apiRequest<ClientBranch>(endpoints.catalog.sucursalById(branchId))
        } catch (error) {
            console.error('Error fetching branch details:', error)
            return null
        }
    }
}

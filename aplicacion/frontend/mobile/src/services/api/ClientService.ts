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
}

// Interfaz para Sucursales del Cliente
export interface ClientBranch {
    id: string
    cliente_id: string
    nombre_sucursal: string
    direccion_entrega: string
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
     * WORKAROUND: El backend tiene un problema de orden de rutas donde @Get('mis') está después
     * de @Get(':id'), por lo que 'mis' se interpreta como un ID y causa error 500.
     *
     * Solución implementada:
     * 1. Obtener rutero del vendedor con GET /api/rutero/mio (funciona correctamente)
     * 2. Extraer IDs únicos de clientes del rutero
     * 3. Cargar información completa de cada cliente con GET /api/clientes/:id
     *
     * SOLUCIÓN BACKEND RECOMENDADA:
     * Mover @Get('mis') ANTES de @Get(':id') en clientes.controller.ts línea 52 → línea 33
     *
     * Endpoint workaround: GET /api/rutero/mio + GET /api/clientes/:id
     * Endpoint original roto: GET /api/clientes/mis (devuelve 500)
     * Roles permitidos: vendedor, admin, supervisor
     */
    getMyClients: async (): Promise<Client[]> => {
        try {
            // WORKAROUND: Obtener clientes a través del rutero
            // 1. Obtener rutero del vendedor (que incluye cliente_id)
            const routes = await apiRequest<any[]>(`${env.api.catalogUrl}/api/rutero/mio`)

            // 2. Extraer IDs únicos de clientes
            const uniqueClientIds = [...new Set(routes.map(route => route.cliente_id))]

            // 3. Cargar información completa de cada cliente
            const clientsPromises = uniqueClientIds.map(clientId =>
                ClientService.getClient(clientId).catch(error => {
                    console.error(`Error loading client ${clientId}:`, error)
                    return null
                })
            )

            const clients = await Promise.all(clientsPromises)

            // 4. Filtrar nulls y retornar solo clientes válidos
            return clients.filter(client => client !== null) as Client[]
        } catch (error: any) {
            console.error('Error fetching clients via rutero:', error)

            // Fallback: intentar con el endpoint original /mis por si fue corregido en backend
            try {
                return await apiRequest<Client[]>('/api/clientes/mis')
            } catch (misError: any) {
                console.error('Fallback /api/clientes/mis also failed:', misError)
                return []
            }
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

    getCommercialZones: async (): Promise<CommercialZone[]> => {
        try {
            return await apiRequest<CommercialZone[]>(`${env.api.catalogUrl}/api/zonas`)
        } catch (error) {
            console.error('Error fetching commercial zones:', error)
            return []
        }
    },

    /**
     * Obtiene las sucursales activas de un cliente
     *
     * Endpoint: GET /api/clientes/:clienteId/sucursales
     * Roles permitidos: admin, supervisor, cliente
     */
    getClientBranches: async (clientId: string): Promise<ClientBranch[]> => {
        try {
            return await apiRequest<ClientBranch[]>(`${env.api.catalogUrl}/api/clientes/${clientId}/sucursales`)
        } catch (error) {
            console.error('Error fetching client branches:', error)
            return []
        }
    }
}

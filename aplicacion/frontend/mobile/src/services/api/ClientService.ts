import { env } from '../../config/env'
import { apiRequest } from './client'

export interface Client {
    id: string
    usuario_principal_id?: string
    identificacion: string
    tipo_identificacion: 'RUC' | 'CEDULA' | 'PASAPORTE'
    razon_social: string
    nombre_comercial?: string
    lista_precios_id: number
    zona_comercial_id?: number
    tiene_credito: boolean
    limite_credito: number
    saldo_actual: number
    dias_plazo: number
    bloqueado: boolean
    direccion_texto?: string
    ubicacion_gps?: {
        type: 'Point'
        coordinates: [number, number]
    } | null
    vendedor_asignado_id?: string | null
    // Add other fields as needed
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
    }
}

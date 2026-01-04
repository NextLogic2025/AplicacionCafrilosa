
import { apiRequest } from './client'
import { Client } from './ClientService' // Reuse Client interface if possible

export interface RouteEntry {
    id: string
    cliente_id: string
    zona_id: number
    dia_semana: number
    frecuencia: string
    activo: boolean
    // Expanded fields for UI if backend supports joining, otherwise we might just get IDs
    // Assuming backend might return joined client data explicitly or we might need to fetch clients
    cliente?: Client
}

export interface AddClientToZonePayload {
    cliente_id: string
    zona_id: number
    dia_semana: number
    frecuencia?: string
    prioridad_visita?: string
}

export const RouteService = {
    getClientsInZone: async (zoneId: number): Promise<RouteEntry[]> => {
        try {
            // Assuming the backend supports filtering by zone_id
            return await apiRequest<RouteEntry[]>(`/api/rutero?zona_id=${zoneId}`)
        } catch (error) {
            console.error('Error fetching route clients:', error)
            return []
        }
    },

    addClientToZone: async (data: AddClientToZonePayload): Promise<{ success: boolean; message?: string }> => {
        try {
            await apiRequest('/api/rutero', {
                method: 'POST',
                body: JSON.stringify(data)
            })
            return { success: true, message: 'Cliente agregado a la ruta exitosamente' }
        } catch (error: any) {
            console.error('Error adding client to zone:', error)
            return { success: false, message: error.message || 'Error al agregar cliente' }
        }
    },

    removeClientFromZone: async (routeId: string): Promise<{ success: boolean; message?: string }> => {
        try {
            await apiRequest(`/api/rutero/${routeId}`, {
                method: 'DELETE'
            })
            return { success: true, message: 'Cliente removido de la ruta' }
        } catch (error: any) {
            console.error('Error removing client from zone:', error)
            return { success: false, message: error.message || 'Error al remover cliente' }
        }
    }
}

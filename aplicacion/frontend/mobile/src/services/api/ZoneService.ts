
import { apiRequest } from './client'

export interface Zone {
    id: number
    codigo: string
    nombre: string
    ciudad?: string
    macrorregion?: string
    activo: boolean
}

export interface CreateZonePayload {
    codigo: string
    nombre: string
    ciudad?: string
    macrorregion?: string
}

export interface UpdateZonePayload {
    codigo?: string
    nombre?: string
    ciudad?: string
    macrorregion?: string
    activo?: boolean
}

export const ZoneService = {
    getZones: async (): Promise<Zone[]> => {
        try {
            return await apiRequest<Zone[]>('/api/zonas')
        } catch (error) {
            console.error('Error fetching zones:', error)
            return []
        }
    },

    createZone: async (data: CreateZonePayload): Promise<{ success: boolean; data?: Zone; message?: string }> => {
        try {
            const response = await apiRequest<Zone>('/api/zonas', {
                method: 'POST',
                body: JSON.stringify(data)
            })
            return { success: true, data: response }
        } catch (error: any) {
            console.error('Error creating zone:', error)
            return { success: false, message: error.message || 'Error al crear zona' }
        }
    },

    updateZone: async (id: number, data: UpdateZonePayload): Promise<{ success: boolean; message?: string }> => {
        try {
            await apiRequest(`/api/zonas/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(data)
            })
            return { success: true, message: 'Zona actualizada correctamente' }
        } catch (error: any) {
            console.error('Error updating zone:', error)
            return { success: false, message: error.message || 'Error al actualizar zona' }
        }
    },

    deleteZone: async (id: number): Promise<{ success: boolean; message?: string }> => {
        try {
            await apiRequest(`/api/zonas/${id}`, {
                method: 'DELETE'
            })
            return { success: true, message: 'Zona eliminada correctamente' }
        } catch (error: any) {
            console.error('Error deleting zone:', error)
            return { success: false, message: error.message || 'Error al eliminar zona' }
        }
    }
}

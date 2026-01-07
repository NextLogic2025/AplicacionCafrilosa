import { env } from '../../config/env'
import { apiRequest } from './client'

export interface RoutePlan {
    id: string
    cliente_id: string
    zona_id: number
    dia_semana: number // 1=Lunes, 7=Domingo
    frecuencia: 'SEMANAL' | 'QUINCENAL' | 'MENSUAL'
    prioridad_visita: 'ALTA' | 'MEDIA' | 'BAJA'
    orden_sugerido: number
    hora_estimada_arribo?: string
    activo: boolean

    // Virtual/Joined fields (might come from backend or need fetching)
    _cliente?: {
        razon_social: string
        nombre_comercial: string
        identificacion?: string
        direccion?: string
        ubicacion_gps?: {
            type: 'Point'
            coordinates: [number, number]
        }
    }
}

export const RouteService = {
    /**
     * Get all route plans (Admin/Supervisor usually)
     */
    getAll: async (): Promise<RoutePlan[]> => {
        return apiRequest<RoutePlan[]>(`${env.api.catalogUrl}/api/rutero`)
    },

    /**
     * Get route plans for a specific client
     */
    getByClient: async (clientId: string): Promise<RoutePlan[]> => {
        return apiRequest<RoutePlan[]>(`${env.api.catalogUrl}/api/rutero/cliente/${clientId}`)
    },

    /**
     * Get my route (for logged in Vendor/Supervisor)
     */
    getMyRoute: async (): Promise<RoutePlan[]> => {
        return apiRequest<RoutePlan[]>(`${env.api.catalogUrl}/api/rutero/mio`)
    },

    /**
     * Create a new route plan entry
     */
    create: async (data: Partial<RoutePlan>): Promise<RoutePlan> => {
        return apiRequest<RoutePlan>(`${env.api.catalogUrl}/api/rutero`, {
            method: 'POST',
            body: JSON.stringify(data)
        })
    },

    /**
     * Update an existing route plan entry
     */
    update: async (id: string, data: Partial<RoutePlan>): Promise<RoutePlan> => {
        return apiRequest<RoutePlan>(`${env.api.catalogUrl}/api/rutero/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        })
    },

    /**
     * Remove a route plan entry (Admin only usually, check backend)
     */
    delete: async (id: string): Promise<void> => {
        return apiRequest<void>(`${env.api.catalogUrl}/api/rutero/${id}`, {
            method: 'DELETE'
        })
    }
}

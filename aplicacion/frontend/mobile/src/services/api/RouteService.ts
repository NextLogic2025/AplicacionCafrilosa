import { env } from '../../config/env'
import { apiRequest } from './client'
import { ClientService } from './ClientService'

/**
 * RouteService - Servicio centralizado para manejo de ruteros
 *
 * Endpoints del backend:
 * - GET /api/rutero - Listar todos los ruteros (admin, supervisor)
 * - GET /api/rutero/mio - Mi rutero (vendedor autenticado)
 * - GET /api/rutero/cliente/:id - Rutero de un cliente específico
 * - POST /api/rutero - Crear rutero (admin, supervisor)
 * - PUT /api/rutero/:id - Actualizar rutero (admin, supervisor)
 * - DELETE /api/rutero/:id - Eliminar rutero (admin)
 */

export interface RoutePlan {
    id: string
    cliente_id: string
    zona_id: number
    dia_semana: number // 0=Domingo, 1=Lunes, ..., 6=Sábado
    frecuencia: 'SEMANAL' | 'QUINCENAL' | 'MENSUAL'
    prioridad_visita: 'ALTA' | 'MEDIA' | 'BAJA' | 'NORMAL'
    orden_sugerido: number
    hora_estimada_arribo?: string
    activo: boolean
}

export interface ScheduledVisit {
    id: string
    clientName: string
    address: string
    time: string
    status: 'pending' | 'completed' | 'cancelled'
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
    },

    /**
     * Obtiene las visitas programadas para hoy desde el rutero planificado
     *
     * Conecta con GET /api/rutero/mio y filtra por el día actual.
     * Enriquece los datos con información del cliente.
     *
     * @returns Lista de visitas programadas para el día actual
     */
    getTodayVisits: async (): Promise<ScheduledVisit[]> => {
        try {
            // Obtener rutero completo del vendedor
            const routes = await RouteService.getMyRoute()

            // Obtener día actual (0=Domingo, 6=Sábado)
            const currentDay = new Date().getDay()

            // Filtrar visitas del día actual que estén activas
            const todayRoutes = routes.filter(
                route => route.activo && route.dia_semana === currentDay
            )

            // Ordenar por orden_sugerido
            todayRoutes.sort((a, b) => (a.orden_sugerido || 0) - (b.orden_sugerido || 0))

            // Cargar información de clientes para enriquecer las visitas
            const visits: ScheduledVisit[] = await Promise.all(
                todayRoutes.map(async (route) => {
                    try {
                        const client = await ClientService.getClient(route.cliente_id)
                        return {
                            id: route.id,
                            clientName: client.nombre_comercial || client.razon_social,
                            address: client.direccion_texto || 'Sin dirección',
                            time: route.hora_estimada_arribo || '00:00:00',
                            status: 'pending' as const
                        }
                    } catch (error) {
                        console.error(`Error loading client ${route.cliente_id}:`, error)
                        return {
                            id: route.id,
                            clientName: 'Cliente desconocido',
                            address: 'Sin dirección',
                            time: route.hora_estimada_arribo || '00:00:00',
                            status: 'pending' as const
                        }
                    }
                })
            )

            return visits
        } catch (error) {
            console.error('Error loading scheduled visits:', error)
            return []
        }
    },

    /**
     * Obtiene todos los clientes asignados a una zona comercial específica
     *
     * Filtra los planes de rutero por zona_id y retorna información básica de los clientes.
     * Útil para pantallas de detalle de zona del Supervisor.
     *
     * @param zoneId - ID de la zona comercial
     * @returns Lista de clientes en la zona
     */
    getClientsInZone: async (zoneId: number): Promise<any[]> => {
        try {
            // Obtener todos los planes de rutero
            const allRoutes = await RouteService.getAll()

            // Filtrar por zona_id y obtener IDs únicos de clientes
            const clientIdsInZone = [...new Set(
                allRoutes
                    .filter(route => Number(route.zona_id) === Number(zoneId))
                    .map(route => route.cliente_id)
            )]

            // Cargar información completa de cada cliente
            const clients = await Promise.all(
                clientIdsInZone.map(async (clientId) => {
                    try {
                        return await ClientService.getClient(clientId)
                    } catch (error) {
                        console.error(`Error loading client ${clientId}:`, error)
                        return null
                    }
                })
            )

            // Filtrar nulls y retornar solo clientes válidos
            return clients.filter(client => client !== null)
        } catch (error) {
            console.error('Error loading clients in zone:', error)
            return []
        }
    }
}

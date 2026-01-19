import { apiRequest } from './client'
import { ClientService, type Client } from './ClientService'
import { endpoints } from './endpoints'

export interface RoutePlan {
    id: string
    cliente_id: string
    sucursal_id?: string
    zona_id: number
    dia_semana: number
    frecuencia: 'SEMANAL' | 'QUINCENAL' | 'MENSUAL'
    prioridad_visita: 'ALTA' | 'MEDIA' | 'BAJA' | 'NORMAL'
    orden_sugerido: number
    hora_estimada_arribo?: string
    activo: boolean

    _cliente?: Client
}

export interface ScheduledVisit {
    id: string
    clientName: string
    address: string
    time: string
    status: 'pending' | 'completed' | 'cancelled'
}

export const RouteService = {
    getAll: async (): Promise<RoutePlan[]> => {
        return apiRequest<RoutePlan[]>(endpoints.catalog.rutero)
    },

    getByClient: async (clientId: string): Promise<RoutePlan[]> => {
        return apiRequest<RoutePlan[]>(endpoints.catalog.ruteroByClienteId(clientId))
    },

    getMyRoute: async (): Promise<RoutePlan[]> => {
        return apiRequest<RoutePlan[]>(endpoints.catalog.ruteroMio)
    },

    create: async (data: Partial<RoutePlan>): Promise<RoutePlan> => {
        return apiRequest<RoutePlan>(endpoints.catalog.rutero, {
            method: 'POST',
            body: JSON.stringify(data)
        })
    },

    update: async (id: string, data: Partial<RoutePlan>): Promise<RoutePlan> => {
        return apiRequest<RoutePlan>(endpoints.catalog.ruteroById(id), {
            method: 'PUT',
            body: JSON.stringify(data)
        })
    },

    delete: async (id: string): Promise<void> => {
        return apiRequest<void>(endpoints.catalog.ruteroById(id), {
            method: 'DELETE'
        })
    },

    deactivate: async (id: string): Promise<RoutePlan> => {
        return apiRequest<RoutePlan>(endpoints.catalog.ruteroById(id), {
            method: 'PUT',
            body: JSON.stringify({ activo: false })
        })
    },

    reactivate: async (id: string): Promise<RoutePlan> => {
        return apiRequest<RoutePlan>(endpoints.catalog.ruteroById(id), {
            method: 'PUT',
            body: JSON.stringify({ activo: true })
        })
    },

    getInactive: async (): Promise<RoutePlan[]> => {
        const allRoutes = await RouteService.getAll()
        return allRoutes.filter(r => !r.activo)
    },

    checkDuplicate: async (
        clienteId: string,
        diaSemana: number,
        hora?: string,
        sucursalId?: string
    ): Promise<RoutePlan | null> => {
        try {
            const allRoutes = await RouteService.getAll()
            const duplicate = allRoutes.find(r =>
                r.activo &&
                r.cliente_id === clienteId &&
                r.dia_semana === diaSemana &&
                (sucursalId ? r.sucursal_id === sucursalId : !r.sucursal_id) &&
                (hora ? r.hora_estimada_arribo === hora : true)
            )
            return duplicate || null
        } catch (error) {
            console.error('Error checking duplicate route:', error)
            return null
        }
    },

    getTodayVisits: async (): Promise<ScheduledVisit[]> => {
        try {
            const routes = await RouteService.getMyRoute()
            const currentDay = new Date().getDay()

            const todayRoutes = routes.filter(
                route => route.activo && route.dia_semana === currentDay
            )

            todayRoutes.sort((a, b) => (a.orden_sugerido || 0) - (b.orden_sugerido || 0))

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

    getClientsInZone: async (zoneId: number): Promise<any[]> => {
        try {
            const allRoutes = await RouteService.getAll()

            const clientIdsInZone = [...new Set(
                allRoutes
                    .filter(route => Number(route.zona_id) === Number(zoneId))
                    .map(route => route.cliente_id)
            )]

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

            return clients.filter(client => client !== null)
        } catch (error) {
            console.error('Error loading clients in zone:', error)
            return []
        }
    }
}

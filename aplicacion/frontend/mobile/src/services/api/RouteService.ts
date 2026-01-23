import { ApiService } from './ApiService'
import { ClientService, type Client } from './ClientService'
import { createService } from './createService'
import { endpoints } from './endpoints'
import { logErrorForDebugging } from '../../utils/errorMessages'

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

const ROUTES_ENDPOINT = endpoints.catalog.rutero
const ROUTE_BY_ID = (id: string) => endpoints.catalog.ruteroById(id)
const ROUTES_BY_CLIENT = (clientId: string) => endpoints.catalog.ruteroByClienteId(clientId)

async function fetchAllRoutes(): Promise<RoutePlan[]> {
    return ApiService.get<RoutePlan[]>(ROUTES_ENDPOINT)
}

const rawService = {
    getAll: async (): Promise<RoutePlan[]> => {
        return fetchAllRoutes()
    },

    getByClient: async (clientId: string): Promise<RoutePlan[]> => {
        return ApiService.get<RoutePlan[]>(ROUTES_BY_CLIENT(clientId))
    },

    getMyRoute: async (): Promise<RoutePlan[]> => {
        return ApiService.get<RoutePlan[]>(endpoints.catalog.ruteroMio)
    },

    create: async (data: Partial<RoutePlan>): Promise<RoutePlan> => {
        return ApiService.post<RoutePlan>(ROUTES_ENDPOINT, data)
    },

    update: async (id: string, data: Partial<RoutePlan>): Promise<RoutePlan> => {
        return ApiService.put<RoutePlan>(ROUTE_BY_ID(id), data)
    },

    delete: async (id: string): Promise<void> => {
        return ApiService.delete<void>(ROUTE_BY_ID(id))
    },

    deactivate: async (id: string): Promise<RoutePlan> => {
        return ApiService.put<RoutePlan>(ROUTE_BY_ID(id), { activo: false })
    },

    reactivate: async (id: string): Promise<RoutePlan> => {
        return ApiService.put<RoutePlan>(ROUTE_BY_ID(id), { activo: true })
    },

    getInactive: async (): Promise<RoutePlan[]> => {
        const allRoutes = await fetchAllRoutes()
        return allRoutes.filter(r => !r.activo)
    },

    checkDuplicate: async (
        clienteId: string,
        diaSemana: number,
        hora?: string,
        sucursalId?: string
    ): Promise<RoutePlan | null> => {
        try {
            const allRoutes = await fetchAllRoutes()
            const duplicate = allRoutes.find(r =>
                r.activo &&
                r.cliente_id === clienteId &&
                r.dia_semana === diaSemana &&
                (sucursalId ? r.sucursal_id === sucursalId : !r.sucursal_id) &&
                (hora ? r.hora_estimada_arribo === hora : true)
            )
            return duplicate || null
        } catch (error) {
            logErrorForDebugging(error, 'RouteService.checkDuplicate', { clienteId, diaSemana, hora, sucursalId })
            return null
        }
    },

    getTodayVisits: async (): Promise<ScheduledVisit[]> => {
        try {
            const routes = await rawService.getMyRoute()
            const currentDay = new Date().getDay()

            const todayRoutes = routes.filter(
                route => route.activo && route.dia_semana === currentDay
            ).sort((a, b) => (a.orden_sugerido || 0) - (b.orden_sugerido || 0))

            const visits: ScheduledVisit[] = await Promise.all(
                todayRoutes.map(async (route) => {
                    try {
                        const client = await ClientService.getClient(route.cliente_id)
                        return {
                            id: route.id,
                            clientName: client.nombre_comercial || client.razon_social,
                            address: client.direccion_texto || 'Sin dirección',
                            time: route.hora_estimada_arribo || '00:00:00',
                            status: 'pending'
                        }
                    } catch (error) {
                        logErrorForDebugging(error, 'RouteService.getTodayVisits.clientLookup', { routeId: route.id })
                        return {
                            id: route.id,
                            clientName: 'Cliente desconocido',
                            address: 'Sin dirección',
                            time: route.hora_estimada_arribo || '00:00:00',
                            status: 'pending'
                        }
                    }
                })
            )

            return visits
        } catch (error) {
            logErrorForDebugging(error, 'RouteService.getTodayVisits')
            return []
        }
    },

    getClientsInZone: async (zoneId: number): Promise<any[]> => {
        try {
            const allRoutes = await fetchAllRoutes()
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
                        logErrorForDebugging(error, 'RouteService.getClientsInZone.clientLookup', { clientId })
                        return null
                    }
                })
            )

            return clients.filter(client => client !== null)
        } catch (error) {
            logErrorForDebugging(error, 'RouteService.getClientsInZone', { zoneId })
            return []
        }
    }
}

export const RouteService = createService('RouteService', rawService)

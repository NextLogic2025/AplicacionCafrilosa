import type { Zone } from '../../../../services/api/ZoneService'
import type { RoutePlan } from '../../../../services/api/RouteService'

export type RouteDestination = {
  type: 'client' | 'branch'
  id: string
  name: string
  address?: string
  location?: { latitude: number; longitude: number }
  clientId: string
  clientName: string
  zoneId: number
  zoneName?: string
}

export type RouteCreatePaso2Params = {
  zone: Zone
  destinations: RouteDestination[]
  existingRoutes: RoutePlan[]
}

export type RouteCreateParams = {
  SupervisorRouteCreatePaso2: RouteCreatePaso2Params
}


import type { RoutePlan } from '../../../../services/api/RouteService'

export type RoutePlanWithClient = RoutePlan & {
  cliente?: {
    razon_social: string
    nombre_comercial: string
    identificacion: string
    direccion_texto?: string
    ubicacion_gps?: { type: 'Point'; coordinates: [number, number] } | null
  }
  sucursal?: {
    nombre_sucursal: string
    direccion_entrega?: string
    ubicacion_gps?: { type: 'Point'; coordinates: [number, number] } | null
  }
}

export type RouteMarker = {
  id: string
  order: number
  name?: string
  isBranch: boolean
  coords: { latitude: number; longitude: number }
  hora?: string
}


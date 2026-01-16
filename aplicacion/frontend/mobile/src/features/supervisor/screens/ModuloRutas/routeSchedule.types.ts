import type { RouteDestination } from './routeCreate.types'
import type { FrequencyType, PriorityType } from './routeSchedule.constants'

export type DestinationConfig = {
  destino: RouteDestination
  hora: string
  prioridad: PriorityType
  frecuencia: FrequencyType
}


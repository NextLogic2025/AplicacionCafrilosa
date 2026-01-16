import type { Region } from 'react-native-maps'
import { DEFAULT_REGION, PRIORITIES } from './routeSchedule.constants'
import type { DestinationConfig } from './routeSchedule.types'
import type { PriorityType } from './routeSchedule.constants'
import { BRAND_COLORS } from '../../../../shared/types'

export function getPriorityColor(prio: PriorityType) {
  return PRIORITIES.find(p => p.id === prio)?.color || BRAND_COLORS.gold
}

export function sortDestinationConfigs(configs: DestinationConfig[]) {
  return [...configs].sort((a, b) => {
    const prioA = PRIORITIES.find(p => p.id === a.prioridad)?.order || 2
    const prioB = PRIORITIES.find(p => p.id === b.prioridad)?.order || 2
    if (prioA !== prioB) return prioA - prioB

    if (a.hora && b.hora) return a.hora.localeCompare(b.hora)
    if (a.hora && !b.hora) return -1
    if (!a.hora && b.hora) return 1
    return 0
  })
}

export function getMapRegion(configs: DestinationConfig[], fallback: Region = DEFAULT_REGION): Region {
  const withLocation = configs.filter(c => c.destino.location != null)
  if (withLocation.length === 0) return fallback

  if (withLocation.length === 1) {
    const loc = withLocation[0].destino.location!
    return { latitude: loc.latitude, longitude: loc.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }
  }

  const lats = withLocation.map(d => d.destino.location!.latitude)
  const lngs = withLocation.map(d => d.destino.location!.longitude)
  return {
    latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
    longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
    latitudeDelta: Math.max(0.01, (Math.max(...lats) - Math.min(...lats)) * 1.5),
    longitudeDelta: Math.max(0.01, (Math.max(...lngs) - Math.min(...lngs)) * 1.5),
  }
}

export function getRoutePath(configs: DestinationConfig[]) {
  return configs.filter(c => c.destino.location != null).map(c => c.destino.location!)
}


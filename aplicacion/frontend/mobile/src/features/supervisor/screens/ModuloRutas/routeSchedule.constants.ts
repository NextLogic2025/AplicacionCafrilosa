import type { Region } from 'react-native-maps'
import { BRAND_COLORS } from '../../../../shared/types'

export const DAYS = [
  { id: 1, label: 'Lunes', short: 'LUN' },
  { id: 2, label: 'Martes', short: 'MAR' },
  { id: 3, label: 'Miércoles', short: 'MIE' },
  { id: 4, label: 'Jueves', short: 'JUE' },
  { id: 5, label: 'Viernes', short: 'VIE' },
  { id: 6, label: 'Sábado', short: 'SAB' },
  { id: 7, label: 'Domingo', short: 'DOM' },
] as const

export type FrequencyType = 'SEMANAL' | 'QUINCENAL' | 'MENSUAL'
export type PriorityType = 'ALTA' | 'MEDIA' | 'BAJA'

export const FREQUENCIES = [
  { id: 'SEMANAL', label: 'Semanal' },
  { id: 'QUINCENAL', label: 'Quincenal' },
  { id: 'MENSUAL', label: 'Mensual' },
] as const

export const PRIORITIES = [
  { id: 'ALTA', label: 'Alta', color: BRAND_COLORS.red, icon: 'alert-circle' as const, order: 1 },
  { id: 'MEDIA', label: 'Media', color: BRAND_COLORS.gold, icon: 'time' as const, order: 2 },
  { id: 'BAJA', label: 'Baja', color: '#22C55E', icon: 'checkmark-circle' as const, order: 3 },
] as const

export const DEFAULT_REGION: Region = {
  latitude: -3.99313,
  longitude: -79.20422,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
}

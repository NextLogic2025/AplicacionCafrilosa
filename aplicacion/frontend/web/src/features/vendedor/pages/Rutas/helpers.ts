import type { Cliente } from '../../../supervisor/services/clientesApi'
import type { RuteroPlanificado } from '../../../supervisor/services/types'

export function getClienteCoords(cliente: Cliente | null, plan?: RuteroPlanificado | null): { lat: number; lng: number } | null {
  if (!cliente) return null
  const anyCliente = cliente as any

  if (plan?.tipo_direccion === 'SUCURSAL' && plan?.sucursal_id) {
    const sucursales: any[] = anyCliente.sucursales ?? anyCliente.sucursal ?? anyCliente.sucursales_rutero ?? []
    if (Array.isArray(sucursales) && sucursales.length > 0) {
      const buscada = sucursales.find((s) => String(s.id) === String(plan.sucursal_id))
      if (buscada) {
        if (buscada.ubicacion_gps?.coordinates) {
          return { lat: buscada.ubicacion_gps.coordinates[1], lng: buscada.ubicacion_gps.coordinates[0] }
        }
        if (typeof buscada.latitud === 'number' && typeof buscada.longitud === 'number') {
          return { lat: buscada.latitud, lng: buscada.longitud }
        }
      }
    }
  }

  if (anyCliente.ubicacion_gps?.coordinates) {
    return {
      lat: anyCliente.ubicacion_gps.coordinates[1],
      lng: anyCliente.ubicacion_gps.coordinates[0],
    }
  }
  if (typeof anyCliente.latitud === 'number' && typeof anyCliente.longitud === 'number') {
    return { lat: anyCliente.latitud, lng: anyCliente.longitud }
  }
  return null
}

export function getMarkerIcon(color: string) {
  const svg = encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24">
      <path fill="${color}" stroke="#fff" stroke-width="1" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
      <circle cx="12" cy="9" r="2.5" fill="#fff" />
    </svg>
  `)
  return {
    url: `data:image/svg+xml;charset=UTF-8,${svg}`,
    scaledSize:
      (window as any).google && (window as any).google.maps && (window as any).google.maps.Size
        ? new (window as any).google.maps.Size(36, 36)
        : undefined,
    anchor: undefined,
  }
}

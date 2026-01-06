import { useMemo } from 'react'
import { GoogleMap, Polygon, useJsApiLoader } from '@react-google-maps/api'
import { Alert } from 'components/ui/Alert'
import { Modal } from 'components/ui/Modal'
import { type ZonaComercial } from '../../services/zonasApi'

const containerStyle = { width: '100%', height: '70vh' }
const defaultCenter: google.maps.LatLngLiteral = { lat: -1.831239, lng: -78.183406 } // Ecuador centro

interface MapaGeneralModalProps {
  zonas: ZonaComercial[]
  isOpen: boolean
  onClose: () => void
}

export function MapaGeneralModal({ zonas, isOpen, onClose }: MapaGeneralModalProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey ?? '',
    libraries: ['drawing'],
  })

  const zonasConPoligono = useMemo(() => {
    return zonas
      .filter((zona) => zona.activo) // Solo zonas activas
      .map((zona) => ({
        zona,
        path: parseGeoPolygon(zona.poligono_geografico),
      }))
      .filter((item) => item.path.length >= 3)
  }, [zonas])

  const bounds = useMemo(() => {
    if (!zonasConPoligono.length) return null
    const allPoints = zonasConPoligono.flatMap((item) => item.path)
    if (!allPoints.length) return null

    const lats = allPoints.map((p) => p.lat)
    const lngs = allPoints.map((p) => p.lng)

    return {
      north: Math.max(...lats),
      south: Math.min(...lats),
      east: Math.max(...lngs),
      west: Math.min(...lngs),
    }
  }, [zonasConPoligono])

  const colors = [
    '#f0412d',
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#8b5cf6',
    '#ec4899',
    '#14b8a6',
    '#f97316',
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mapa general de zonas" headerGradient="red" maxWidth="2xl">
      <div className="space-y-4">
        {!apiKey ? (
          <Alert type="error" message="Configura VITE_GOOGLE_MAPS_API_KEY para ver el mapa." />
        ) : loadError ? (
          <Alert type="error" message="No se pudo cargar Google Maps." />
        ) : !isLoaded ? (
          <div className="flex h-[70vh] items-center justify-center text-sm text-neutral-600">Cargando mapa...</div>
        ) : (
          <>
            <div className="overflow-hidden rounded-xl border border-neutral-200 shadow-sm">
              <GoogleMap
                mapContainerStyle={containerStyle}
                center={defaultCenter}
                zoom={7}
                onLoad={(map) => {
                  if (bounds) {
                    map.fitBounds(bounds, 50)
                  }
                }}
                options={{
                  fullscreenControl: true,
                  mapTypeControl: true,
                  streetViewControl: false,
                  clickableIcons: false,
                }}
              >
                {zonasConPoligono.map((item, index) => {
                  const color = colors[index % colors.length]
                  return (
                    <Polygon
                      key={item.zona.id}
                      path={item.path}
                      options={{
                        fillColor: color,
                        fillOpacity: 0.25,
                        strokeColor: color,
                        strokeOpacity: 0.9,
                        strokeWeight: 2,
                      }}
                    />
                  )
                })}
              </GoogleMap>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="text-neutral-600">
                Mostrando {zonasConPoligono.length} zonas activas con polígono definido
              </div>
              <div className="flex flex-wrap gap-2">
                {zonasConPoligono.slice(0, 8).map((item, index) => {
                  const color = colors[index % colors.length]
                  return (
                    <div key={item.zona.id} className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-sm border border-neutral-300" style={{ backgroundColor: color }} />
                      <span className="text-neutral-700">{item.zona.nombre}</span>
                    </div>
                  )
                })}
                {zonasConPoligono.length > 8 && (
                  <span className="text-neutral-500">+{zonasConPoligono.length - 8} más</span>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

function parseGeoPolygon(value: unknown): google.maps.LatLngLiteral[] {
  if (!value) return []

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return parseGeoPolygon(parsed)
    } catch (e) {
      return []
    }
  }

  if (Array.isArray(value) && value.every((p: any) => typeof p?.lat === 'number' && typeof p?.lng === 'number')) {
    return dedupeClosingPoint(value as google.maps.LatLngLiteral[])
  }

  if (typeof value === 'object' && value !== null && 'coordinates' in (value as any)) {
    const coordinates = (value as any).coordinates?.[0]
    if (Array.isArray(coordinates)) {
      const path = coordinates
        .map((pair: any) => {
          if (!Array.isArray(pair) || pair.length < 2) return null
          const [lng, lat] = pair
          if (typeof lat !== 'number' || typeof lng !== 'number') return null
          return { lat, lng }
        })
        .filter(Boolean) as google.maps.LatLngLiteral[]
      return dedupeClosingPoint(path)
    }
  }

  return []
}

function dedupeClosingPoint(path: google.maps.LatLngLiteral[]): google.maps.LatLngLiteral[] {
  if (path.length < 2) return path
  const first = path[0]
  const last = path[path.length - 1]
  if (first.lat === last.lat && first.lng === last.lng) {
    return path.slice(0, -1)
  }
  return path
}

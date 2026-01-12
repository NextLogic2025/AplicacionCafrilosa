import { useEffect, useMemo, useState } from 'react'
import { GoogleMap, Marker, Polygon, Polyline, useJsApiLoader } from '@react-google-maps/api'
import type { ClienteRutero } from '../../services/types'
import type { ZonaComercial } from '../../services/zonasApi'
import { PRIORIDAD_COLORS } from '../../services/types'

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
const GOOGLE_MAP_LIBRARIES: ["drawing"] = ['drawing']

const MAP_CONTAINER_STYLE = {
  width: '100%',
  height: '100%',
}

const DEFAULT_CENTER = {
  lat: 4.6097,
  lng: -74.0817, // Bogotá
}

interface RuteroMapaProps {
  zona: ZonaComercial | null
  clientes: ClienteRutero[]
  isLoading: boolean
}

export function RuteroMapa({ zona, clientes, isLoading }: RuteroMapaProps) {
  const { isLoaded, loadError } = useJsApiLoader({ googleMapsApiKey: GOOGLE_MAPS_API_KEY, libraries: GOOGLE_MAP_LIBRARIES })
  const [center, setCenter] = useState(DEFAULT_CENTER)
  const [zoom, setZoom] = useState(12)

  // Actualizar centro cuando cambie la zona
  useEffect(() => {
    // Si hay filtrados por zona, usa esos; si no, usa todos
    const listaBase = clientes.filter((c) => c.ubicacion_gps)
    if (listaBase.length > 0) {
      const coords = listaBase[0].ubicacion_gps!.coordinates
      setCenter({ lng: coords[0], lat: coords[1] })
      setZoom(12)
    }
  }, [zona, clientes])

  // Parsear polígono de zona si existe (GeoJSON Polygon | string | LatLng[])
  const zonaPaths = useMemo(() => {
    const val: unknown = zona?.poligono_geografico as unknown
    if (!val) return [] as { lat: number; lng: number }[]

    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val)
        return parseGeoPolygon(parsed)
      } catch {
        return []
      }
    }
    return parseGeoPolygon(val)
  }, [zona])

  // Mostrar todos los clientes recibidos (ya filtrados y ajustados por el padre)
  const clienteMarkers = clientes.filter((c) => c.ubicacion_gps).map((cliente) => ({
    cliente,
    position: {
      lat: cliente.ubicacion_gps!.coordinates[1],
      lng: cliente.ubicacion_gps!.coordinates[0],
    },
  }))

  // Generar línea de ruta conectando clientes en orden
  const routePath = clienteMarkers.map((m) => m.position)

  const getMarkerColor = (prioridad: ClienteRutero['prioridad']) => {
    switch (prioridad) {
      case 'ALTA':
        return '#ef4444' // red
      case 'MEDIA':
        return '#eab308' // yellow
      case 'BAJA':
        return '#22c55e' // green
      default:
        return '#6b7280' // gray
    }
  }

  return (
    <div className="flex h-full flex-col rounded-lg border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50 p-4">
        <h3 className="text-lg font-semibold text-gray-900">Mapa de Ruta</h3>
        <p className="text-sm text-gray-600">
          {zona ? `${zona.nombre} - ${zona.ciudad || 'Sin ciudad'}` : 'Selecciona una zona'}
        </p>
      </div>

      {/* Mapa */}
      <div className="relative flex-1">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-sm text-gray-500">Cargando mapa...</div>
          </div>
        ) : !GOOGLE_MAPS_API_KEY ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-500">Configura VITE_GOOGLE_MAPS_API_KEY</div>
        ) : loadError ? (
          <div className="flex h-full items-center justify-center text-sm text-red-600">Error cargando Google Maps</div>
        ) : !isLoaded ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-500">Cargando mapa...</div>
        ) : (
            <GoogleMap
              mapContainerStyle={MAP_CONTAINER_STYLE}
              center={center}
              zoom={zoom}
              options={{
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
              }}
            >
              {/* Polígono de zona */}
              {zonaPaths && zonaPaths.length > 0 && (
                <Polygon
                  paths={zonaPaths}
                  options={{
                    fillColor: '#dc2626',
                    fillOpacity: 0.1,
                    strokeColor: '#dc2626',
                    strokeOpacity: 0.6,
                    strokeWeight: 2,
                  }}
                />
              )}

              {/* Marcadores de clientes */}
              {clienteMarkers.map((marker, index) => (
                <Marker
                  key={marker.cliente.id}
                  position={marker.position}
                  label={{
                    text: String(index + 1),
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 'bold',
                  }}
                  title={`${index + 1}. ${marker.cliente.razon_social}`}
                />
              ))}

              {/* Línea de ruta */}
              {routePath.length > 1 && (
                <Polyline
                  path={routePath}
                  options={{
                    strokeColor: '#3b82f6',
                    strokeOpacity: 0.8,
                    strokeWeight: 3,
                    geodesic: true,
                  }}
                />
              )}
            </GoogleMap>
        )}
      </div>

      {/* Leyenda */}
      {!isLoading && clientes.length > 0 && (
        <div className="border-t border-gray-200 bg-gray-50 p-3">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex gap-4">
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <span>Alta</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <span>Media</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span>Baja</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-0.5 w-6 bg-blue-500" />
              <span>Ruta sugerida</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function parseGeoPolygon(value: unknown): { lat: number; lng: number }[] {
  if (!value) return []

  if (Array.isArray(value) && value.every((p: any) => typeof p?.lat === 'number' && typeof p?.lng === 'number')) {
    return dedupeClosingPoint(value as { lat: number; lng: number }[])
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
        .filter(Boolean) as { lat: number; lng: number }[]
      return dedupeClosingPoint(path)
    }
  }

  return []
}

function dedupeClosingPoint(path: { lat: number; lng: number }[]): { lat: number; lng: number }[] {
  if (path.length < 2) return path
  const first = path[0]
  const last = path[path.length - 1]
  if (first.lat === last.lat && first.lng === last.lng) {
    return path.slice(0, -1)
  }
  return path
}

// Ray-casting algorithm for point in polygon
function isPointInPolygon(point: { lat: number; lng: number }, polygon: { lat: number; lng: number }[]): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng
    const yi = polygon[i].lat
    const xj = polygon[j].lng
    const yj = polygon[j].lat

    const intersect = yi > point.lat !== yj > point.lat && point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi + 1e-9) + xi
    if (intersect) inside = !inside
  }
  return inside
}

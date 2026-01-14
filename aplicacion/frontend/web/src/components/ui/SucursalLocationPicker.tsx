import { useEffect, useMemo, useState } from 'react'
import { GoogleMap, Marker, Polygon, useJsApiLoader } from '@react-google-maps/api'
import { type ZonaOption } from './ClienteForm'

const GOOGLE_MAP_LIBRARIES: ["drawing"] = ['drawing']
const sucursalMapStyle = { width: '100%', height: '280px' }
const defaultCenter: google.maps.LatLngLiteral = { lat: -0.180653, lng: -78.467834 }

interface SucursalLocationPickerProps {
  position: google.maps.LatLngLiteral | null
  zonaId: number | null
  zonas: ZonaOption[]
  ubicacionMatriz: google.maps.LatLngLiteral | null
  onChange: (position: google.maps.LatLngLiteral) => void
  mode?: 'matriz' | 'sucursal'
}

export function SucursalLocationPicker({ position, zonaId, zonas, ubicacionMatriz, onChange, mode }: SucursalLocationPickerProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string || ''
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: GOOGLE_MAP_LIBRARIES,
  })

  const [tempMarker, setTempMarker] = useState<google.maps.LatLngLiteral | null>(position)

  const zonaPath = useMemo(() => {
    if (!zonaId) return []
    const zona = zonas.find((z) => z.id === zonaId)
    if (!zona || !('poligono_geografico' in zona)) return []
    return parseGeoPolygon((zona as any).poligono_geografico)
  }, [zonaId, zonas])

  const mapCenter = useMemo(() => {
    if (tempMarker) return tempMarker
    if (ubicacionMatriz) return ubicacionMatriz
    if (zonaPath.length > 0) return zonaPath[0]
    return defaultCenter
  }, [tempMarker, ubicacionMatriz, zonaPath])

  useEffect(() => {
    setTempMarker(position)
  }, [position])

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() }
      setTempMarker(newPos)
      onChange(newPos)
    }
  }

  if (!apiKey) {
    return (
      <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3">
        <p className="text-xs text-yellow-800">Configura VITE_GOOGLE_MAPS_API_KEY para ver el mapa.</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-3">
        <p className="text-xs text-red-800">No se pudo cargar Google Maps.</p>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-lg bg-gray-50">
        <p className="text-sm text-gray-600">Cargando mapa...</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-800">Ubicación de la Sucursal</p>
        <span className="text-xs text-gray-500">Haz clic en el mapa para marcar</span>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
        <GoogleMap
          mapContainerStyle={sucursalMapStyle}
          center={mapCenter}
          zoom={zonaPath.length > 0 ? 13 : tempMarker || ubicacionMatriz ? 15 : 12}
          onClick={handleMapClick}
          options={{
            fullscreenControl: false,
            mapTypeControl: false,
            streetViewControl: false,
            clickableIcons: false,
          }}
        >
          {zonaPath.length > 0 && (
            <Polygon
              path={zonaPath}
              options={{
                fillColor: '#f0412d',
                fillOpacity: 0.15,
                strokeColor: '#f0412d',
                strokeOpacity: 0.7,
                strokeWeight: 2,
                clickable: false,
              }}
            />
          )}

          {/* En modo matriz, el punto rojo es movible y corresponde a tempMarker */}
          {mode === 'matriz' && tempMarker && (
            <Marker
              position={tempMarker}
              icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' }}
              animation={google.maps.Animation.DROP}
              title="Ubicación Matriz"
            />
          )}
          {/* En modo sucursal, mostrar matriz rojo fijo y sucursal azul movible */}
          {mode !== 'matriz' && ubicacionMatriz && (
            <Marker
              position={ubicacionMatriz}
              icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' }}
              title="Ubicación Matriz"
            />
          )}
          {mode !== 'matriz' && tempMarker && (
            <Marker
              position={tempMarker}
              icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png' }}
              animation={google.maps.Animation.DROP}
              title="Ubicación Sucursal"
            />
          )}
        </GoogleMap>
      </div>

      <div className="flex flex-col gap-1 text-xs">
        {/* En modo matriz, mostrar solo el punto rojo editable */}
        {mode === 'matriz' && tempMarker && (
          <p className="text-red-700 flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full bg-red-500" />
            Matriz: {tempMarker.lat.toFixed(6)}, {tempMarker.lng.toFixed(6)}
          </p>
        )}
        {/* En modo sucursal, mostrar ambos textos si existen */}
        {mode !== 'matriz' && ubicacionMatriz && (
          <p className="text-red-700 flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full bg-red-500" />
            Matriz: {ubicacionMatriz.lat.toFixed(6)}, {ubicacionMatriz.lng.toFixed(6)}
          </p>
        )}
        {mode !== 'matriz' && tempMarker && (
          <p className="text-blue-700 font-medium flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full bg-blue-500" />
            Sucursal: {tempMarker.lat.toFixed(6)}, {tempMarker.lng.toFixed(6)}
          </p>
        )}
        {zonaPath.length > 0 && <p className="text-gray-600">Polígono de la zona comercial visible</p>}
      </div>
    </div>
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

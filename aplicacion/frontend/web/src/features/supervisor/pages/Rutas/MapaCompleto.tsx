import { useEffect, useMemo, useState } from 'react'
import { GoogleMap, Marker, Polygon, useJsApiLoader, InfoWindow } from '@react-google-maps/api'
import type { ZonaComercial } from '../../services/zonasApi'
import type { ClienteRutero, SucursalRutero } from '../../services/types'

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

interface MapaCompletoProps {
  zonas: ZonaComercial[]
  clientes: ClienteRutero[]
  sucursales: SucursalRutero[]
  isLoading: boolean
}

export function MapaCompleto({ zonas, clientes, sucursales, isLoading }: MapaCompletoProps) {
  const { isLoaded, loadError } = useJsApiLoader({ googleMapsApiKey: GOOGLE_MAPS_API_KEY, libraries: GOOGLE_MAP_LIBRARIES })
  const [center, setCenter] = useState(DEFAULT_CENTER)
  const [zoom, setZoom] = useState(12)

  // Actualizar centro y zoom para mostrar todos los clientes
  useEffect(() => {
    if (clientes.length > 0) {
      const clientesConCoords = clientes.filter(cliente => cliente.ubicacion_gps)
      if (clientesConCoords.length > 0) {
        // Calcular el centro promedio de todos los clientes
        const totalCoords = clientesConCoords.reduce((acc, cliente) => {
          const coords = cliente.ubicacion_gps!.coordinates
          return { lat: acc.lat + coords[1], lng: acc.lng + coords[0] }
        }, { lat: 0, lng: 0 })
        
        const centerLat = totalCoords.lat / clientesConCoords.length
        const centerLng = totalCoords.lng / clientesConCoords.length
        
        setCenter({ lat: centerLat, lng: centerLng })
        setZoom(clientesConCoords.length > 10 ? 10 : 12) // Ajustar zoom según la cantidad de clientes
      }
    }
  }, [clientes])

  // Parsear polígonos de zonas
  const zonasPaths = useMemo(() => {
    return zonas.map(zona => {
      const val: unknown = zona.poligono_geografico as unknown
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
    })
  }, [zonas])

  // Generar marcadores de clientes
  const clienteMarkers = useMemo(() => {
    return clientes
      .filter(cliente => cliente.ubicacion_gps)
      .map((cliente) => ({
        cliente,
        position: {
          lat: cliente.ubicacion_gps!.coordinates[1],
          lng: cliente.ubicacion_gps!.coordinates[0],
        },
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
          scaledSize: new google.maps.Size(32, 32),
        },
        label: {
          text: cliente.razon_social,
          color: '#555555',
          fontSize: '18px',
          fontWeight: 'bold',
        },  
      }))
  }, [clientes])

  // Generar marcadores de sucursales
  const sucursalMarkers = useMemo(() => {
    return sucursales.filter(sucursal => sucursal.ubicacion_gps).map((sucursal) => ({
      sucursal,
      position: {
        lat: sucursal.ubicacion_gps!.coordinates[1],
        lng: sucursal.ubicacion_gps!.coordinates[0],
      },
      icon: {
        url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
        scaledSize: new google.maps.Size(32, 32),
      },
      label: {
        text: sucursal.nombre_sucursal,
        color: '#555555',
        fontSize: '18px',
        fontWeight: 'bold',
      },
    }))
  }, [sucursales])

  return (
    <div className="flex h-full flex-col rounded-lg border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50 p-4">
        <h3 className="text-lg font-semibold text-gray-900">Mapa Completo</h3>
        <p className="text-sm text-gray-600">
          Visualización de todas las zonas, clientes y sucursales
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
              {/* Polígonos de zonas */}
              {zonasPaths.map((zonaPath, index) => (
                zonaPath.length > 0 && (
                  <Polygon
                    key={`zona-${index}`}
                    paths={zonaPath}
                    options={{
                      fillColor: '#dc2626',
                      fillOpacity: 0.1,
                      strokeColor: '#dc2626',
                      strokeOpacity: 0.6,
                      strokeWeight: 2,
                    }}
                  />
                )
              ))}

              {/* Marcadores de clientes */}
              {clienteMarkers.map((marker, index) => (
                <Marker
                  key={`cliente-${marker.cliente.id}`}
                  position={marker.position}
                  icon={marker.icon}
                  label={marker.label}
                  title={`Cliente: ${marker.cliente.razon_social}`}
                />
              ))}

              {/* Marcadores de sucursales */}
              {sucursalMarkers.map((marker, index) => (
                <Marker
                  key={`sucursal-${marker.sucursal.id}`}
                  position={marker.position}
                  icon={marker.icon}
                  label={marker.label}
                  title={`Sucursal: ${marker.sucursal.nombre_sucursal}`}
                />
              ))}
            </GoogleMap>
        )}
      </div>

      {/* Leyenda */}
      {!isLoading && (clientes.length > 0 || sucursales.length > 0) && (
        <div className="border-t border-gray-200 bg-gray-50 p-3">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex gap-4">
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <span>Cliente</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                <span>Sucursal</span>
              </div>
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
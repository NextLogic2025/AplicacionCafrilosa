import { useEffect, useMemo, useState } from 'react'
import { GoogleMap, Polygon, useJsApiLoader } from '@react-google-maps/api'
import AdvancedMarker from '../../../../components/google/AdvancedMarker'

import { Modal } from '../../../../components/ui/Modal'
import { Alert } from '../../../../components/ui/Alert'

import { obtenerSucursales, type Sucursal } from '../../../supervisor/services/sucursalesApi'
import { getSelectedRole } from '../../../../services/storage/roleStorage'
import type { Cliente } from '../../../supervisor/services/clientesApi'

import { GOOGLE_MAP_LIBRARIES, GOOGLE_MAP_SCRIPT_ID, GOOGLE_MAPS_API_KEY } from '../../../../config/googleMaps'

const mapStyle = { width: '100%', height: '320px' }
const defaultCenter: google.maps.LatLngLiteral = { lat: -0.180653, lng: -78.467834 }

interface ClienteDetailModalProps {
  isOpen: boolean
  onClose: () => void
  cliente: Cliente | null
}

export function ClienteDetailModal({ isOpen, onClose, cliente }: ClienteDetailModalProps) {
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [isLoadingSucursales, setIsLoadingSucursales] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { isLoaded, loadError } = useJsApiLoader({
    id: GOOGLE_MAP_SCRIPT_ID,
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAP_LIBRARIES
  })

  const modalTitle = getClienteDisplayName(cliente)
  const secondaryName = cliente ? getClienteSecondaryName(cliente, modalTitle) : null
  const apiKey = GOOGLE_MAPS_API_KEY

  useEffect(() => {
    if (!isOpen || !cliente) return
    const selectedRole = getSelectedRole()
    // Si el rol seleccionado en el frontend no está entre los permitidos, evitar la llamada
    // Incluir 'vendedor' porque el backend ya permite a vendedores ver sucursales
    if (!selectedRole || !['admin', 'supervisor', 'cliente', 'vendedor'].includes(selectedRole)) {
      setSucursales([])
      setError('No tienes autorización para ver las sucursales de este cliente.')
      return
    }
    let cancelado = false
    const cargarSucursales = async () => {
      try {
        setIsLoadingSucursales(true)
        setError(null)
        const data = await obtenerSucursales(cliente.id)
        if (!cancelado) setSucursales(data)
      } catch (err: any) {
        if (!cancelado) {
          const mensaje = err?.status === 403
            ? 'No tienes autorización para ver las sucursales de este cliente.'
            : err?.message || 'No se pudieron cargar las sucursales.'
          setError(mensaje)
          setSucursales([])
        }
      } finally {
        if (!cancelado) setIsLoadingSucursales(false)
      }
    }
    cargarSucursales()
    return () => {
      cancelado = true
    }
  }, [isOpen, cliente?.id])

  useEffect(() => {
    if (!isOpen) {
      setSucursales([])
      setError(null)
    }
  }, [isOpen])

  const zona = useMemo(() => cliente?.zona_comercial ?? null, [cliente])

  const zonaPath = useMemo(() => {
    if (!zona || !(zona as any)?.poligono_geografico) return []
    return parseGeoPolygon((zona as any).poligono_geografico)
  }, [zona])

  const mainLocation = useMemo(() => {
    if (!cliente) return null
    if (cliente.ubicacion_gps?.coordinates) {
      return { lat: cliente.ubicacion_gps.coordinates[1], lng: cliente.ubicacion_gps.coordinates[0] }
    }
    if (cliente.latitud != null && cliente.longitud != null) {
      return { lat: cliente.latitud, lng: cliente.longitud }
    }
    return null
  }, [cliente])

  const markersSucursales = useMemo(() => {
    return sucursales.reduce((acc, sucursal) => {
      const coords = sucursal.ubicacion_gps?.coordinates
      if (coords && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
        acc.push({ sucursal, marker: { lat: coords[1], lng: coords[0] } })
      }
      return acc
    }, [] as Array<{ sucursal: Sucursal; marker: google.maps.LatLngLiteral }>)
  }, [sucursales])

  const mapCenter = mainLocation || markersSucursales[0]?.marker || zonaPath[0] || defaultCenter

  const listaNombre = cliente?.lista_precios?.nombre ?? (cliente?.lista_precios_id ? `Lista ${cliente.lista_precios_id}` : null)
  const zonaNombre = zona?.nombre ?? (cliente?.zona_comercial_id ? `Zona ${cliente.zona_comercial_id}` : null)



  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Detalle del Cliente">
        <div className="p-6 text-center text-red-600">
          No se ha configurado la API Key de Google Maps
        </div>
      </Modal>
    )
  }
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} headerGradient="red" maxWidth="2xl">
      {!cliente && <p className="text-sm text-neutral-600">Selecciona un cliente para ver detalles.</p>}
      {cliente && (
        <div className="space-y-4">
          {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-lg font-bold text-neutral-900">{modalTitle}</p>
              {secondaryName && <p className="text-sm text-neutral-600">{secondaryName}</p>}
              <p className="text-sm text-neutral-700">
                {cliente.tipo_identificacion}: {cliente.identificacion}
              </p>
              {cliente.direccion_texto && <p className="text-sm text-neutral-700">Dirección: {cliente.direccion_texto}</p>}
              {zonaNombre && <p className="text-sm text-neutral-700">Zona: {zonaNombre}</p>}
              {listaNombre && <p className="text-sm text-neutral-700">Lista de precios: {listaNombre}</p>}
              <p className="text-xs text-neutral-500">Creado: {new Date(cliente.created_at).toLocaleDateString('es-EC')}</p>
            </div>

          </div>

          <div className="space-y-2 rounded-lg border border-neutral-200 bg-white p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-neutral-800">Mapa general</p>
              <span className="text-xs text-neutral-500">Pin rojo: matriz · Pins azules: sucursales</span>
            </div>
            {!apiKey && <p className="text-xs text-amber-700">Configura VITE_GOOGLE_MAPS_API_KEY para visualizar el mapa.</p>}
            {loadError && <p className="text-xs text-red-700">No se pudo cargar Google Maps.</p>}
            {!isLoaded && !loadError && (
              <div className="flex h-[320px] items-center justify-center rounded-lg bg-neutral-50 text-sm text-neutral-600">
                Cargando mapa...
              </div>
            )}
            {isLoaded && !loadError && apiKey && (
              <div className="overflow-hidden rounded-lg border border-neutral-200 shadow-sm">
                <GoogleMap
                  mapContainerStyle={mapStyle}
                  center={mapCenter}
                  zoom={zonaPath.length ? 13 : 12}
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

                  {mainLocation && (
                    <AdvancedMarker position={mainLocation} icon="http://maps.google.com/mapfiles/ms/icons/red-dot.png" title="Matriz" />
                  )}

                  {markersSucursales.map(({ sucursal, marker }) => (
                    <AdvancedMarker
                      key={sucursal.id}
                      position={marker}
                      icon="http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
                      title={sucursal.nombre_sucursal}
                    />
                  ))}
                </GoogleMap>
              </div>
            )}
            {mainLocation && (
              <div className="flex justify-end">
                <a
                  href={buildDirectionsUrl(mainLocation.lat, mainLocation.lng)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-brand-red transition hover:text-brand-red-dark"
                >
                  Ver ruta en Google Maps
                </a>
              </div>
            )}
          </div>

          <div className="space-y-2 rounded-lg border border-neutral-200 bg-white p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-neutral-800">Sucursales ({sucursales.length})</p>
              {isLoadingSucursales && <span className="text-xs text-neutral-500">Cargando...</span>}
            </div>
            {sucursales.length === 0 && !isLoadingSucursales && (
              <p className="text-sm text-neutral-600">No hay sucursales registradas.</p>
            )}
            <div className="grid gap-3 md:grid-cols-2">
              {sucursales.map((sucursal) => {
                const coords = sucursal.ubicacion_gps?.coordinates
                return (
                  <div key={sucursal.id} className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                    <p className="font-semibold text-neutral-900">{sucursal.nombre_sucursal}</p>
                    {sucursal.direccion_entrega && <p className="text-xs text-neutral-700">{sucursal.direccion_entrega}</p>}
                    {sucursal.zona_nombre && <p className="text-xs text-neutral-700">Zona: {sucursal.zona_nombre}</p>}
                    {sucursal.contacto_nombre && <p className="text-xs text-neutral-700">Contacto: {sucursal.contacto_nombre}</p>}
                    {sucursal.contacto_telefono && <p className="text-xs text-neutral-700">Tel: {sucursal.contacto_telefono}</p>}
                    {coords && (
                      <div className="mt-1 space-y-1">
                        <p className="text-xs font-medium text-emerald-600">
                          Ubicación: {coords[1].toFixed(6)}, {coords[0].toFixed(6)}
                        </p>
                        <a
                          href={buildDirectionsUrl(coords[1], coords[0])}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-red transition hover:text-brand-red-dark"
                        >
                          Cómo llegar
                        </a>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}

function parseGeoPolygon(value: unknown): google.maps.LatLngLiteral[] {
  if (!value) return []

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return parseGeoPolygon(parsed)
    } catch (error) {
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

function buildDirectionsUrl(lat: number, lng: number): string {
  const destination = `${lat},${lng}`
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`
}

export function getClienteDisplayName(cliente: Cliente | null | undefined): string {
  if (!cliente) return 'Detalle del Cliente'
  const candidates: Array<unknown> = [
    (cliente as any)?.contacto_nombre,
    (cliente as any)?.nombre_cliente,
    cliente.nombre_comercial,
    cliente.razon_social,
  ]
  for (const candidate of candidates) {
    if (typeof candidate === 'string') {
      const trimmed = candidate.trim()
      if (trimmed.length > 0) return trimmed
    }
  }
  return 'Detalle del Cliente'
}

export function getClienteSecondaryName(cliente: Cliente, primary: string): string | null {
  const primaryLower = primary.toLowerCase()
  const candidates: Array<unknown> = [
    cliente.razon_social,
    cliente.nombre_comercial,
    (cliente as any)?.contacto_nombre,
    (cliente as any)?.nombre_cliente,
  ]
  for (const candidate of candidates) {
    if (typeof candidate === 'string') {
      const trimmed = candidate.trim()
      if (trimmed.length > 0 && trimmed.toLowerCase() !== primaryLower) {
        return trimmed
      }
    }
  }
  return null
}

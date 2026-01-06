import { useEffect, useMemo, useState } from 'react'
import { Modal } from 'components/ui/Modal'
import { Alert } from 'components/ui/Alert'
import { GoogleMap, Marker, Polygon, useJsApiLoader } from '@react-google-maps/api'
import { obtenerSucursales, type Sucursal } from '../../services/sucursalesApi'
import { type Cliente, type ZonaComercial, type ListaPrecio } from '../../services/clientesApi'

const GOOGLE_MAP_LIBRARIES: ["drawing"] = ['drawing']
const mapStyle = { width: '100%', height: '320px' }
const defaultCenter: google.maps.LatLngLiteral = { lat: -0.180653, lng: -78.467834 }

interface ClienteDetailModalProps {
  isOpen: boolean
  onClose: () => void
  cliente: Cliente | null
  zonas: ZonaComercial[]
  listasPrecios: ListaPrecio[]
}

export function ClienteDetailModal({ isOpen, onClose, cliente, zonas, listasPrecios }: ClienteDetailModalProps) {
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [isLoadingSucursales, setIsLoadingSucursales] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string || ''
  const { isLoaded, loadError } = useJsApiLoader({ googleMapsApiKey: apiKey, libraries: GOOGLE_MAP_LIBRARIES })

  useEffect(() => {
    if (!isOpen || !cliente) return
    const fetchSucursales = async () => {
      try {
        setIsLoadingSucursales(true)
        setError(null)
        const data = await obtenerSucursales(cliente.id)
        setSucursales(data)
      } catch (e: any) {
        setError(e?.message || 'No se pudieron cargar las sucursales')
      } finally {
        setIsLoadingSucursales(false)
      }
    }
    fetchSucursales()
  }, [isOpen, cliente])

  const zona = useMemo(() => zonas.find((z) => z.id === cliente?.zona_comercial_id) || cliente?.zona_comercial, [cliente, zonas])

  const zonaPath = useMemo(() => {
    if (!zona || !(zona as any)?.poligono_geografico) return []
    return parseGeoPolygon((zona as any).poligono_geografico)
  }, [zona])

  const mainLocation = useMemo(() => {
    if (!cliente) return null
    if (cliente.ubicacion_gps?.coordinates) {
      return { lat: cliente.ubicacion_gps.coordinates[1], lng: cliente.ubicacion_gps.coordinates[0] }
    }
    if (cliente.latitud && cliente.longitud) return { lat: cliente.latitud, lng: cliente.longitud }
    return null
  }, [cliente])

  const markersSucursales = useMemo<Array<Sucursal & { _marker: google.maps.LatLngLiteral }>>(() => {
    return sucursales.reduce((acc, s) => {
      const coords = (s as any).ubicacion_gps?.coordinates as [number, number] | undefined
      if (coords && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
        acc.push({ ...s, _marker: { lat: coords[1], lng: coords[0] } })
      }
      return acc
    }, [] as Array<Sucursal & { _marker: google.maps.LatLngLiteral }>)
  }, [sucursales])

  const mapCenter = mainLocation || markersSucursales[0]?._marker || zonaPath[0] || defaultCenter

  const listaNombre = cliente?.lista_precios?.nombre || listasPrecios.find(l => l.id === cliente?.lista_precios_id)?.nombre
  const zonaNombre = cliente?.zona_comercial?.nombre || zona?.nombre

  const creditoDisponible = cliente?.tiene_credito && cliente.limite_credito
    ? (parseFloat(cliente.limite_credito) - parseFloat(cliente.saldo_actual)).toFixed(2)
    : '0.00'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalle del Cliente" headerGradient="red" maxWidth="2xl">
      {!cliente && <p className="text-sm text-gray-600">Selecciona un cliente para ver detalles.</p>}
      {cliente && (
        <div className="space-y-4">
          {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-lg font-bold text-gray-900">{cliente.razon_social}</p>
              {cliente.nombre_comercial && <p className="text-sm text-gray-600">{cliente.nombre_comercial}</p>}
              <p className="text-sm text-gray-700">{cliente.tipo_identificacion}: {cliente.identificacion}</p>
              {cliente.direccion_texto && <p className="text-sm text-gray-700">Dirección: {cliente.direccion_texto}</p>}
              {zonaNombre && <p className="text-sm text-gray-700">Zona: {zonaNombre}</p>}
              {listaNombre && <p className="text-sm text-gray-700">Lista de precios: {listaNombre}</p>}
              <p className="text-xs text-gray-500">Creado: {new Date(cliente.created_at).toLocaleDateString('es-ES')}</p>
            </div>
            <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs font-semibold text-gray-700">Crédito</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Límite</p>
                  <p className="font-semibold text-gray-900">${cliente.limite_credito}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Saldo</p>
                  <p className="font-semibold text-gray-900">${cliente.saldo_actual}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Disponible</p>
                  <p className="font-semibold text-green-700">${creditoDisponible}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Plazo</p>
                  <p className="font-semibold text-gray-900">{cliente.dias_plazo} días</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-800">Mapa general</p>
              <span className="text-xs text-gray-500">Pin rojo: matriz · Pins azules: sucursales</span>
            </div>
            {!apiKey && <p className="text-xs text-yellow-700">Configura VITE_GOOGLE_MAPS_API_KEY para ver el mapa.</p>}
            {loadError && <p className="text-xs text-red-700">No se pudo cargar Google Maps.</p>}
            {!isLoaded && !loadError && (
              <div className="flex h-[320px] items-center justify-center rounded-lg bg-gray-50">
                <p className="text-sm text-gray-600">Cargando mapa...</p>
              </div>
            )}
            {isLoaded && !loadError && apiKey && (
              <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
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
                    <Marker
                      position={mainLocation}
                      icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' }}
                      title="Matriz"
                    />
                  )}

                  {markersSucursales.map((s) => (
                    <Marker
                      key={s.id}
                      position={(s as any)._marker}
                      icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png' }}
                      title={s.nombre_sucursal}
                      animation={google.maps.Animation.DROP}
                    />
                  ))}
                </GoogleMap>
              </div>
            )}
          </div>

          <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-800">Sucursales ({sucursales.length})</p>
              {isLoadingSucursales && <span className="text-xs text-gray-500">Cargando...</span>}
            </div>
            {sucursales.length === 0 && !isLoadingSucursales && (
              <p className="text-sm text-gray-600">No hay sucursales registradas.</p>
            )}
            <div className="grid gap-3 md:grid-cols-2">
              {sucursales.map((s) => {
                const coords = (s as any).ubicacion_gps?.coordinates as [number, number] | undefined
                return (
                  <div key={s.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <p className="font-semibold text-gray-900">{s.nombre_sucursal}</p>
                    {s.direccion_entrega && <p className="text-xs text-gray-700">{s.direccion_entrega}</p>}
                    {s.contacto_nombre && <p className="text-xs text-gray-700">Contacto: {s.contacto_nombre}</p>}
                    {s.contacto_telefono && <p className="text-xs text-gray-700">Tel: {s.contacto_telefono}</p>}
                    {coords && (
                      <p className="text-xs text-green-700 font-medium">Ubicación: {coords[1].toFixed(6)}, {coords[0].toFixed(6)}</p>
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

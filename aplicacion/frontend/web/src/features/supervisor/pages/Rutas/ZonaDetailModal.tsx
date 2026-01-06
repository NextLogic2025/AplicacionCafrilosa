import { GoogleMap, Polygon, useJsApiLoader } from '@react-google-maps/api'
import { Alert } from 'components/ui/Alert'
import { Modal } from 'components/ui/Modal'
import { type ZonaComercial } from '../../services/zonasApi'

const GOOGLE_MAP_LIBRARIES: ["drawing"] = ['drawing']
const containerStyle = { width: '100%', height: '320px' }
const defaultCenter: google.maps.LatLngLiteral = { lat: -0.180653, lng: -78.467834 }

interface ZonaDetailModalProps {
  zona: ZonaComercial | null
  isOpen: boolean
  onClose: () => void
}

export function ZonaDetailModal({ zona, isOpen, onClose }: ZonaDetailModalProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined
  const path = parseGeoPolygon(zona?.poligono_geografico)

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey ?? '',
    libraries: GOOGLE_MAP_LIBRARIES,
  })

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={zona ? `Zona ${zona.nombre}` : 'Detalle de zona'} headerGradient="red" maxWidth="xl">
      {!zona ? (
        <Alert type="error" message="No se encontró información de la zona." />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm text-neutral-700">
            <Info label="Código" value={zona.codigo} />
            <Info label="Nombre" value={zona.nombre} />
            <Info label="Ciudad" value={zona.ciudad || '—'} />
            <Info label="Macrorregión" value={zona.macrorregion || '—'} />
            <Info label="Vendedor" value={zona.vendedor_asignado?.nombre_vendedor_cache || '—'} />
            <Info label="Estado" value={zona.activo ? 'Activa' : 'Inactiva'} highlight={zona.activo ? 'green' : 'gray'} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-neutral-800">Mapa de la zona</h4>
              <span className="text-[11px] text-neutral-500">Vista solo lectura</span>
            </div>

            {!apiKey ? (
              <Alert type="error" message="Configura VITE_GOOGLE_MAPS_API_KEY para ver el mapa." />
            ) : loadError ? (
              <Alert type="error" message="No se pudo cargar Google Maps." />
            ) : !isLoaded ? (
              <div className="flex h-[320px] items-center justify-center text-sm text-neutral-600">Cargando mapa...</div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-neutral-200 shadow-sm">
                <GoogleMap
                  mapContainerStyle={containerStyle}
                  center={path[0] ?? defaultCenter}
                  zoom={path.length ? 13 : 12}
                  options={{
                    fullscreenControl: false,
                    mapTypeControl: false,
                    streetViewControl: false,
                    clickableIcons: false,
                  }}
                >
                  {path.length ? (
                    <Polygon
                      path={path}
                      options={{
                        fillColor: '#f0412d',
                        fillOpacity: 0.22,
                        strokeColor: '#f0412d',
                        strokeOpacity: 0.9,
                        strokeWeight: 2,
                      }}
                    />
                  ) : null}
                </GoogleMap>
              </div>
            )}

            {path.length ? (
              <p className="text-[11px] text-neutral-600">Vértices: {path.length}. Se muestra el polígono guardado.</p>
            ) : (
              <p className="text-[11px] text-neutral-500">Esta zona aún no tiene polígono guardado.</p>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}

function Info({ label, value, highlight }: { label: string; value: string; highlight?: 'green' | 'gray' }) {
  const isPill = highlight !== undefined
  return (
    <div className="space-y-1">
      <p className="text-[11px] uppercase tracking-wide text-neutral-500">{label}</p>
      {isPill ? (
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
            highlight === 'green' ? 'bg-green-100 text-green-800' : 'bg-neutral-100 text-neutral-700'
          }`}
        >
          {value}
        </span>
      ) : (
        <p className="text-neutral-800">{value}</p>
      )}
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
      console.warn('No se pudo parsear polígono desde string', e)
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

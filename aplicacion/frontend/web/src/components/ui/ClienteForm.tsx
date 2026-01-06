import { TextField } from './TextField'
import { GoogleMap, Polygon, Marker, useJsApiLoader } from '@react-google-maps/api'
import { useMemo, useState, useEffect } from 'react'

export type ClienteFormValues = {
  contacto_nombre: string
  contacto_email: string
  contacto_password: string
  identificacion: string
  tipo_identificacion: string
  razon_social: string
  nombre_comercial: string
  tiene_credito: boolean
  limite_credito: number
  dias_plazo: number
  direccion_texto: string
  lista_precios_id: number | null
  zona_comercial_id: number | null
  latitud?: number | null
  longitud?: number | null
}

export type ZonaOption = { 
  id: number; 
  nombre: string; 
  descripcion?: string;
  poligono_geografico?: unknown;
}
export type ListaPrecioOption = { id: number; nombre: string; descripcion?: string; activo?: boolean }

export const TIPOS_IDENTIFICACION = ['RUC', 'Cédula', 'Pasaporte']

export const CLIENTE_FORM_DEFAULT: ClienteFormValues = {
  contacto_nombre: '',
  contacto_email: '',
  contacto_password: '',
  identificacion: '',
  tipo_identificacion: 'RUC',
  razon_social: '',
  nombre_comercial: '',
  tiene_credito: false,
  limite_credito: 0,
  dias_plazo: 0,
  direccion_texto: '',
  lista_precios_id: null,
  zona_comercial_id: null,
  latitud: null,
  longitud: null,
}

export function validateClienteForm(value: ClienteFormValues, mode: 'create' | 'edit'): Record<string, string> {
  const newErrors: Record<string, string> = {}

  // Solo validar datos de acceso en modo crear
  if (mode === 'create') {
    if (!value.contacto_nombre.trim()) {
      newErrors.contacto_nombre = 'El nombre del contacto es requerido'
    }

    if (!value.contacto_email.trim()) {
      newErrors.contacto_email = 'El email del contacto es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.contacto_email)) {
      newErrors.contacto_email = 'Email inválido'
    }

    if (!value.contacto_password) {
      newErrors.contacto_password = 'La contraseña es requerida'
    } else if (value.contacto_password.length < 6) {
      newErrors.contacto_password = 'La contraseña debe tener al menos 6 caracteres'
    }
  }

  if (!value.identificacion.trim()) {
    newErrors.identificacion = 'La identificación es requerida'
  }

  if (!value.razon_social.trim()) {
    newErrors.razon_social = 'La razón social es requerida'
  }

  if (value.tiene_credito && value.limite_credito <= 0) {
    newErrors.limite_credito = 'El límite de crédito debe ser mayor a 0'
  }

  if (value.tiene_credito && value.dias_plazo < 0) {
    newErrors.dias_plazo = 'Los días de plazo no pueden ser negativos'
  }

  return newErrors
}

interface ClienteFormProps {
  value: ClienteFormValues
  errors: Record<string, string>
  mode: 'create' | 'edit'
  isSubmitting: boolean
  isCatalogLoading: boolean
  zonas: ZonaOption[]
  listasPrecios: ListaPrecioOption[]
  onChange: (next: ClienteFormValues) => void
  step?: 1 | 2 | 3
}

export function ClienteForm({
  value,
  errors,
  mode,
  isSubmitting,
  isCatalogLoading,
  zonas,
  listasPrecios,
  onChange,
  step = 1,
}: ClienteFormProps) {
  const update = <K extends keyof ClienteFormValues>(key: K, val: ClienteFormValues[K]) => {
    onChange({ ...value, [key]: val })
  }

  const listaChips = listasPrecios.length > 0 ? listasPrecios : [{ id: 0, nombre: 'General' }]

  // Cargar Google Maps una sola vez para todo el formulario
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey ?? '',
    libraries: ['drawing'],
  })

  // Paso 1: Datos de acceso, información personal y configuración
  if (step === 1) {
    return (
      <>
        {/* Datos de Acceso - Solo en modo crear */}
        {mode === 'create' && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4">
            <p className="text-sm font-semibold text-gray-800">Datos de Acceso</p>
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="Nombre del contacto"
                tone="light"
                type="text"
                placeholder="Ej: Juan Pérez"
                value={value.contacto_nombre}
                onChange={(e) => update('contacto_nombre', e.target.value)}
                error={errors.contacto_nombre}
                disabled={isSubmitting}
              />

              <TextField
                label="Correo del contacto"
                tone="light"
                type="email"
                placeholder="contacto@cliente.com"
                value={value.contacto_email}
                onChange={(e) => update('contacto_email', e.target.value)}
                error={errors.contacto_email}
                disabled={isSubmitting}
              />
            </div>

            <TextField
              label="Contraseña"
              tone="light"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={value.contacto_password}
              onChange={(e) => update('contacto_password', e.target.value)}
              error={errors.contacto_password}
              disabled={isSubmitting}
            />
          </div>
        )}

        {/* Información Comercial */}
        <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm font-semibold text-gray-800">Información Comercial</p>

          <TextField
            label="Razón Social"
            tone="light"
            type="text"
            placeholder="Ej. Empresa S.A."
            value={value.razon_social}
            onChange={(e) => update('razon_social', e.target.value)}
            error={errors.razon_social}
            disabled={isSubmitting}
          />

          <TextField
            label="Nombre Comercial"
            tone="light"
            type="text"
            placeholder="Ej. Tienda El Chavo"
            value={value.nombre_comercial}
            onChange={(e) => update('nombre_comercial', e.target.value)}
            disabled={isSubmitting}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-xs text-neutral-600">Tipo de Identificación</label>
              <select
                value={value.tipo_identificacion}
                onChange={(e) => update('tipo_identificacion', e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-neutral-900 outline-none transition focus:border-brand-red/60 focus:shadow-[0_0_0_4px_rgba(240,65,45,0.18)] disabled:opacity-50"
                disabled={isSubmitting}
              >
                {TIPOS_IDENTIFICACION.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </div>

            <TextField
              label="Identificación (RUC/Cédula)"
              tone="light"
              type="text"
              placeholder="Ej. 177777777001"
              value={value.identificacion}
              onChange={(e) => update('identificacion', e.target.value)}
              error={errors.identificacion}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Configuración */}
        <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm font-semibold text-gray-800">Configuración</p>

          <div className="grid gap-2">
            <label className="text-xs text-neutral-600">Lista de Precios Asignada</label>
            <div className="flex flex-wrap gap-2">
              {listaChips.map((lista) => {
                const selected = value.lista_precios_id === lista.id || (lista.id === 0 && value.lista_precios_id === null)
                return (
                  <button
                    type="button"
                    key={lista.id}
                    onClick={() => update('lista_precios_id', lista.id === 0 ? null : lista.id)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      selected ? 'bg-brand-red text-white shadow' : 'bg-white text-neutral-700 hover:bg-neutral-100'
                    }`}
                    disabled={isSubmitting || isCatalogLoading}
                  >
                    {lista.nombre}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-dashed border-neutral-200 bg-white p-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="tiene_credito"
                checked={value.tiene_credito}
                onChange={(e) => update('tiene_credito', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
                disabled={isSubmitting}
              />
              <label htmlFor="tiene_credito" className="text-sm font-medium text-neutral-700">
                Tiene Crédito
              </label>
            </div>

            {value.tiene_credito && (
              <div className="grid gap-4 md:grid-cols-2">
                <TextField
                  label="Límite de Crédito"
                  tone="light"
                  type="number"
                  placeholder="0.00"
                  value={value.limite_credito}
                  onChange={(e) => update('limite_credito', parseFloat(e.target.value) || 0)}
                  error={errors.limite_credito}
                  disabled={isSubmitting}
                />

                <TextField
                  label="Días de Plazo"
                  tone="light"
                  type="number"
                  placeholder="30"
                  value={value.dias_plazo}
                  onChange={(e) => update('dias_plazo', parseInt(e.target.value) || 0)}
                  error={errors.dias_plazo}
                  disabled={isSubmitting}
                />
              </div>
            )}
          </div>
        </div>

        {/* Zona Comercial con Mapa */}
        <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
          <div className="grid gap-2">
            <label className="text-xs text-neutral-600">Zona Comercial</label>
            <select
              value={value.zona_comercial_id ?? ''}
              onChange={(e) => update('zona_comercial_id', e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-neutral-900 outline-none transition focus:border-brand-red/60 focus:shadow-[0_0_0_4px_rgba(240,65,45,0.18)] disabled:opacity-50"
              disabled={isSubmitting || isCatalogLoading}
            >
              <option value="">Seleccionar zona</option>
              {zonas.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Mapa de la zona seleccionada */}
          {value.zona_comercial_id && (
            <ZonaMapDisplay 
              zonaId={value.zona_comercial_id} 
              zonas={zonas} 
              isLoaded={isLoaded}
              loadError={loadError}
            />
          )}
        </div>
      </>
    )
  }

  // Paso 2: Ubicación (dirección)
  if (step === 2) {
    return (
      <div className="space-y-4">
        <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm font-semibold text-gray-800">Dirección Matriz</p>

          <TextField
            label="Dirección"
            tone="light"
            type="text"
            placeholder="Ej. Av. Principal 123 y Calle Secundaria"
            value={value.direccion_texto}
            onChange={(e) => update('direccion_texto', e.target.value)}
            disabled={isSubmitting}
          />

          {/* Coordenadas si están establecidas */}
          {value.latitud && value.longitud && (
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-xs text-green-800">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Ubicación: {value.latitud.toFixed(6)}, {value.longitud.toFixed(6)}</span>
            </div>
          )}
        </div>

        {/* Mapa interactivo para colocar pin */}
        <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-800">Ubicación en el Mapa</p>
            <span className="text-xs text-gray-500">Haz clic en el mapa para marcar la ubicación</span>
          </div>
          
          {!value.zona_comercial_id && (
            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 mb-2">
              <p className="text-xs text-yellow-800">
                ⚠️ No has seleccionado una zona comercial en el Paso 1. Se recomienda seleccionar una zona primero.
              </p>
            </div>
          )}
          
          <LocationPicker
            position={value.latitud && value.longitud ? { lat: value.latitud, lng: value.longitud } : null}
            zonaId={value.zona_comercial_id}
            zonas={zonas}
            isLoaded={isLoaded}
            loadError={loadError}
            onChange={(pos) => {
              update('latitud', pos.lat)
              update('longitud', pos.lng)
            }}
          />
        </div>
      </div>
    )
  }

  // Paso 3: Ya se renderiza directamente en CrearClienteModal
  return null
}

// Componente para mostrar el mapa de la zona seleccionada
const containerStyle = { width: '100%', height: '280px' }
const defaultCenter: google.maps.LatLngLiteral = { lat: -0.180653, lng: -78.467834 }

function ZonaMapDisplay({ 
  zonaId, 
  zonas, 
  isLoaded, 
  loadError 
}: { 
  zonaId: number; 
  zonas: ZonaOption[]; 
  isLoaded: boolean; 
  loadError: Error | undefined;
}) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined
  const zona = zonas.find((z) => z.id === zonaId)

  const path = useMemo(() => {
    if (!zona || !('poligono_geografico' in zona)) return []
    return parseGeoPolygon((zona as any).poligono_geografico)
  }, [zona])

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
      <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
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
          {path.length > 0 && (
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
          )}
        </GoogleMap>
      </div>
      {path.length > 0 ? (
        <p className="text-xs text-gray-600">Polígono de la zona: {zona?.nombre}</p>
      ) : (
        <p className="text-xs text-gray-500">Esta zona no tiene polígono geográfico definido.</p>
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

// Componente para seleccionar ubicación con pin en el mapa
const locationMapStyle = { width: '100%', height: '400px' }
const defaultLocationCenter: google.maps.LatLngLiteral = { lat: -0.180653, lng: -78.467834 }

interface LocationPickerProps {
  position: google.maps.LatLngLiteral | null
  zonaId: number | null
  zonas: ZonaOption[]
  isLoaded: boolean
  loadError: Error | undefined
  onChange: (position: google.maps.LatLngLiteral) => void
}

function LocationPicker({ position, zonaId, zonas, isLoaded, loadError, onChange }: LocationPickerProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined
  const [tempMarker, setTempMarker] = useState<google.maps.LatLngLiteral | null>(position)

  // Obtener el polígono de la zona seleccionada
  const zonaPath = useMemo(() => {
    if (!zonaId) return []
    const zona = zonas.find((z) => z.id === zonaId)
    if (!zona || !('poligono_geografico' in zona)) return []
    return parseGeoPolygon((zona as any).poligono_geografico)
  }, [zonaId, zonas])

  // Calcular el centro del polígono para centrar el mapa
  const mapCenter = useMemo(() => {
    if (tempMarker) return tempMarker
    if (zonaPath.length > 0) return zonaPath[0]
    return defaultLocationCenter
  }, [tempMarker, zonaPath])

  // Actualizar tempMarker cuando position cambie (para edición)
  useEffect(() => {
    setTempMarker(position)
  }, [position])

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() }
      console.log('Mapa clickeado:', newPos)
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
      <div className="flex h-[400px] items-center justify-center rounded-lg bg-gray-50">
        <p className="text-sm text-gray-600">Cargando mapa...</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
        <GoogleMap
          mapContainerStyle={locationMapStyle}
          center={mapCenter}
          zoom={zonaPath.length > 0 ? 13 : tempMarker ? 15 : 12}
          onClick={handleMapClick}
          options={{
            fullscreenControl: false,
            mapTypeControl: false,
            streetViewControl: false,
            clickableIcons: false,
          }}
        >
          {/* Polígono de la zona */}
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
          
          {/* Marcador de ubicación */}
          {tempMarker && (
            <Marker
              position={tempMarker}
              animation={google.maps.Animation.DROP}
            />
          )}
        </GoogleMap>
      </div>
      
      {zonaPath.length > 0 && (
        <p className="text-xs text-gray-600">
          Polígono de la zona comercial visible. Haz clic dentro o cerca del área para marcar la ubicación.
        </p>
      )}
    </div>
  )
}
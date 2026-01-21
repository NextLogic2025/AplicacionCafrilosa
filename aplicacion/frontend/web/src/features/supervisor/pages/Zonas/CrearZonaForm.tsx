import { useEffect, useMemo, useState } from 'react'
import { TextField } from 'components/ui/TextField'
import { Alert } from 'components/ui/Alert'
import { type CreateZonaDto } from '../../services/zonasApi'
import { type Vendedor } from '../../services/usuariosApi'
import { ZonaMapSelector } from './ZonaMapSelector'
import { ECUADOR_LOCATIONS } from './ecuadorLocations'

type LatLngLiteral = google.maps.LatLngLiteral

interface CrearZonaFormProps {
  formData: CreateZonaDto
  setFormData: React.Dispatch<React.SetStateAction<CreateZonaDto>>
  formErrors: Record<string, string>
  vendedores: Vendedor[]
  vendedorSeleccionado: string
  setVendedorSeleccionado: (value: string) => void
  submitMessage: { type: 'success' | 'error'; message: string } | null
  isSubmitting: boolean
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  isEditing?: boolean
}

export function CrearZonaForm({
  formData,
  setFormData,
  formErrors,
  vendedores,
  vendedorSeleccionado,
  setVendedorSeleccionado,
  submitMessage,
  isSubmitting,
  onSubmit,
  onCancel,
  isEditing = false,
}: CrearZonaFormProps) {
  const [polygonPath, setPolygonPath] = useState<LatLngLiteral[]>([])
  const [mapCenter, setMapCenter] = useState<LatLngLiteral | undefined>(undefined)
  const [selectedProvincia, setSelectedProvincia] = useState<string>('')

  const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined

  const parsedInitialPolygon = useMemo(() => parseGeoPolygon(formData.poligono_geografico), [formData.poligono_geografico])

  useEffect(() => {
    setPolygonPath(parsedInitialPolygon)
  }, [parsedInitialPolygon])

  // Detectar provincia inicial si estamos editando y tenemos ciudad
  useEffect(() => {
    if (isEditing && formData.ciudad && !selectedProvincia) {
      // Buscar la provincia que contiene esta ciudad
      const found = ECUADOR_LOCATIONS.find(p => p.cities.some(c => c.name === formData.ciudad))
      if (found) {
        setSelectedProvincia(found.province)
      }
    }
  }, [isEditing, formData.ciudad])

  const handleProvinciaChange = (provinciaName: string) => {
    setSelectedProvincia(provinciaName)
    const provincia = ECUADOR_LOCATIONS.find(p => p.province === provinciaName)

    if (provincia) {
      // Actualizar macrorregión automáticamente
      const macroMap: Record<string, string> = {
        'Sierra': 'Sierra',
        'Costa': 'Costa',
        'Amazonia': 'Oriente', // Mapeo de Amazonía a Oriente
        'Insular': 'Galápagos' // O lo que uses en tu backend
      }

      const mappedMacro = macroMap[provincia.macro] || provincia.macro

      setFormData(prev => ({
        ...prev,
        macrorregion: mappedMacro,
        ciudad: '' // Resetear ciudad al cambiar provincia
      }))
    } else {
      setFormData(prev => ({ ...prev, ciudad: '' }))
    }
  }

  const handleCiudadChange = (ciudadName: string) => {
    setFormData(prev => ({ ...prev, ciudad: ciudadName }))

    // Centrar mapa en la ciudad seleccionada
    const provincia = ECUADOR_LOCATIONS.find(p => p.province === selectedProvincia)
    const ciudad = provincia?.cities.find(c => c.name === ciudadName)

    if (ciudad) {
      setMapCenter({ lat: ciudad.lat, lng: ciudad.lng })
    }
  }

  const handlePolygonChange = (path: LatLngLiteral[]) => {
    setPolygonPath(path)
    setFormData((prev) => ({
      ...prev,
      poligono_geografico: path.length >= 3 ? toGeoJsonPolygon(path) : null,
    }))
  }

  const activeCities = useMemo(() => {
    return ECUADOR_LOCATIONS.find(p => p.province === selectedProvincia)?.cities || []
  }, [selectedProvincia])

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      {submitMessage ? <Alert type={submitMessage.type} message={submitMessage.message} /> : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextField
          label="Código"
          placeholder="Ej. ZN-01"
          value={formData.codigo}
          onChange={(e) => setFormData((prev) => ({ ...prev, codigo: e.target.value }))}
          error={formErrors.codigo}
          tone="light"
          required
          disabled={isEditing}
        />

        <TextField
          label="Nombre"
          placeholder="Zona norte"
          value={formData.nombre}
          onChange={(e) => setFormData((prev) => ({ ...prev, nombre: e.target.value }))}
          error={formErrors.nombre}
          tone="light"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Selector de Provincia */}
        <div className="grid gap-2">
          <label className="text-xs text-neutral-600">Provincia</label>
          <select
            value={selectedProvincia}
            onChange={(e) => handleProvinciaChange(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-neutral-900 outline-none transition focus:border-brand-red/60 focus:shadow-[0_0_0_4px_rgba(240,65,45,0.18)]"
          >
            <option value="">Seleccione provincia</option>
            {ECUADOR_LOCATIONS.map(loc => (
              <option key={loc.province} value={loc.province}>{loc.province}</option>
            ))}
          </select>
        </div>

        {/* Selector de Ciudad (filtrado) */}
        <div className="grid gap-2">
          <label className="text-xs text-neutral-600">Ciudad</label>
          <select
            value={formData.ciudad ?? ''}
            onChange={(e) => handleCiudadChange(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-neutral-900 outline-none transition focus:border-brand-red/60 focus:shadow-[0_0_0_4px_rgba(240,65,45,0.18)] disabled:opacity-50"
            disabled={!selectedProvincia}
          >
            <option value="">Seleccione ciudad</option>
            {activeCities.map(city => (
              <option key={city.name} value={city.name}>{city.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <label className="text-xs text-neutral-600">Macrorregión (Automático)</label>
          <input
            value={formData.macrorregion ?? ''}
            readOnly
            className="w-full rounded-xl border border-neutral-200 bg-gray-100 px-3 py-2.5 text-neutral-600 outline-none"
          />
        </div>

        <div className="grid gap-2">
          <label className="text-xs text-neutral-600">Vendedor asignado (opcional)</label>
          <select
            value={vendedorSeleccionado}
            onChange={(e) => setVendedorSeleccionado(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-neutral-900 outline-none transition focus:border-brand-red/60 focus:shadow-[0_0_0_4px_rgba(240,65,45,0.18)]"
          >
            <option value="">Sin asignar</option>
            {Array.isArray(vendedores) && vendedores.map((v) => (
              <option key={v.id} value={v.id}>
                {(v.nombreCompleto || v.nombre || '') + ' - ' + v.email}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-neutral-700">Área geográfica (polígono)</label>
          <span className="text-[11px] text-neutral-500">Opcional, ayuda a limitar la zona</span>
        </div>
        <ZonaMapSelector
          polygon={polygonPath}
          onPolygonChange={handlePolygonChange}
          center={mapCenter}
        />
        {polygonPath.length > 0 ? (
          <p className="text-[11px] text-neutral-600">Vertices: {polygonPath.length} | Se guardará como polígono GeoJSON.</p>
        ) : (
          <p className="text-[11px] text-neutral-500">Dibuja en el mapa para delimitar la zona.</p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center justify-center rounded-xl px-4 py-3 font-extrabold transition bg-gray-200 text-gray-800 hover:bg-gray-300"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-xl px-4 py-3 font-extrabold transition bg-brand-red text-white hover:bg-brand-red/90 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar zona' : 'Guardar zona'}
        </button>
      </div>
    </form>
  )
}

function parseGeoPolygon(value: unknown): LatLngLiteral[] {
  if (!value) return []

  if (Array.isArray(value) && value.every((p: any) => typeof p?.lat === 'number' && typeof p?.lng === 'number')) {
    return dedupeClosingPoint(value as LatLngLiteral[])
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
        .filter(Boolean) as LatLngLiteral[]
      return dedupeClosingPoint(path)
    }
  }

  return []
}

function dedupeClosingPoint(path: LatLngLiteral[]): LatLngLiteral[] {
  if (path.length < 2) return path
  const first = path[0]
  const last = path[path.length - 1]
  if (first.lat === last.lat && first.lng === last.lng) {
    return path.slice(0, -1)
  }
  return path
}

function toGeoJsonPolygon(path: LatLngLiteral[]) {
  if (!Array.isArray(path) || path.length < 3) return null
  const ring = path.map((point) => [point.lng, point.lat])
  const first = ring[0]
  const last = ring[ring.length - 1]
  if (first[0] !== last[0] || first[1] !== last[1]) {
    ring.push([...first])
  }
  return {
    type: 'Polygon',
    coordinates: [ring],
  }
}

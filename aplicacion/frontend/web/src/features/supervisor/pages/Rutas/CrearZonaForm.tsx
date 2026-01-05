import { useEffect, useMemo, useState } from 'react'
import { TextField } from 'components/ui/TextField'
import { Alert } from 'components/ui/Alert'
import { type CreateZonaDto } from '../../services/zonasApi'
import { type Vendedor } from '../../services/usuariosApi'
import { ZonaMapSelector } from './ZonaMapSelector'

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

  const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined

  const parsedInitialPolygon = useMemo(() => parseGeoPolygon(formData.poligono_geografico), [formData.poligono_geografico])

  useEffect(() => {
    setPolygonPath(parsedInitialPolygon)
  }, [parsedInitialPolygon])

  const handlePolygonChange = (path: LatLngLiteral[]) => {
    setPolygonPath(path)
    setFormData((prev) => ({
      ...prev,
      poligono_geografico: path.length >= 3 ? toGeoJsonPolygon(path) : null,
    }))
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      {submitMessage ? <Alert type={submitMessage.type} message={submitMessage.message} /> : null}

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

      <TextField
        label="Ciudad (opcional)"
        placeholder="Ciudad principal"
        value={formData.ciudad ?? ''}
        onChange={(e) => setFormData((prev) => ({ ...prev, ciudad: e.target.value }))}
        tone="light"
      />

      <TextField
        label="Macrorregión (opcional)"
        placeholder="Costa, Sierra, Oriente..."
        value={formData.macrorregion ?? ''}
        onChange={(e) => setFormData((prev) => ({ ...prev, macrorregion: e.target.value }))}
        tone="light"
      />

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
              {v.nombre} - {v.email}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-neutral-700">Área geográfica (polígono)</label>
          <span className="text-[11px] text-neutral-500">Opcional, ayuda a limitar la zona</span>
        </div>
        <ZonaMapSelector apiKey={mapsApiKey} polygon={polygonPath} onPolygonChange={handlePolygonChange} />
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

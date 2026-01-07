import { useEffect, useMemo, useState } from 'react'
import { Modal } from 'components/ui/Modal'
import { TextField } from 'components/ui/TextField'
import { SucursalLocationPicker } from 'components/ui/SucursalLocationPicker'
import type { ZonaOption } from 'components/ui/ClienteForm'
import type { Sucursal } from '../../services/sucursalesApi'

type FormValues = {
  nombre_sucursal: string
  direccion_entrega?: string
  contacto_nombre?: string
  contacto_telefono?: string
  posicion: { lat: number; lng: number } | null
}

interface SucursalFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (values: FormValues) => Promise<void>
  initialData?: Partial<Sucursal>
  zonas: ZonaOption[]
  zonaId: number | null
  ubicacionMatriz: google.maps.LatLngLiteral | null
}

export function SucursalFormModal({ isOpen, onClose, onSubmit, initialData, zonas, zonaId, ubicacionMatriz }: SucursalFormModalProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [values, setValues] = useState<FormValues>({
    nombre_sucursal: '',
    direccion_entrega: '',
    contacto_nombre: '',
    contacto_telefono: '',
    posicion: null,
  })

  useEffect(() => {
    if (!isOpen) return
    if (initialData) {
      const coords = (initialData as any)?.ubicacion_gps?.coordinates as [number, number] | undefined
      setValues({
        nombre_sucursal: initialData.nombre_sucursal || '',
        direccion_entrega: initialData.direccion_entrega || '',
        contacto_nombre: initialData.contacto_nombre || '',
        contacto_telefono: initialData.contacto_telefono || '',
        posicion: coords ? { lat: coords[1], lng: coords[0] } : null,
      })
    } else {
      setValues({
        nombre_sucursal: '',
        direccion_entrega: '',
        contacto_nombre: '',
        contacto_telefono: '',
        posicion: null,
      })
    }
    setError(null)
    setSaving(false)
  }, [isOpen, initialData])

  const canSubmit = useMemo(() => values.nombre_sucursal.trim().length > 0, [values.nombre_sucursal])

  const handleSubmit = async () => {
    if (!canSubmit) return
    try {
      setSaving(true)
      setError(null)
      await onSubmit(values)
      onClose()
    } catch (e: any) {
      setError(e?.message || 'No se pudo guardar la sucursal')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData?.id ? 'Editar Sucursal' : 'Agregar Sucursal'}
      headerGradient="red"
      maxWidth="lg"
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-800">{error}</div>
        )}

        <TextField
          label="Nombre de la sucursal"
          tone="light"
          type="text"
          placeholder="Ej. Sucursal Norte"
          value={values.nombre_sucursal}
          onChange={(e) => setValues((v) => ({ ...v, nombre_sucursal: e.target.value }))}
          disabled={saving}
        />

        <TextField
          label="Dirección de entrega (opcional)"
          tone="light"
          type="text"
          placeholder="Calle 123 y Av. Principal"
          value={values.direccion_entrega || ''}
          onChange={(e) => setValues((v) => ({ ...v, direccion_entrega: e.target.value }))}
          disabled={saving}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <TextField
            label="Contacto (opcional)"
            tone="light"
            type="text"
            placeholder="Nombre de contacto"
            value={values.contacto_nombre || ''}
            onChange={(e) => setValues((v) => ({ ...v, contacto_nombre: e.target.value }))}
            disabled={saving}
          />
          <TextField
            label="Teléfono (opcional)"
            tone="light"
            type="tel"
            placeholder="0999999999"
            value={values.contacto_telefono || ''}
            onChange={(e) => setValues((v) => ({ ...v, contacto_telefono: e.target.value }))}
            disabled={saving}
          />
        </div>

        <SucursalLocationPicker
          position={values.posicion}
          zonaId={zonaId}
          zonas={zonas}
          ubicacionMatriz={ubicacionMatriz}
          onChange={(pos) => setValues((v) => ({ ...v, posicion: pos }))}
        />

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="rounded-lg bg-brand-red px-4 py-2 text-sm font-medium text-white hover:bg-brand-red/90 disabled:opacity-50"
            onClick={handleSubmit}
            disabled={!canSubmit || saving}
          >
            {saving ? 'Guardando...' : initialData?.id ? 'Guardar cambios' : 'Crear sucursal'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

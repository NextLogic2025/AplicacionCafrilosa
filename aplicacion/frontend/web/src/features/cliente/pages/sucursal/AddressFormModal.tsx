import { useEffect, useMemo, useState } from 'react'
import { Modal } from 'components/ui/Modal'
import { TextField } from 'components/ui/TextField'
import { SucursalLocationPicker } from 'components/ui/SucursalLocationPicker'
import type { ZonaComercial } from '../../../supervisor/services/zonasApi'

type Props = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (values: any) => Promise<void>
  initialData?: any
  zonas: ZonaComercial[]
}

export default function AddressFormModal({ isOpen, onClose, onSubmit, initialData, zonas }: Props) {
  const [saving, setSaving] = useState(false)
  const [values, setValues] = useState<any>({ direccion_texto: '', posicion: null, zona_comercial_id: null })

  useEffect(() => {
    if (!isOpen) return
    if (initialData) {
      setValues({
        direccion_texto: initialData.direccion_texto || '',
        posicion: initialData.ubicacion_gps?.coordinates ? { lat: initialData.ubicacion_gps.coordinates[1], lng: initialData.ubicacion_gps.coordinates[0] } : null,
        zona_comercial_id: initialData.zona_comercial_id ?? (initialData.zona_comercial?.id ?? null),
      })
    } else {
      setValues({ direccion_texto: '', posicion: null, zona_comercial_id: null })
    }
    setSaving(false)
  }, [isOpen, initialData])

  const canSubmit = useMemo(() => (values.direccion_texto && values.direccion_texto.trim().length > 0) || values.posicion, [values])

  const handleSubmit = async () => {
    if (!canSubmit) return
    try {
      setSaving(true)
      await onSubmit(values)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Dirección Matriz" headerGradient="red" maxWidth="lg">
      <div className="space-y-4">
        <TextField label="Dirección" tone="light" value={values.direccion_texto || ''} onChange={(e) => setValues((v:any) => ({ ...v, direccion_texto: e.target.value }))} />

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Zona comercial</label>
          <select className="w-full rounded border border-gray-300 px-2 py-1 text-xs" value={values.zona_comercial_id ?? ''} onChange={e => setValues((v:any) => ({ ...v, zona_comercial_id: e.target.value ? Number(e.target.value) : null }))}>
            <option value="">Seleccione una zona (opcional)</option>
            {zonas.map(z => <option key={z.id} value={z.id}>{z.nombre}</option>)}
          </select>
        </div>

        <SucursalLocationPicker
          position={values.posicion}
          zonaId={values.zona_comercial_id ?? null}
          zonas={zonas.map(z => ({ id: z.id, nombre: z.nombre, poligono_geografico: (z as any).poligono_geografico }))}
          ubicacionMatriz={initialData?.ubicacion_gps?.coordinates ? { lat: initialData.ubicacion_gps.coordinates[1], lng: initialData.ubicacion_gps.coordinates[0] } : null}
          onChange={(pos) => setValues((v:any) => ({ ...v, posicion: pos }))}
          mode="matriz"
        />

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="rounded-lg border border-gray-300 px-4 py-2 text-sm" onClick={onClose} disabled={saving}>Cancelar</button>
          <button type="button" className="rounded-lg bg-brand-red px-4 py-2 text-sm font-medium text-white" onClick={handleSubmit} disabled={!canSubmit || saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
        </div>
      </div>
    </Modal>
  )
}

import { useState, useEffect } from 'react'
import { Modal } from 'components/ui/Modal'
import { TextField } from 'components/ui/TextField'
import { Toggle } from 'components/ui/Toggle'
import { Alert } from 'components/ui/Alert'
import { Button } from 'components/ui/Button'
import { Almacen, CreateAlmacenDto, UpdateAlmacenDto } from '../services/almacenesApi'

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (data: CreateAlmacenDto | UpdateAlmacenDto) => Promise<void>
  initialData?: Almacen | null
  loading?: boolean
}

export function AlmacenFormModal({ open, onClose, onSubmit, initialData, loading }: Props) {
  const isEdit = !!initialData
  const [formData, setFormData] = useState<Partial<CreateAlmacenDto & { activo: boolean }>>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setFormData({
        nombre: initialData?.nombre || '',
        codigoRef: initialData?.codigoRef || '',
        direccionFisica: initialData?.direccionFisica || '',
        requiereFrio: initialData?.requiereFrio ?? false,
        activo: initialData?.activo ?? true,
      })
      setError(null)
    }
  }, [open, initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      const payload: Partial<CreateAlmacenDto & { activo?: boolean }> = { ...formData }

      // Sanitizar campos opcionales: enviar undefined si son string vacíos
      if (payload.codigoRef === '') payload.codigoRef = undefined
      if (payload.direccionFisica === '') payload.direccionFisica = undefined

      if (isEdit) {
        // When editing, the 'activo' field is part of the UpdateAlmacenDto
        // and is explicitly managed by the form, so it should be included.
        // The type assertion is needed because formData.activo is optional in Partial<...>
        // but expected in UpdateAlmacenDto if it's being sent.
        (payload as UpdateAlmacenDto).activo = formData.activo;
      } else {
        // When creating, 'activo' is not part of CreateAlmacenDto,
        // so we ensure it's not present in the payload for creation.
        delete payload.activo;
      }

      await onSubmit(payload as CreateAlmacenDto | UpdateAlmacenDto)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    }
  }

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={isEdit ? 'Editar Almacén' : 'Crear Nuevo Almacén'}
      maxWidth="md"
      headerGradient="red"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

        <TextField
          label="Nombre del Almacén"
          name="nombre"
          value={formData.nombre || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
          placeholder="Ej: Almacén Principal"
          required
          tone="light"
        />

        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="Código de Referencia"
            name="codigoRef"
            value={formData.codigoRef || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, codigoRef: e.target.value }))}
            placeholder="Ej: ALP-01"
            tone="light"
          />

          <div className="flex items-center pt-8">
            <Toggle
              label="Requiere Frío"
              enabled={!!formData.requiereFrio}
              onChange={(enabled) => setFormData(prev => ({ ...prev, requiereFrio: enabled }))}
            />
            <span className="ml-3 text-sm text-neutral-700">Requiere Frío</span>
          </div>
        </div>

        <TextField
          label="Dirección Física"
          name="direccionFisica"
          value={formData.direccionFisica || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, direccionFisica: e.target.value }))}
          placeholder="Ej: Av. Principal 123"
          tone="light"
        />

        {isEdit && (
          <div className="pt-2 border-t border-neutral-100 flex items-center gap-3">
            <Toggle
              label="Activo"
              enabled={!!formData.activo}
              onChange={(enabled) => setFormData(prev => ({ ...prev, activo: enabled }))}
            />
            <div>
              <span className="text-sm font-medium text-neutral-900">Estado Activo</span>
              <p className="text-xs text-neutral-500">
                Si se desactiva, el almacén no estará disponible para nuevas operaciones.
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            onClick={onClose}
            className="bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="bg-brand-red text-white"
            disabled={loading}
          >
            {loading ? 'Guardando...' : (isEdit ? 'Actualizar' : 'Crear')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

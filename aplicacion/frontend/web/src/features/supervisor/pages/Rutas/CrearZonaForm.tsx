import { TextField } from 'components/ui/TextField'
import { Alert } from 'components/ui/Alert'
import { type CreateZonaDto } from '../../services/zonasApi'
import { type Vendedor } from '../../services/usuariosApi'

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

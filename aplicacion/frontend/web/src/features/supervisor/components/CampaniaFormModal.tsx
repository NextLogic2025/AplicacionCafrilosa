import React from 'react'
import { Modal } from 'components/ui/Modal'
import { TextField } from 'components/ui/TextField'
import { Button } from 'components/ui/Button'
import type { Campania, CreateCampaniaDto } from '../services/promocionesApi'
import type { ListaPrecio } from '../services/clientesApi'

interface CampaniaFormModalProps {
  isOpen: boolean
  editingCampania: Campania | null
  formData: CreateCampaniaDto
  listasPrecios: ListaPrecio[]
  onChange: (data: CreateCampaniaDto) => void
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
  onManageProducts?: () => void
}

export function CampaniaFormModal({
  isOpen,
  editingCampania,
  formData,
  listasPrecios,
  onChange,
  onSubmit,
  onClose,
  onManageProducts,
}: CampaniaFormModalProps) {
  const updateField = (patch: Partial<CreateCampaniaDto>) => onChange({ ...formData, ...patch })

  return (
    <Modal
      isOpen={isOpen}
      title={editingCampania ? 'Editar Campaña' : 'Nueva Campaña'}
      onClose={onClose}
      headerGradient="red"
      maxWidth="md"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <TextField
          label="Nombre de la campaña"
          tone="light"
          type="text"
          placeholder="Ej: Ofertas de Verano"
          value={formData.nombre}
          onChange={(e) => updateField({ nombre: e.target.value })}
        />

        <div className="grid gap-2">
          <label className="text-xs text-neutral-600">Descripción</label>
          <textarea
            value={formData.descripcion}
            onChange={(e) => updateField({ descripcion: e.target.value })}
            placeholder="Descripción de la campaña"
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-neutral-900 outline-none transition focus:border-brand-red/60 focus:shadow-[0_0_0_4px_rgba(240,65,45,0.18)]"
            rows={3}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label="Fecha de inicio"
            tone="light"
            type="date"
            value={formData.fecha_inicio}
            onChange={(e) => updateField({ fecha_inicio: e.target.value })}
          />

          <TextField
            label="Fecha de fin"
            tone="light"
            type="date"
            value={formData.fecha_fin}
            onChange={(e) => updateField({ fecha_fin: e.target.value })}
          />
        </div>

        <div className="grid gap-2">
          <label className="text-xs text-neutral-600">Alcance de la promoción</label>
          <select
            value={formData.alcance}
            onChange={(e) => updateField({ alcance: e.target.value as any })}
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-neutral-900 outline-none transition focus:border-brand-red/60 focus:shadow-[0_0_0_4px_rgba(240,65,45,0.18)]"
          >
            <option value="GLOBAL">General (todos los clientes)</option>
            <option value="POR_LISTA">Por lista de precios</option>
            <option value="POR_CLIENTE">Por cliente específico</option>
          </select>
        </div>

        {formData.alcance === 'POR_LISTA' && (
          <div className="grid gap-2">
            <label className="text-xs text-neutral-600">Lista de precios objetivo</label>
            <select
              value={formData.lista_precios_objetivo_id || ''}
              onChange={(e) => updateField({ lista_precios_objetivo_id: parseInt(e.target.value) })}
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-neutral-900 outline-none transition focus:border-brand-red/60 focus:shadow-[0_0_0_4px_rgba(240,65,45,0.18)]"
            >
              <option value="">Selecciona una lista</option>
              {listasPrecios.map((lista) => (
                <option key={lista.id} value={lista.id}>
                  {lista.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-xs text-neutral-600">Tipo de descuento</label>
            <select
              value={formData.tipo_descuento}
              onChange={(e) => updateField({ tipo_descuento: e.target.value as any })}
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-neutral-900 outline-none transition focus:border-brand-red/60 focus:shadow-[0_0_0_4px_rgba(240,65,45,0.18)]"
            >
              <option value="PORCENTAJE">Porcentaje</option>
              <option value="MONTO_FIJO">Monto fijo</option>
            </select>
          </div>

          <TextField
            label="Valor del descuento"
            tone="light"
            type="number"
            step="0.01"
            placeholder="Ej: 10"
            value={formData.valor_descuento}
            onChange={(e) => updateField({ valor_descuento: parseFloat(e.target.value) || 0 })}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="activo"
            checked={formData.activo}
            onChange={(e) => updateField({ activo: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
          />
          <label htmlFor="activo" className="text-sm font-medium text-neutral-700">
            Campaña activa
          </label>
        </div>

        {editingCampania && (
          <div className="space-y-3 border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-900">Productos asignados</h4>
              <button
                type="button"
                onClick={onManageProducts}
                className="flex items-center gap-1 text-sm text-brand-red hover:text-brand-red/80"
              >
                Gestionar productos
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Guarda la campaña primero, luego gestiona sus productos desde la tarjeta.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            onClick={onClose}
            className="bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
          >
            Cancelar
          </Button>
          <Button type="submit" className="bg-brand-red text-white hover:bg-brand-red/90">
            {editingCampania ? 'Actualizar' : 'Crear campaña'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

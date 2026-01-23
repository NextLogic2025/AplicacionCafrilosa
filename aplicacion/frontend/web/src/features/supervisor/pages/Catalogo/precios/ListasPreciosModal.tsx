import { Modal } from 'components/ui/Modal'
import { TextField } from 'components/ui/TextField'
import { EntityList } from 'components/ui/EntityList'
import { useState } from 'react'
import type { ListaPrecio, CreateListaPrecioDto } from '../../../services/preciosApi'

interface ListasPreciosModalProps {
  isOpen: boolean
  onClose: () => void
  listas: ListaPrecio[]
  onCreate: (data: CreateListaPrecioDto) => Promise<void>
  onUpdate: (id: number, data: CreateListaPrecioDto) => Promise<void>
  onDelete: (id: number) => Promise<void>
}

export function ListasPreciosModal({ isOpen, onClose, listas, onCreate, onUpdate, onDelete }: ListasPreciosModalProps) {
  const [formData, setFormData] = useState<CreateListaPrecioDto>({ nombre: '' })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  const handleEdit = (lista: ListaPrecio) => {
    setEditingId(lista.id)
    setFormData({ nombre: lista.nombre })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    if (editingId) {
      await onUpdate(editingId, formData)
    } else {
      await onCreate(formData)
    }
    setFormData({ nombre: '' })
    setEditingId(null)
    setLoading(false)
    onClose()
  }

  const handleDelete = async (id: number) => {
    if (confirm('¿Eliminar esta lista de precios?')) {
      setLoading(true)
      await onDelete(id)
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} title={editingId ? 'Editar Lista de Precios' : 'Crear Lista de Precios'} onClose={onClose} headerGradient="blue" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4 pb-4 border-b border-gray-200">
        <TextField
          label="Nombre de la lista"
          tone="light"
          type="text"
          placeholder="Ej: Mayorista, Distribuidor, Especial"
          value={formData.nombre}
          onChange={(e) => setFormData({ nombre: e.target.value })}
        />
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-neutral-700 bg-neutral-200 hover:bg-neutral-300 transition"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition font-semibold"
            disabled={loading}
          >
            {editingId ? 'Actualizar' : 'Crear lista'}
          </button>
        </div>
      </form>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Listas existentes</h3>
        <EntityList<ListaPrecio>
          items={listas}
          renderItem={(lista) => (
            <div>
              <p className="font-medium text-gray-900">{lista.nombre}</p>
              <p className="text-xs text-gray-500">ID: {lista.id}</p>
            </div>
          )}
          onEdit={handleEdit}
          onDelete={(lista) => handleDelete(lista.id)}
          emptyMessage="No hay listas de precios creadas"
        />
      </div>
    </Modal>
  )
}

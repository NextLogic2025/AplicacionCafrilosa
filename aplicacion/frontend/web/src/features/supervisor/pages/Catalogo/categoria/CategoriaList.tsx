import { Image as ImageIcon, Pencil, Trash2 } from 'lucide-react'
import { StatusBadge } from 'components/ui/StatusBadge'
import { CardGrid, type CardGridItem } from 'components/ui/CardGrid'
import type { Category } from '../../../services/catalogApi'

interface CategoriaListProps {
  categories: Category[]
  onEdit: (cat: Category) => void
  onDelete: (id: number) => void
}

export function CategoriaList({ categories, onEdit, onDelete }: CategoriaListProps) {
  if (categories.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-neutral-200">
          <ImageIcon className="h-8 w-8 text-neutral-500" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-neutral-900">
          No hay categorías
        </h3>
        <p className="mt-2 text-sm text-neutral-600">
          Comienza creando tu primera categoría
        </p>
      </div>
    )
  }
  return (
    <CardGrid
      items={categories.map((category) => ({
        id: category.id,
        image: category.imagen_url || null,
        title: category.nombre,
        description: category.descripcion,
        extra: (
          <StatusBadge variant={category.activo ? 'success' : 'neutral'}>
            {category.activo ? 'Activo' : 'Inactivo'}
          </StatusBadge>
        ),
        actions: (
          <div className="flex w-full gap-2 mt-2">
            <button
              onClick={() => onEdit(category)}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-brand-red bg-white px-3 py-2 text-sm font-semibold text-brand-red shadow-sm transition hover:bg-brand-red/90 hover:text-white hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-red/40"
              title="Editar categoría"
            >
              <Pencil className="h-4 w-4" />
              <span>Editar</span>
            </button>
            <button
              onClick={() => onDelete(category.id)}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-red-600 bg-white px-3 py-2 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-600 hover:text-white hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-400"
              title="Eliminar categoría"
            >
              <Trash2 className="h-4 w-4" />
              <span>Eliminar</span>
            </button>
          </div>
        ),
      }))}
      columns={4}
    />
  )
}

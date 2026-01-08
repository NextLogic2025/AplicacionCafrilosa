import { Image as ImageIcon, Pencil, Trash2 } from 'lucide-react'
import { StatusBadge } from 'components/ui/StatusBadge'
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
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => (
        <div
          key={category.id}
          className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          {category.imagen_url ? (
            <div className="mb-0 h-32 overflow-hidden rounded-t-2xl bg-neutral-100">
              <img
                src={category.imagen_url}
                alt={category.nombre}
                className="h-full w-full object-cover transition group-hover:scale-105"
              />
            </div>
          ) : (
            <div className="mb-0 flex h-32 items-center justify-center rounded-t-2xl bg-gradient-to-br from-neutral-100 to-neutral-200">
              <ImageIcon className="h-12 w-12 text-neutral-400" />
            </div>
          )}

          <div className="px-6 py-6">
            <h3 className="text-lg font-bold text-neutral-900">
              {category.nombre}
            </h3>

            {category.descripcion && (
              <p className="mt-2 text-sm text-neutral-600 line-clamp-2">
                {category.descripcion}
              </p>
            )}

            <div className="mt-4 flex items-center justify-between">
              <StatusBadge variant={category.activo ? 'success' : 'neutral'}>
                {category.activo ? 'Activo' : 'Inactivo'}
              </StatusBadge>

              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(category)}
                  className="flex items-center gap-1.5 rounded-lg border border-brand-red px-3 py-1.5 text-sm font-semibold text-brand-red transition hover:bg-brand-red/5"
                  title="Editar categoría"
                >
                  <Pencil className="h-4 w-4" />
                  Editar
                </button>
                <button
                  onClick={() => onDelete(category.id)}
                  className="flex items-center gap-1.5 rounded-lg border border-red-600 px-3 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                  title="Eliminar categoría"
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

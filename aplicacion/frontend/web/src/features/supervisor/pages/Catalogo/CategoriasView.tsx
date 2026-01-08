import { PlusCircle } from 'lucide-react'
import { Alert } from 'components/ui/Alert'
import { LoadingSpinner } from 'components/ui/LoadingSpinner'
import { NotificationStack } from 'components/ui/NotificationStack'
import { useModal } from '../../../../hooks/useModal'
import { useNotification } from '../../../../hooks/useNotification'
import { CategoriaFormModal } from './categoria/CategoriaFormModal'
import { CategoriaList } from './categoria/CategoriaList'
import { useCategoriaCrud } from '../../services/useCategoriaCrud'
import type { Category, CreateCategoryDto } from '../../services/catalogApi'

export function CategoriasView() {
  const { data: categories, isLoading, error, create, update, delete: deleteItem } = useCategoriaCrud()
  const modal = useModal<Category>()
  const { notifications, success, error: notifyError, remove: removeNotification } = useNotification()

  const handleSubmit = async (data: CreateCategoryDto) => {
    try {
      if (modal.editingItem) {
        await update(modal.editingItem.id.toString(), data)
        success('Categoría actualizada exitosamente')
      } else {
        await create(data)
        success('Categoría creada exitosamente')
      }
      modal.close()
    } catch (err: any) {
      notifyError(err.message || 'Error al guardar la categoría')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta categoría?')) return
    try {
      await deleteItem(id.toString())
      success('Categoría eliminada exitosamente')
    } catch (error: any) {
      notifyError(error.message || 'Error al eliminar la categoría')
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <NotificationStack notifications={notifications} onRemove={removeNotification} />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Categorías</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Administra las categorías de productos
          </p>
        </div>
        <button
          onClick={modal.openCreate}
          className="flex items-center gap-2 bg-brand-red text-white hover:bg-brand-red/90 px-4 py-2 rounded-xl font-semibold transition"
        >
          <PlusCircle className="h-4 w-4" />
          Crear categoría
        </button>
      </div>

      {error && <Alert type="error" message={error} />}

      <CategoriaList
        categories={categories}
        onEdit={modal.openEdit}
        onDelete={handleDelete}
      />

      <CategoriaFormModal
        isOpen={modal.isOpen}
        onClose={modal.close}
        initialData={modal.editingItem || undefined}
        onSubmit={handleSubmit}
        isEditing={modal.isEditing}
      />
    </div>
  )
}

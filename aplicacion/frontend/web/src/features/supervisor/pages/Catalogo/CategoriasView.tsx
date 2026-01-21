import { useState, useEffect } from 'react'
import { PlusCircle, Trash2, Eye } from 'lucide-react'
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
  const { data: activeCategories, isLoading, error, create, update, delete: deleteItem, getDeleted, restore, refresh } = useCategoriaCrud()
  const modal = useModal<Category>()
  const { notifications, success, error: notifyError, remove: removeNotification } = useNotification()
  const [isDeletedView, setIsDeletedView] = useState(false)
  const [deletedCategories, setDeletedCategories] = useState<Category[]>([])
  const [loadingDeleted, setLoadingDeleted] = useState(false)

  const loadDeleted = async () => {
    try {
      setLoadingDeleted(true)
      const data = await getDeleted()
      setDeletedCategories(data)
    } catch (err: any) {
      notifyError(err.message || 'Error al cargar categorías eliminadas')
    } finally {
      setLoadingDeleted(false)
    }
  }

  useEffect(() => {
    if (isDeletedView) {
      loadDeleted()
    } else {
      refresh() // Recargar activas al volver
    }
  }, [isDeletedView, refresh])

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

  const handleRestore = async (id: number) => {
    try {
      await restore(id)
      success('Categoría restaurada exitosamente')
      // Recargar eliminadas
      await loadDeleted()
      // Recargar activas para que esté lista al cambiar vista
      await refresh()
    } catch (error: any) {
      notifyError(error.message || 'Error al restaurar la categoría')
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
          <h2 className="text-2xl font-bold text-neutral-900">
            {isDeletedView ? 'Categorías Eliminadas' : 'Categorías'}
          </h2>
          <p className="mt-1 text-sm text-neutral-600">
            {isDeletedView ? 'Restaura categorías eliminadas' : 'Administra las categorías de productos'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsDeletedView(!isDeletedView)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition ${isDeletedView
              ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
          >
            {isDeletedView ? (
              <>
                <Eye className="h-4 w-4" />
                Ver Activas
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Ver Eliminadas
              </>
            )}
          </button>
          {!isDeletedView && (
            <button
              onClick={modal.openCreate}
              className="flex items-center gap-2 bg-brand-red text-white hover:bg-brand-red/90 px-4 py-2 rounded-xl font-semibold transition"
            >
              <PlusCircle className="h-4 w-4" />
              Crear categoría
            </button>
          )}
        </div>
      </div>

      {error && <Alert type="error" message={error} />}

      {loadingDeleted && isDeletedView ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <CategoriaList
          categories={isDeletedView ? deletedCategories : activeCategories}
          onEdit={!isDeletedView ? modal.openEdit : undefined}
          onDelete={!isDeletedView ? handleDelete : undefined}
          onRestore={isDeletedView ? handleRestore : undefined}
          isDeletedView={isDeletedView}
        />
      )}

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

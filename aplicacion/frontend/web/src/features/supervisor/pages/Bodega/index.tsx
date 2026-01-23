import { useState, useEffect } from 'react'
import { PlusCircle, Trash2, Eye } from 'lucide-react'
import { PageHero } from 'components/ui/PageHero'
import { SectionHeader } from 'components/ui/SectionHeader'
import { Alert } from 'components/ui/Alert'
import { LoadingSpinner } from 'components/ui/LoadingSpinner'
import { NotificationStack } from 'components/ui/NotificationStack'
import { useModal } from '../../../../hooks/useModal'
import { useNotification } from '../../../../hooks/useNotification'
import { useBodegaCrud } from '../../services/useBodegaCrud'
import { BodegaList } from './components/BodegaList'
import { BodegaFormModal } from './components/BodegaFormModal'
import type { Bodega, CreateBodegaDto } from '../../services/bodegaApi'

export default function BodegaPage() {
  const { data: activeBodegas, isLoading, error, create, update, delete: deleteItem, getDeleted, restore, refresh } = useBodegaCrud()
  const modal = useModal<Bodega>()
  const { notifications, success, error: notifyError, remove: removeNotification } = useNotification()
  const [isDeletedView, setIsDeletedView] = useState(false)
  const [deletedBodegas, setDeletedBodegas] = useState<Bodega[]>([])
  const [loadingDeleted, setLoadingDeleted] = useState(false)

  const loadDeleted = async () => {
    try {
      setLoadingDeleted(true)
      const data = await getDeleted()
      setDeletedBodegas(data)
    } catch (err: any) {
      notifyError(err.message || 'Error al cargar bodegas eliminadas')
    } finally {
      setLoadingDeleted(false)
    }
  }

  useEffect(() => {
    if (isDeletedView) {
      loadDeleted()
    } else {
      refresh()
    }
  }, [isDeletedView, refresh])

  const handleSubmit = async (data: CreateBodegaDto) => {
    try {
      if (modal.editingItem) {
        await update(modal.editingItem.id, data)
        success('Bodega actualizada exitosamente')
      } else {
        await create(data)
        success('Bodega creada exitosamente')
      }
      modal.close()
    } catch (err: any) {
      notifyError(err.message || 'Error al guardar la bodega')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta bodega?')) return
    try {
      await deleteItem(id)
      success('Bodega eliminada exitosamente')
    } catch (error: any) {
      notifyError(error.message || 'Error al eliminar la bodega')
    }
  }

  const handleRestore = async (id: number) => {
    try {
      await restore(id)
      success('Bodega restaurada exitosamente')
      await loadDeleted()
      await refresh()
    } catch (error: any) {
      notifyError(error.message || 'Error al restaurar la bodega')
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

      <PageHero
        title="Control de Bodega"
        subtitle="Auditoria de validación de stock y tiempos de preparación"
        chips={[
          'Pedidos pendientes',
          'Tiempos de preparación',
          'Cuellos de botella',
        ]}
      />

      {error && <Alert type="error" message={error} />}

      <div className="flex items-center justify-between">
        <SectionHeader
          title={isDeletedView ? 'Bodegas Desactivadas' : 'Estado de Bodega'}
          subtitle={isDeletedView ? 'Restaura bodegas eliminadas' : 'Validaciones de stock y preparación de pedidos'}
        />
        <div className="flex gap-2">
          <button
            onClick={() => setIsDeletedView(!isDeletedView)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition"
          >
            {isDeletedView ? (
              <>
                <Eye className="h-4 w-4" />
                Ver Activas
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Ver Desactivadas
              </>
            )}
          </button>
          {!isDeletedView && (
            <button
              onClick={modal.openCreate}
              className="flex items-center gap-2 bg-brand-red text-white hover:bg-brand-red/90 px-4 py-2 rounded-xl font-semibold transition shadow-sm"
            >
              <PlusCircle className="h-4 w-4" />
              Crear Almacén
            </button>
          )}
        </div>
      </div>

      {loadingDeleted && isDeletedView ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <BodegaList
          bodegas={isDeletedView ? deletedBodegas : activeBodegas}
          onEdit={!isDeletedView ? modal.openEdit : undefined}
          onDelete={!isDeletedView ? handleDelete : undefined}
          onRestore={isDeletedView ? handleRestore : undefined}
          isDeletedView={isDeletedView}
        />
      )}

      <BodegaFormModal
        isOpen={modal.isOpen}
        onClose={modal.close}
        initialData={modal.editingItem || undefined}
        onSubmit={handleSubmit}
        isEditing={modal.isEditing}
      />
    </div>
  )
}

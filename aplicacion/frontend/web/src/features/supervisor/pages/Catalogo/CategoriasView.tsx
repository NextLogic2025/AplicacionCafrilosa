import { PlusCircle, Image as ImageIcon, Pencil, Trash2 } from 'lucide-react'
import { Alert } from 'components/ui/Alert'
import { LoadingSpinner } from 'components/ui/LoadingSpinner'
import { StatusBadge } from 'components/ui/StatusBadge'
import { EntityFormModal, type Field } from '../../../../components/ui/EntityFormModal'
import { useEntityCrud } from '../../../../hooks/useEntityCrud'
import { useModal } from '../../../../hooks/useModal'
import { 
  getAllCategories, 
  createCategory, 
  updateCategory,
  deleteCategory,
  type Category,
  type CreateCategoryDto 
} from '../../services/catalogApi'

export function CategoriasView() {
  const { data: categories, isLoading, error, create, update, delete: deleteItem } = useEntityCrud<Category, CreateCategoryDto, CreateCategoryDto>({
    load: getAllCategories,
    create: createCategory,
    update: (id, data) => updateCategory(typeof id === 'string' ? parseInt(id) : id, data),
    delete: (id) => deleteCategory(typeof id === 'string' ? parseInt(id) : id),
  })

  const modal = useModal<Category>()

  const handleSubmit = async (data: any) => {
    const categoryData: CreateCategoryDto = {
      nombre: data.nombre,
      descripcion: data.descripcion || undefined,
      imagen_url: data.imagen_url || undefined,
      activo: data.activo ?? true,
    }

    if (modal.editingItem) {
      await update(modal.editingItem.id.toString(), categoryData)
    } else {
      await create(categoryData)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta categoría?')) return
    
    try {
      await deleteItem(id.toString())
    } catch (error: any) {
      alert(error.message || 'Error al eliminar la categoría')
    }
  }

  const fields: Field[] = [
    { name: 'nombre', label: 'Nombre de la categoría', required: true, placeholder: 'Ej: Embutidos' },
    { name: 'descripcion', label: 'Descripción', type: 'textarea', placeholder: 'Describe la categoría...' },
    { name: 'imagen_url', label: 'URL de imagen', type: 'url', placeholder: 'https://ejemplo.com/imagen.jpg' },
    { name: 'activo', label: 'Categoría activa', type: 'checkbox' },
  ]

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
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

      {categories.length === 0 ? (
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
      ) : (
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
                      onClick={() => modal.openEdit(category)}
                      className="flex items-center gap-1.5 rounded-lg border border-brand-red px-3 py-1.5 text-sm font-semibold text-brand-red transition hover:bg-brand-red/5"
                      title="Editar categoría"
                    >
                      <Pencil className="h-4 w-4" />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
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
      )}

      <EntityFormModal<Category>
        isOpen={modal.isOpen}
        onClose={modal.close}
        title={modal.isEditing ? 'Editar Categoría' : 'Crear Categoría'}
        fields={fields}
        initialData={modal.editingItem || undefined}
        onSubmit={handleSubmit}
        headerGradient="red"
      />
    </div>
  )
}

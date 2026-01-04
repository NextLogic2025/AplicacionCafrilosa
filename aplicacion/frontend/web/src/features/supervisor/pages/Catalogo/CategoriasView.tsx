import { PlusCircle, Image as ImageIcon } from 'lucide-react'
import { Alert } from 'components/ui/Alert'
import { LoadingSpinner } from 'components/ui/LoadingSpinner'
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
          <h2 className="text-2xl font-bold text-gray-900">Categorías</h2>
          <p className="mt-1 text-sm text-gray-600">
            Administra las categorías de productos
          </p>
        </div>
        <button
          onClick={modal.openCreate}
          className="flex items-center gap-2 bg-brand-red text-white hover:bg-brand-red/90 px-4 py-2 rounded-lg font-semibold transition"
        >
          <PlusCircle className="h-4 w-4" />
          Crear categoría
        </button>
      </div>

      {error && <Alert type="error" message={error} />}

      {categories.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <ImageIcon className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            No hay categorías
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            Comienza creando tu primera categoría
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md"
            >
              {category.imagen_url ? (
                <div className="mb-4 h-32 overflow-hidden rounded-lg bg-gray-100">
                  <img
                    src={category.imagen_url}
                    alt={category.nombre}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="mb-4 flex h-32 items-center justify-center rounded-lg bg-gradient-to-br from-gray-100 to-gray-200">
                  <ImageIcon className="h-12 w-12 text-gray-400" />
                </div>
              )}

              <h3 className="text-lg font-bold text-gray-900">
                {category.nombre}
              </h3>
              
              {category.descripcion && (
                <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                  {category.descripcion}
                </p>
              )}

              <div className="mt-4 flex items-center justify-between">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    category.activo
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {category.activo ? 'Activo' : 'Inactivo'}
                </span>

                <div className="flex gap-2">
                  <button
                    onClick={() => modal.openEdit(category)}
                    className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50"
                    title="Editar"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
                    title="Eliminar"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
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

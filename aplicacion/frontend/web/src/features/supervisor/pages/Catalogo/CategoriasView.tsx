import { useState, useEffect } from 'react'
import { PlusCircle, Edit2, Trash2, Image as ImageIcon } from 'lucide-react'
import { Button } from 'components/ui/Button'
import { Modal } from 'components/ui/Modal'
import { TextField } from 'components/ui/TextField'
import { Alert } from 'components/ui/Alert'
import { LoadingSpinner } from 'components/ui/LoadingSpinner'
import { 
  getAllCategories, 
  createCategory, 
  updateCategory,
  deleteCategory,
  type Category,
  type CreateCategoryDto 
} from '../../services/catalogApi'

export function CategoriasView() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState<CreateCategoryDto>({
    nombre: '',
    descripcion: '',
    imagen_url: '',
    activo: true,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setIsLoading(true)
      const data = await getAllCategories()
      setCategories(data)
    } catch (error) {
      console.error('Error al cargar categorías:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category)
      setFormData({
        nombre: category.nombre,
        descripcion: category.descripcion || '',
        imagen_url: category.imagen_url || '',
        activo: category.activo,
      })
    } else {
      setEditingCategory(null)
      setFormData({ nombre: '', descripcion: '', imagen_url: '', activo: true })
    }
    setIsModalOpen(true)
    setErrors({})
    setSubmitMessage(null)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingCategory(null)
    setFormData({ nombre: '', descripcion: '', imagen_url: '', activo: true })
    setErrors({})
    setSubmitMessage(null)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido'
    } else if (formData.nombre.length > 50) {
      newErrors.nombre = 'El nombre no puede exceder 50 caracteres'
    }

    if (formData.descripcion && formData.descripcion.length > 150) {
      newErrors.descripcion = 'La descripción no puede exceder 150 caracteres'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitMessage(null)

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, formData)
        setSubmitMessage({
          type: 'success',
          message: 'Categoría actualizada exitosamente',
        })
      } else {
        await createCategory(formData)
        setSubmitMessage({
          type: 'success',
          message: 'Categoría creada exitosamente',
        })
      }

      await loadCategories()

      setTimeout(() => {
        handleCloseModal()
      }, 1500)
    } catch (error: any) {
      setSubmitMessage({
        type: 'error',
        message: error.message || 'Error al guardar la categoría',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta categoría?')) {
      return
    }

    try {
      await deleteCategory(id)
      await loadCategories()
    } catch (error: any) {
      console.error('Error al eliminar:', error)
      alert(error.message || 'Error al eliminar la categoría')
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Categorías</h2>
          <p className="mt-1 text-sm text-gray-600">
            Administra las categorías de productos
          </p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-brand-red text-white hover:bg-brand-red/90"
        >
          <PlusCircle className="h-4 w-4" />
          Crear categoría
        </Button>
      </div>

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
                    onClick={() => handleOpenModal(category)}
                    className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50"
                    title="Editar"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        title={editingCategory ? 'Editar Categoría' : 'Crear Categoría'}
        onClose={handleCloseModal}
        headerGradient="red"
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {submitMessage && (
            <Alert
              type={submitMessage.type}
              message={submitMessage.message}
              onClose={() => setSubmitMessage(null)}
            />
          )}

          <TextField
            label="Nombre de la categoría"
            tone="light"
            type="text"
            placeholder="Ej: Embutidos"
            value={formData.nombre}
            onChange={(e) =>
              setFormData({ ...formData, nombre: e.target.value })
            }
            error={errors.nombre}
            disabled={isSubmitting}
          />

          <div className="grid gap-2">
            <label className="text-xs text-neutral-600">
              Descripción (opcional)
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) =>
                setFormData({ ...formData, descripcion: e.target.value })
              }
              placeholder="Describe la categoría..."
              className="min-h-[80px] w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-neutral-900 outline-none transition focus:border-brand-red/60 focus:shadow-[0_0_0_4px_rgba(240,65,45,0.18)] disabled:opacity-50"
              disabled={isSubmitting}
            />
            {errors.descripcion && (
              <span className="text-xs text-red-700">{errors.descripcion}</span>
            )}
          </div>

          <TextField
            label="URL de imagen (opcional)"
            tone="light"
            type="url"
            placeholder="https://ejemplo.com/imagen.jpg"
            value={formData.imagen_url}
            onChange={(e) =>
              setFormData({ ...formData, imagen_url: e.target.value })
            }
            disabled={isSubmitting}
          />

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="activo"
              checked={formData.activo}
              onChange={(e) =>
                setFormData({ ...formData, activo: e.target.checked })
              }
              className="h-4 w-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
              disabled={isSubmitting}
            />
            <label htmlFor="activo" className="text-sm text-neutral-700">
              Categoría activa
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              onClick={handleCloseModal}
              className="bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-brand-red text-white hover:bg-brand-red/90 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Guardando...'
                : editingCategory
                ? 'Actualizar'
                : 'Crear categoría'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

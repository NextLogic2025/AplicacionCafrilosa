import { useState, useEffect } from 'react'
import { PlusCircle, Edit2, Trash2, Package } from 'lucide-react'
import { Button } from 'components/ui/Button'
import { Modal } from 'components/ui/Modal'
import { TextField } from 'components/ui/TextField'
import { Alert } from 'components/ui/Alert'
import { LoadingSpinner } from 'components/ui/LoadingSpinner'
import { 
  getAllProducts, 
  createProduct, 
  updateProduct,
  deleteProduct,
  type Product,
  type CreateProductDto 
} from '../../services/productosApi'
import { getAllCategories, type Category } from '../../services/catalogApi'

export function ProductosView() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState<CreateProductDto>({
    codigo_sku: '',
    nombre: '',
    descripcion: '',
    peso_unitario_kg: 0,
    categoria_id: null,
    volumen_m3: null,
    requiere_frio: false,
    unidad_medida: 'UNIDAD',
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
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      setIsLoading(true)
      const [productsData, categoriesData] = await Promise.all([
        getAllProducts(),
        getAllCategories(),
      ])
      setProducts(productsData)
      setCategories(categoriesData)
    } catch (error) {
      console.error('Error al cargar datos:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadProducts = async () => {
    try {
      const data = await getAllProducts()
      setProducts(data)
    } catch (error) {
      console.error('Error al cargar productos:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      setFormData({
        codigo_sku: product.codigo_sku,
        nombre: product.nombre,
        descripcion: product.descripcion || '',
        peso_unitario_kg: parseFloat(product.peso_unitario_kg),
        categoria_id: product.categoria_id,
        volumen_m3: product.volumen_m3 ? parseFloat(product.volumen_m3) : null,
        requiere_frio: product.requiere_frio,
        unidad_medida: product.unidad_medida || 'UNIDAD',
        imagen_url: product.imagen_url || '',
        activo: product.activo,
      })
    } else {
      setEditingProduct(null)
      setFormData({
        codigo_sku: '',
        nombre: '',
        descripcion: '',
        peso_unitario_kg: 0,
        categoria_id: null,
        volumen_m3: null,
        requiere_frio: false,
        unidad_medida: 'UNIDAD',
        imagen_url: '',
        activo: true,
      })
    }
    setIsModalOpen(true)
    setErrors({})
    setSubmitMessage(null)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingProduct(null)
    setFormData({
      codigo_sku: '',
      nombre: '',
      descripcion: '',
      peso_unitario_kg: 0,
      categoria_id: null,
      volumen_m3: null,
      requiere_frio: false,
      unidad_medida: 'UNIDAD',
      imagen_url: '',
      activo: true,
    })
    setErrors({})
    setSubmitMessage(null)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.codigo_sku.trim()) {
      newErrors.codigo_sku = 'El código SKU es requerido'
    }

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido'
    }

    if (formData.peso_unitario_kg <= 0) {
      newErrors.peso_unitario_kg = 'El peso debe ser mayor a 0'
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
      if (editingProduct) {
        await updateProduct(editingProduct.id, formData)
        setSubmitMessage({
          type: 'success',
          message: 'Producto actualizado exitosamente',
        })
      } else {
        await createProduct(formData)
        setSubmitMessage({
          type: 'success',
          message: 'Producto creado exitosamente',
        })
      }

      await loadProducts()

      setTimeout(() => {
        handleCloseModal()
      }, 1500)
    } catch (error: any) {
      setSubmitMessage({
        type: 'error',
        message: error.message || 'Error al guardar el producto',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) {
      return
    }

    try {
      await deleteProduct(id)
      await loadInitialData()
    } catch (error: any) {
      console.error('Error al eliminar:', error)
      alert(error.message || 'Error al eliminar el producto')
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
          <h2 className="text-2xl font-bold text-gray-900">Productos</h2>
          <p className="mt-1 text-sm text-gray-600">
            Administra el catálogo de productos
          </p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-brand-red text-white hover:bg-brand-red/90"
        >
          <PlusCircle className="h-4 w-4" />
          Nuevo producto
        </Button>
      </div>

      {products.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <Package className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            No hay productos
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            Comienza creando tu primer producto
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">SKU</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Nombre</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Peso (kg)</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Unidad</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Estado</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {product.codigo_sku}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <div>
                      <p className="font-medium">{product.nombre}</p>
                      {product.descripcion && (
                        <p className="text-xs text-gray-500 line-clamp-1">
                          {product.descripcion}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {product.peso_unitario_kg}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {product.unidad_medida}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        product.activo
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {product.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleOpenModal(product)}
                        className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50"
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        title={editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
        onClose={handleCloseModal}
        headerGradient="red"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {submitMessage && (
            <Alert
              type={submitMessage.type}
              message={submitMessage.message}
              onClose={() => setSubmitMessage(null)}
            />
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              label="Código SKU"
              tone="light"
              type="text"
              placeholder="Ej: SKU-001"
              value={formData.codigo_sku}
              onChange={(e) =>
                setFormData({ ...formData, codigo_sku: e.target.value })
              }
              error={errors.codigo_sku}
              disabled={isSubmitting}
            />

            <TextField
              label="Nombre del producto"
              tone="light"
              type="text"
              placeholder="Ej: Embutidos de salchichael"
              value={formData.nombre}
              onChange={(e) =>
                setFormData({ ...formData, nombre: e.target.value })
              }
              error={errors.nombre}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-xs text-neutral-600">
              Descripción (opcional)
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) =>
                setFormData({ ...formData, descripcion: e.target.value })
              }
              placeholder="Describe el producto..."
              className="min-h-[80px] w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-neutral-900 outline-none transition focus:border-brand-red/60 focus:shadow-[0_0_0_4px_rgba(240,65,45,0.18)] disabled:opacity-50"
              disabled={isSubmitting}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-xs text-neutral-600">Categoría</label>
            <select
              value={formData.categoria_id || ''}
              onChange={(e) =>
                setFormData({ 
                  ...formData, 
                  categoria_id: e.target.value ? parseInt(e.target.value) : null 
                })
              }
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-neutral-900 outline-none transition focus:border-brand-red/60 focus:shadow-[0_0_0_4px_rgba(240,65,45,0.18)] disabled:opacity-50"
              disabled={isSubmitting}
            >
              <option value="">Sin categoría</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              label="Peso unitario (kg)"
              tone="light"
              type="number"
              step="0.001"
              placeholder="Ej: 0.5"
              value={formData.peso_unitario_kg}
              onChange={(e) =>
                setFormData({ ...formData, peso_unitario_kg: parseFloat(e.target.value) || 0 })
              }
              error={errors.peso_unitario_kg}
              disabled={isSubmitting}
            />

            <TextField
              label="Volumen (m³) (opcional)"
              tone="light"
              type="number"
              step="0.0001"
              placeholder="Ej: 0.001"
              value={formData.volumen_m3 || ''}
              onChange={(e) =>
                setFormData({ ...formData, volumen_m3: e.target.value ? parseFloat(e.target.value) : null })
              }
              disabled={isSubmitting}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-xs text-neutral-600">Unidad de medida</label>
              <select
                value={formData.unidad_medida}
                onChange={(e) =>
                  setFormData({ ...formData, unidad_medida: e.target.value })
                }
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-neutral-900 outline-none transition focus:border-brand-red/60 focus:shadow-[0_0_0_4px_rgba(240,65,45,0.18)] disabled:opacity-50"
                disabled={isSubmitting}
              >
                <option value="UNIDAD">Unidad</option>
                <option value="GRAMO">Gramo</option>
                <option value="KILOGRAMO">Kilogramo</option>
                <option value="LITRO">Litro</option>
                <option value="MILILITRO">Mililitro</option>
              </select>
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
          </div>

          <div className="flex gap-6">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="requiere_frio"
                checked={formData.requiere_frio}
                onChange={(e) =>
                  setFormData({ ...formData, requiere_frio: e.target.checked })
                }
                className="h-4 w-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
                disabled={isSubmitting}
              />
              <label htmlFor="requiere_frio" className="text-sm text-neutral-700">
                Requiere frío
              </label>
            </div>

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
                Producto activo
              </label>
            </div>
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
                : editingProduct
                ? 'Actualizar'
                : 'Crear producto'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

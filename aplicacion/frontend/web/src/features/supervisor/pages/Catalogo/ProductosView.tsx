import { useState } from 'react'
import { PlusCircle } from 'lucide-react'
import { Modal } from 'components/ui/Modal'
import { TextField } from 'components/ui/TextField'
import { Alert } from 'components/ui/Alert'
import { LoadingSpinner } from 'components/ui/LoadingSpinner'
import { GenericDataTable, type GenericTableColumn } from '../../../../components/ui/GenericDataTable'
import { useEntityCrud } from '../../../../hooks/useEntityCrud'
import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  type Product,
  type CreateProductDto,
} from '../../services/productosApi'

export function ProductosView() {
  const { data: products, isLoading, error, create, update, delete: deleteItem } = useEntityCrud<Product, CreateProductDto, Partial<CreateProductDto>>({
    load: getAllProducts,
    create: createProduct,
    update: (id, data) => updateProduct(id as string, data as Partial<CreateProductDto>),
    delete: (id) => deleteProduct(id as string),
  })

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
        await update(editingProduct.id, formData)
        setSubmitMessage({
          type: 'success',
          message: 'Producto actualizado exitosamente',
        })
      } else {
        await create(formData)
        setSubmitMessage({
          type: 'success',
          message: 'Producto creado exitosamente',
        })
      }

      setTimeout(() => {
        handleCloseModal()
      }, 1500)
    } catch (err: any) {
      setSubmitMessage({
        type: 'error',
        message: err.message || 'Error al guardar el producto',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (product: Product) => {
    try {
      await deleteItem(product.id)
    } catch (err: any) {
      console.error('Error al eliminar:', err)
      alert(err.message || 'Error al eliminar el producto')
    }
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
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-brand-red text-white hover:bg-brand-red/90 px-4 py-2 rounded-lg font-semibold transition"
        >
          <PlusCircle className="h-4 w-4" />
          Nuevo producto
        </button>
      </div>

      {error && <Alert type="error" message={error} />}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <GenericDataTable<Product>
          data={products}
          columns={[
            { key: 'codigo_sku', label: 'SKU', className: 'font-medium' },
            {
              key: 'nombre',
              label: 'Nombre',
              render: (value, row) => (
                <div>
                  <p className="font-medium">{value}</p>
                  {row.descripcion && (
                    <p className="text-xs text-gray-500 line-clamp-1">{row.descripcion}</p>
                  )}
                </div>
              ),
            },
            { key: 'peso_unitario_kg', label: 'Peso (kg)' },
            { key: 'unidad_medida', label: 'Unidad' },
            {
              key: 'activo',
              label: 'Estado',
              render: (value) => (
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {value ? 'Activo' : 'Inactivo'}
                </span>
              ),
            },
          ]}
          onEdit={handleOpenModal}
          onDelete={handleDelete}
          emptyStateTitle="No hay productos"
          emptyStateDescription="Comienza creando tu primer producto"
        />
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
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2 rounded-lg text-neutral-700 bg-neutral-200 hover:bg-neutral-300 transition disabled:opacity-50"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-brand-red text-white hover:bg-brand-red/90 transition disabled:opacity-50 font-semibold"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Guardando...'
                : editingProduct
                ? 'Actualizar'
                : 'Crear producto'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

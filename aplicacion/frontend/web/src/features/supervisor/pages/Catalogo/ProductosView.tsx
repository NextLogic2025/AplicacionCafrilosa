import { useEffect, useState } from 'react'
import { PlusCircle } from 'lucide-react'
import { Alert } from 'components/ui/Alert'
import { useEntityCrud } from '../../../../hooks/useEntityCrud'
import { useModal } from '../../../../hooks/useModal'
import { getAllCategories, type Category } from '../../services/catalogApi'
import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  type Product,
  type CreateProductDto,
} from '../../services/productosApi'
import { ProductosList } from './ProductosList'
import { ProductosForm } from './ProductosForm'

export function ProductosView() {
  const [categories, setCategories] = useState<Category[]>([])
  const { data: products, isLoading, error, create, update, delete: deleteItem } = useEntityCrud<Product, CreateProductDto, Partial<CreateProductDto>>({
    load: getAllProducts,
    create: createProduct,
    update: (id, data) => updateProduct(id as string, data as Partial<CreateProductDto>),
    delete: (id) => deleteProduct(id as string),
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const modal = useModal<Product>()

  useEffect(() => {
    getAllCategories().then(setCategories).catch((err) => console.error('Error al cargar categorías:', err))
  }, [])

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true)
    try {
      if (modal.editingItem) {
        await update(modal.editingItem.id, data)
      } else {
        await create(data as CreateProductDto)
      }
      modal.close()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Productos</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Administra el catálogo de productos
          </p>
        </div>
        <button
          onClick={modal.openCreate}
          className="flex items-center gap-2 bg-brand-red text-white hover:bg-brand-red/90 px-4 py-2 rounded-lg font-semibold transition"
        >
          <PlusCircle className="h-4 w-4" />
          Nuevo producto
        </button>
      </div>

      {/* Alerts */}
      {error && <Alert type="error" message={error} />}

      {/* Lista de productos */}
      <ProductosList
        products={products}
        categories={categories}
        isLoading={isLoading}
        onEdit={modal.openEdit}
        onDelete={deleteItem}
      />

      {/* Formulario Modal */}
      <ProductosForm
        isOpen={modal.isOpen}
        onClose={modal.close}
        onSubmit={handleSubmit}
        editingItem={modal.editingItem}
        isEditing={modal.isEditing}
        categories={categories}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}

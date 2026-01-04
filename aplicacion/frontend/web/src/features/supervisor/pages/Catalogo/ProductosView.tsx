import { PlusCircle } from 'lucide-react'
import { Alert } from 'components/ui/Alert'
import { LoadingSpinner } from 'components/ui/LoadingSpinner'
import { GenericDataTable, type GenericTableColumn } from '../../../../components/ui/GenericDataTable'
import { EntityFormModal, type Field } from '../../../../components/ui/EntityFormModal'
import { useEntityCrud } from '../../../../hooks/useEntityCrud'
import { useModal } from '../../../../hooks/useModal'
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

  const modal = useModal<Product>()

  const handleSubmit = async (data: any) => {
    // Convertir a CreateProductDto con el parseo correcto de tipos
    const productData: Partial<CreateProductDto> = {
      codigo_sku: data.codigo_sku,
      nombre: data.nombre,
      descripcion: data.descripcion || undefined,
      peso_unitario_kg: typeof data.peso_unitario_kg === 'string' ? parseFloat(data.peso_unitario_kg) : data.peso_unitario_kg,
      volumen_m3: data.volumen_m3 ? (typeof data.volumen_m3 === 'string' ? parseFloat(data.volumen_m3) : data.volumen_m3) : undefined,
      unidad_medida: data.unidad_medida,
      imagen_url: data.imagen_url || undefined,
      requiere_frio: data.requiere_frio ?? false,
      activo: data.activo ?? true,
    }

    if (modal.editingItem) {
      await update(modal.editingItem.id, productData)
    } else {
      await create(productData as CreateProductDto)
    }
  }

  const handleDelete = async (product: Product) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return
    try {
      await deleteItem(product.id)
    } catch (err: any) {
      alert(err.message || 'Error al eliminar el producto')
    }
  }

  const columns: GenericTableColumn<Product>[] = [
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
  ]

  const fields: Field[] = [
    { name: 'codigo_sku', label: 'Código SKU', required: true, placeholder: 'Ej: SKU-001' },
    { name: 'nombre', label: 'Nombre del producto', required: true, placeholder: 'Ej: Embutidos de salchichael' },
    { name: 'descripcion', label: 'Descripción', type: 'textarea', placeholder: 'Describe el producto...' },
    { name: 'peso_unitario_kg', label: 'Peso unitario (kg)', type: 'number', required: true, placeholder: 'Ej: 0.5' },
    { name: 'volumen_m3', label: 'Volumen (m³)', type: 'number', placeholder: 'Ej: 0.001' },
    {
      name: 'unidad_medida',
      label: 'Unidad de medida',
      type: 'select',
      required: true,
      options: [
        { value: 'UNIDAD', label: 'Unidad' },
        { value: 'GRAMO', label: 'Gramo' },
        { value: 'KILOGRAMO', label: 'Kilogramo' },
        { value: 'LITRO', label: 'Litro' },
        { value: 'MILILITRO', label: 'Mililitro' },
      ],
    },
    { name: 'imagen_url', label: 'URL de imagen', type: 'url', placeholder: 'https://ejemplo.com/imagen.jpg' },
    { name: 'requiere_frio', label: 'Requiere frío', type: 'checkbox' },
    { name: 'activo', label: 'Producto activo', type: 'checkbox' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Productos</h2>
          <p className="mt-1 text-sm text-gray-600">
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

      {error && <Alert type="error" message={error} />}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <GenericDataTable<Product>
          data={products}
          columns={columns}
          onEdit={modal.openEdit}
          onDelete={handleDelete}
          emptyStateTitle="No hay productos"
          emptyStateDescription="Comienza creando tu primer producto"
        />
      )}

      <EntityFormModal<Product>
        isOpen={modal.isOpen}
        onClose={modal.close}
        title={modal.isEditing ? 'Editar Producto' : 'Nuevo Producto'}
        fields={fields}
        initialData={modal.editingItem || undefined}
        onSubmit={handleSubmit}
        headerGradient="red"
      />
    </div>
  )
}

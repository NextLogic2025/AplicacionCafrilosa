import { useEffect, useMemo, useState, useCallback } from 'react'
import { PlusCircle, Image as ImageIcon, Package, Tag } from 'lucide-react'
import { Alert } from 'components/ui/Alert'
import { LoadingSpinner } from 'components/ui/LoadingSpinner'
import { EntityFormModal, type Field } from '../../../../components/ui/EntityFormModal'
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

export function ProductosView() {
  const [categories, setCategories] = useState<Category[]>([])
  const { data: products, isLoading, error, create, update, delete: deleteItem } = useEntityCrud<Product, CreateProductDto, Partial<CreateProductDto>>({
    load: getAllProducts,
    create: createProduct,
    update: (id, data) => updateProduct(id as string, data as Partial<CreateProductDto>),
    delete: (id) => deleteProduct(id as string),
  })

  useEffect(() => {
    getAllCategories().then(setCategories).catch((err) => console.error('Error al cargar categorías:', err))
  }, [])

  const modal = useModal<Product>()

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>()
    categories.forEach((category) => {
      map.set(String(category.id), category.nombre)
    })
    return map
  }, [categories])

  const resolveCategoryLabel = useCallback(
    (product: Product) => {
      const pid = (product as any).categoria_id ?? (product as any).categoriaId ?? (product as any).categoriaID
      if (pid !== undefined && pid !== null && pid !== '') {
        return categoryNameById.get(String(pid)) || 'Categoría'
      }
      const catObj = (product as any).categoria
      if (catObj?.nombre) return catObj.nombre as string
      return 'Sin categoría'
    },
    [categoryNameById]
  )

  const handleSubmit = async (data: any) => {
    // Convertir a CreateProductDto con el parseo correcto de tipos
    const productData: Partial<CreateProductDto> = {
      codigo_sku: data.codigo_sku,
      nombre: data.nombre,
      descripcion: data.descripcion || undefined,
      categoria_id: data.categoria_id ? parseInt(data.categoria_id as string) : null,
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

  const fields: Field[] = [
    { name: 'codigo_sku', label: 'Código SKU', required: true, placeholder: 'Ej: SKU-001' },
    { name: 'nombre', label: 'Nombre del producto', required: true, placeholder: 'Ej: Embutidos de salchichael' },
    { name: 'descripcion', label: 'Descripción', type: 'textarea', placeholder: 'Describe el producto...' },
    {
      name: 'categoria_id',
      label: 'Categoría',
      type: 'select',
      options: categories.map((c: Category) => ({ value: String(c.id), label: c.nombre })),
    },
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
      ) : products.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <Package className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">No hay productos</h3>
          <p className="mt-2 text-sm text-gray-600">Comienza creando tu primer producto</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md"
            >
              {product.imagen_url ? (
                <div className="mb-4 h-32 overflow-hidden rounded-lg bg-gray-100">
                  <img src={product.imagen_url} alt={product.nombre} className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="mb-4 flex h-32 items-center justify-center rounded-lg bg-gradient-to-br from-gray-100 to-gray-200">
                  <ImageIcon className="h-12 w-12 text-gray-400" />
                </div>
              )}

              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">SKU: {product.codigo_sku}</p>
                  <h3 className="text-lg font-bold text-gray-900 truncate">{product.nombre}</h3>
                  <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 shadow-sm">
                    <Tag className="h-4 w-4" />
                    <span>{resolveCategoryLabel(product)}</span>
                  </div>
                  {product.descripcion && (
                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">{product.descripcion}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
                    <span className="rounded-full bg-gray-100 px-3 py-1 font-semibold text-gray-800">
                      {product.peso_unitario_kg} kg
                    </span>
                    {product.volumen_m3 && (
                      <span className="rounded-full bg-gray-100 px-3 py-1 font-semibold text-gray-800">
                        {product.volumen_m3} m³
                      </span>
                    )}
                    <span className="rounded-full bg-gray-100 px-3 py-1 font-semibold text-gray-800">
                      {product.unidad_medida}
                    </span>
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    product.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {product.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              {product.requiere_frio && (
                <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  Requiere frío
                </div>
              )}

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  onClick={() => modal.openEdit(product)}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                  title="Editar"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(product)}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                  title="Eliminar"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <EntityFormModal<Product>
        isOpen={modal.isOpen}
        onClose={modal.close}
        title={modal.isEditing ? 'Editar Producto' : 'Nuevo Producto'}
        fields={fields}
        initialData={
          modal.editingItem
            ? ({
                ...modal.editingItem,
                categoria_id:
                  modal.editingItem.categoria_id !== null && modal.editingItem.categoria_id !== undefined
                    ? String(modal.editingItem.categoria_id)
                    : '',
              } as unknown as Partial<Product>)
            : undefined
        }
        onSubmit={handleSubmit}
        headerGradient="red"
      />
    </div>
  )
}

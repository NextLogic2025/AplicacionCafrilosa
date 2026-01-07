import { useEffect, useMemo, useState, useCallback } from 'react'
import { PlusCircle, Image as ImageIcon, Package, Tag, Search, Filter, Pencil, Trash2 } from 'lucide-react'
import { Alert } from 'components/ui/Alert'
import { LoadingSpinner } from 'components/ui/LoadingSpinner'
import { StatusBadge } from 'components/ui/StatusBadge'
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
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
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
      // Primero intentar con el objeto categoria anidado
      if (product.categoria?.nombre) return product.categoria.nombre
      
      // Fallback a categoria_id
      const pid = product.categoria?.id ?? product.categoria_id
      if (pid !== undefined && pid !== null) {
        return categoryNameById.get(String(pid)) || 'Categoría'
      }
      
      return 'Sin categoría'
    },
    [categoryNameById]
  )

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Filtro de búsqueda
      const matchesSearch =
        searchTerm === '' ||
        product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.codigo_sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())

      // Filtro de categoría - usar categoria.id del objeto anidado
      const productCategoryId = product.categoria?.id ?? product.categoria_id ?? null
      const selectedCategoryNum = selectedCategory !== 'all' ? Number(selectedCategory) : null
      
      const matchesCategory =
        selectedCategory === 'all' ||
        productCategoryId === selectedCategoryNum

      return matchesSearch && matchesCategory
    })
  }, [products, searchTerm, selectedCategory])

  const handleSubmit = async (data: any) => {
    // Mantener estructura snake_case para el backend
    const productData: Partial<CreateProductDto> = {
      codigo_sku: data.codigo_sku,
      nombre: data.nombre,
      descripcion: data.descripcion || undefined,
      categoria_id: data.categoria_id && data.categoria_id !== '' ? parseInt(data.categoria_id as string) : null,
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
    modal.close()
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

      {error && <Alert type="error" message={error} />}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, SKU o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 bg-white py-2 pl-10 pr-4 text-sm outline-none transition focus:border-brand-red/60 focus:shadow-[0_0_0_4px_rgba(240,65,45,0.18)]"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-neutral-500" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-red/60 focus:shadow-[0_0_0_4px_rgba(240,65,45,0.18)]"
          >
            <option value="all">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat.id} value={String(cat.id)}>
                {cat.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-neutral-200">
            <Package className="h-8 w-8 text-neutral-500" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-neutral-900">
            {products.length === 0 ? 'No hay productos' : 'No se encontraron productos'}
          </h3>
          <p className="mt-2 text-sm text-neutral-600">
            {products.length === 0 
              ? 'Comienza creando tu primer producto' 
              : 'Intenta ajustar los filtros de búsqueda'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              {product.imagen_url ? (
                <div className="mb-0 h-32 overflow-hidden rounded-t-2xl bg-neutral-100">
                  <img src={product.imagen_url} alt={product.nombre} className="h-full w-full object-cover transition group-hover:scale-105" />
                </div>
              ) : (
                <div className="mb-0 flex h-32 items-center justify-center rounded-t-2xl bg-gradient-to-br from-neutral-100 to-neutral-200">
                  <ImageIcon className="h-12 w-12 text-neutral-400" />
                </div>
              )}

              <div className="px-6 py-6">
                <p className="text-xs text-neutral-500">SKU: {product.codigo_sku}</p>
                <h3 className="text-lg font-bold text-neutral-900 truncate">{product.nombre}</h3>
                <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 shadow-sm">
                  <Tag className="h-4 w-4" />
                  <span>{resolveCategoryLabel(product)}</span>
                </div>
                {product.descripcion && (
                  <p className="mt-1 text-sm text-neutral-600 line-clamp-2">{product.descripcion}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-neutral-600">
                  <span className="rounded-full bg-neutral-100 px-3 py-1 font-semibold text-neutral-800">
                    {product.peso_unitario_kg} kg
                  </span>
                  {product.volumen_m3 && (
                    <span className="rounded-full bg-neutral-100 px-3 py-1 font-semibold text-neutral-800">
                      {product.volumen_m3} m³
                    </span>
                  )}
                  <span className="rounded-full bg-neutral-100 px-3 py-1 font-semibold text-neutral-800">
                    {product.unidad_medida}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <StatusBadge variant={product.activo ? 'success' : 'neutral'}>
                      {product.activo ? 'Activo' : 'Inactivo'}
                    </StatusBadge>
                    {product.requiere_frio && (
                      <StatusBadge variant="info">
                        Frío
                      </StatusBadge>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-end gap-2">
                  <button
                    onClick={() => modal.openEdit(product)}
                    className="flex items-center gap-1.5 rounded-lg border border-brand-red px-3 py-1.5 text-sm font-semibold text-brand-red transition hover:bg-brand-red/5"
                    title="Editar producto"
                  >
                    <Pencil className="h-4 w-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(product)}
                    className="flex items-center gap-1.5 rounded-lg border border-red-600 px-3 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                    title="Eliminar producto"
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </button>
                </div>
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
                  modal.editingItem.categoria?.id !== null && modal.editingItem.categoria?.id !== undefined
                    ? String(modal.editingItem.categoria.id)
                    : modal.editingItem.categoria_id !== null && modal.editingItem.categoria_id !== undefined
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

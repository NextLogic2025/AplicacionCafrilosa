import { useMemo, useCallback, useState } from 'react'
import { Image as ImageIcon, Package, Tag, Search, Filter, Pencil, Trash2 } from 'lucide-react'
import { LoadingSpinner } from 'components/ui/LoadingSpinner'
import { StatusBadge } from 'components/ui/StatusBadge'
import { CardGrid, type CardGridItem } from 'components/ui/CardGrid'
import { type Product } from '../../../services/productosApi'
import { type Category } from '../../../services/catalogApi'

interface ProductosListProps {
  products: Product[]
  categories: Category[]
  isLoading: boolean
  onEdit: (product: Product) => void
  onDelete: (id: string | number) => Promise<void>
}

export function ProductosList({ products, categories, isLoading, onEdit, onDelete }: ProductosListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>()
    categories.forEach((category) => {
      map.set(String(category.id), category.nombre)
    })
    return map
  }, [categories])

  const resolveCategoryLabel = useCallback(
    (product: Product) => {
      if (product.categoria?.nombre) return product.categoria.nombre
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
      const matchesSearch =
        searchTerm === '' ||
        product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.codigo_sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())

      const productCategoryId = product.categoria?.id ?? product.categoria_id ?? null
      const selectedCategoryNum = selectedCategory !== 'all' ? Number(selectedCategory) : null

      const matchesCategory =
        selectedCategory === 'all' ||
        productCategoryId === selectedCategoryNum

      return matchesSearch && matchesCategory
    })
  }, [products, searchTerm, selectedCategory])

  const handleDelete = async (product: Product) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return
    try {
      await onDelete(product.id)
    } catch (err: any) {
      alert(err.message || 'Error al eliminar el producto')
    }
  }

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda y filtros */}
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

      {/* Contenido */}
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
        <CardGrid
          items={filteredProducts.map((product) => ({
            id: product.id,
            image: product.imagen_url || null,
            title: product.nombre,
            subtitle: `SKU: ${product.codigo_sku}`,
            tags: [resolveCategoryLabel(product)],
            description: product.descripcion || undefined,
            extra: (
              <>
                <StatusBadge variant={product.activo ? 'success' : 'neutral'}>
                  {product.activo ? 'Activo' : 'Inactivo'}
                </StatusBadge>
                {product.requiere_frio && (
                  <StatusBadge variant="info">Frío</StatusBadge>
                )}
              </>
            ),
            actions: (
              <div className="flex w-full gap-2 mt-2">
                <button
                  onClick={() => onEdit(product)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-brand-red bg-white px-3 py-2 text-sm font-semibold text-brand-red shadow-sm transition hover:bg-brand-red/90 hover:text-white hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-red/40"
                  title="Editar producto"
                >
                  <Pencil className="h-4 w-4" />
                  <span>Editar</span>
                </button>
                <button
                  onClick={() => handleDelete(product)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-red-600 bg-white px-3 py-2 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-600 hover:text-white hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-400"
                  title="Eliminar producto"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Eliminar</span>
                </button>
              </div>
            ),
          }))}
          columns={4}
        />
      )}
    </div>
  )
}

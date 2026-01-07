import { useEffect, useState, useMemo } from 'react'
import { PlusCircle, Package, Percent } from 'lucide-react'
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
import { getAllCampanias, type Campania, type ProductoPromocion, getProductosByCampania } from '../../services/promocionesApi'
import { ProductosList } from './ProductosList'
import { ProductosForm } from './ProductosForm'

export function ProductosView() {
  const [vistaActual, setVistaActual] = useState<'productos' | 'promociones'>('productos')
  const [categories, setCategories] = useState<Category[]>([])
  const [campanias, setCampanias] = useState<Campania[]>([])
  const [productosEnPromociones, setProductosEnPromociones] = useState<Map<string, ProductoPromocion[]>>(new Map())
  const [isLoadingPromos, setIsLoadingPromos] = useState(false)
  
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

  useEffect(() => {
    if (vistaActual === 'promociones') {
      cargarPromociones()
    }
  }, [vistaActual])

  const cargarPromociones = async () => {
    setIsLoadingPromos(true)
    try {
      const campanasData = await getAllCampanias()
      setCampanias(campanasData)
      
      // Cargar productos de cada campaña
      const productosMap = new Map<string, ProductoPromocion[]>()
      await Promise.all(
        campanasData.map(async (campania) => {
          try {
            const productosPromo = await getProductosByCampania(campania.id)
            if (productosPromo.length > 0) {
              productosMap.set(String(campania.id), productosPromo)
            }
          } catch (err) {
            console.error(`Error al cargar productos de campaña ${campania.id}:`, err)
          }
        })
      )
      setProductosEnPromociones(productosMap)
    } catch (err) {
      console.error('Error al cargar promociones:', err)
    } finally {
      setIsLoadingPromos(false)
    }
  }

  const productosConPromociones = useMemo(() => {
    const productosSet = new Set<string>()
    productosEnPromociones.forEach((prods) => {
      prods.forEach((p) => productosSet.add(p.producto_id))
    })
    return products.filter((p) => productosSet.has(p.id))
  }, [products, productosEnPromociones])

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
            {vistaActual === 'productos' ? 'Administra el catálogo de productos' : 'Productos en promociones activas'}
          </p>
        </div>
        {vistaActual === 'productos' && (
          <button
            onClick={modal.openCreate}
            className="flex items-center gap-2 bg-brand-red text-white hover:bg-brand-red/90 px-4 py-2 rounded-lg font-semibold transition"
          >
            <PlusCircle className="h-4 w-4" />
            Nuevo producto
          </button>
        )}
      </div>

      {/* Alerts */}
      {error && <Alert type="error" message={error} />}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-neutral-200">
        <button
          onClick={() => setVistaActual('productos')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            vistaActual === 'productos'
              ? 'border-brand-red text-brand-red'
              : 'border-transparent text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <Package className="h-4 w-4" />
          Todos los Productos
        </button>
        <button
          onClick={() => setVistaActual('promociones')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            vistaActual === 'promociones'
              ? 'border-brand-red text-brand-red'
              : 'border-transparent text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <Percent className="h-4 w-4" />
          Productos en Promociones
        </button>
      </div>

      {/* Vista de Productos */}
      {vistaActual === 'productos' && (
        <ProductosList
          products={products}
          categories={categories}
          isLoading={isLoading}
          onEdit={modal.openEdit}
          onDelete={deleteItem}
        />
      )}

      {/* Vista de Promociones */}
      {vistaActual === 'promociones' && (
        <div className="space-y-6">
          {isLoadingPromos ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-red border-t-transparent"></div>
            </div>
          ) : productosConPromociones.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-neutral-200">
                <Percent className="h-8 w-8 text-neutral-500" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-neutral-900">
                No hay productos en promociones
              </h3>
              <p className="mt-2 text-sm text-neutral-600">
                Los productos que estén en campañas promocionales aparecerán aquí
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {campanias
                .filter((campania) => productosEnPromociones.has(String(campania.id)))
                .map((campania) => {
                  const productosPromo = productosEnPromociones.get(String(campania.id)) || []
                  const productosIds = new Set(productosPromo.map((p) => p.producto_id))
                  const productosData = products.filter((p) => productosIds.has(p.id))

                  return (
                    <div key={campania.id} className="rounded-lg border border-neutral-200 bg-white p-6">
                      <div className="mb-4 flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-red/10">
                              <Percent className="h-5 w-5 text-brand-red" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-neutral-900">{campania.nombre}</h3>
                              {campania.descripcion && (
                                <p className="text-sm text-neutral-600">{campania.descripcion}</p>
                              )}
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2 text-xs">
                            <span className="rounded-full bg-neutral-100 px-3 py-1 font-semibold text-neutral-700">
                              {new Date(campania.fecha_inicio).toLocaleDateString('es-ES')} - {new Date(campania.fecha_fin).toLocaleDateString('es-ES')}
                            </span>
                            {campania.valor_descuento && (
                              <span className="rounded-full bg-brand-red/10 px-3 py-1 font-semibold text-brand-red">
                                {campania.tipo_descuento === 'PORCENTAJE'
                                  ? `${campania.valor_descuento}% OFF`
                                  : `$${campania.valor_descuento} OFF`}
                              </span>
                            )}
                            <span
                              className={`rounded-full px-3 py-1 font-semibold ${
                                campania.activo
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-neutral-100 text-neutral-700'
                              }`}
                            >
                              {campania.activo ? 'Activa' : 'Inactiva'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {productosData.map((product) => {
                          const productoPromo = productosPromo.find((p) => p.producto_id === product.id)
                          return (
                            <div
                              key={product.id}
                              className="rounded-lg border border-neutral-200 bg-neutral-50 p-4"
                            >
                              <div className="flex items-start gap-3">
                                {product.imagen_url ? (
                                  <img
                                    src={product.imagen_url}
                                    alt={product.nombre}
                                    className="h-16 w-16 rounded-lg object-cover"
                                  />
                                ) : (
                                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-neutral-200">
                                    <Package className="h-8 w-8 text-neutral-400" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-neutral-500">SKU: {product.codigo_sku}</p>
                                  <h4 className="font-semibold text-neutral-900 truncate">{product.nombre}</h4>
                                  {productoPromo?.precio_oferta_fijo && (
                                    <p className="mt-1 text-sm font-bold text-brand-red">
                                      Precio Oferta: ${productoPromo.precio_oferta_fijo}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      )}

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

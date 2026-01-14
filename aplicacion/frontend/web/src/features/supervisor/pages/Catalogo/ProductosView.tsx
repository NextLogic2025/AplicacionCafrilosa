import { useEffect, useState } from 'react'
import { PlusCircle, Package, Percent } from 'lucide-react'
import { Alert } from 'components/ui/Alert'
import { NotificationStack } from 'components/ui/NotificationStack'
import { useEntityCrud } from '../../../../hooks/useEntityCrud'
import { useModal } from '../../../../hooks/useModal'
import { useNotification } from '../../../../hooks/useNotification'
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
import { ProductosList } from './productos/ProductosList'
import { ProductosForm } from './productos/ProductosForm'
import { ProductosPromocionesView } from './productos/ProductosPromocionesView'

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
  const { notifications, success, error: notifyError, remove: removeNotification } = useNotification()

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
            // La API puede devolver distintos formatos; normalizamos a ProductoPromocion[]
            const productosPromoRaw = (await getProductosByCampania(campania.id)) as unknown as any[]

            let normalizados: ProductoPromocion[] = []
            if (Array.isArray(productosPromoRaw) && productosPromoRaw.length > 0) {
              const first = productosPromoRaw[0] as any
              if (first && Object.prototype.hasOwnProperty.call(first, 'producto_id')) {
                // Ya viene en el formato esperado
                normalizados = productosPromoRaw as ProductoPromocion[]
              } else {
                // Viene como productos completos u otro formato: mapeamos
                normalizados = productosPromoRaw.map((p: any) => {
                  const productoId = String(p.producto_id ?? p.id)
                  const codigo_sku = p.codigo_sku ?? p.producto?.codigo_sku ?? ''
                  const nombre = p.nombre ?? p.producto?.nombre ?? ''
                  const precioOferta = p.precio_oferta_fijo ?? null
                  return {
                    campania_id: campania.id,
                    producto_id: productoId,
                    precio_oferta_fijo: precioOferta,
                    producto: {
                      id: productoId,
                      codigo_sku,
                      nombre,
                    },
                  } as ProductoPromocion
                })
              }
            }

            if (normalizados.length > 0) {
              productosMap.set(String(campania.id), normalizados)
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

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true)
    try {
      if (modal.editingItem) {
        await update(modal.editingItem.id, data)
        success('Producto actualizado exitosamente')
      } else {
        await create(data as CreateProductDto)
        success('Producto creado exitosamente')
      }
      modal.close()
    } catch (err: any) {
      notifyError(err.message || 'Error al guardar el producto')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string | number) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return
    try {
      await deleteItem(id)
      success('Producto eliminado exitosamente')
    } catch (err: any) {
      notifyError(err.message || 'Error al eliminar el producto')
    }
  }

  return (
    <div className="space-y-6">
      <NotificationStack notifications={notifications} onRemove={removeNotification} />
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
          onDelete={handleDelete}
        />
      )}

      {/* Vista de Promociones */}
      {vistaActual === 'promociones' && (
        <ProductosPromocionesView
          campanias={campanias}
          productosEnPromociones={productosEnPromociones}
          products={products}
          isLoading={isLoadingPromos || isLoading}
        />
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

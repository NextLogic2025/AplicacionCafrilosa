
import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHero } from '../../../../components/ui/PageHero'
import { EmptyContent } from '../../../../components/ui/EmptyContent'
import { ProductCard } from '../../../../components/ui/ProductCard'
import { Package, Search, Filter, Users, Store, ShoppingCart, Plus, Minus } from 'lucide-react'
import { getAllProducts, Product } from '../../../supervisor/services/productosApi'
import { getClientesAsignados, getProductosPorCliente } from '../../services/vendedorApi'
import type { Cliente } from '../../../supervisor/services/clientesApi'
import type { Producto } from '../../../cliente/types'
import { getAllCategories } from '../../../supervisor/services/catalogApi'
import { useMemo } from 'react'
import ProductDetailModal from '../../../cliente/components/ProductDetailModal'
import { httpOrders } from '../../../../services/api/http'


export default function VendedorProductos() {
  const navigate = useNavigate()
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  const [categoryId, setCategoryId] = useState<string>('')
  const [filtros, setFiltros] = useState({ category: 'all', minPrice: 0, maxPrice: 10000, inStock: true })
  const [categories, setCategories] = useState<{ id: number; nombre: string }[]>([])

  // Nuevo estado para clientes
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState<string>('')
  const [loadingClientes, setLoadingClientes] = useState(true)

  // Estado para modal de detalles
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // Estado para carrito temporal
  const [cart, setCart] = useState<Array<{ producto: Producto; cantidad: number }>>([])

  // Estado para toast de confirmación
  const [showToast, setShowToast] = useState(false)
  const [lastAddedProduct, setLastAddedProduct] = useState<Producto | null>(null)

  // Función de mapeo unificada
  const mapProductToFrontend = useCallback((items: any[]): Producto[] => {
    return items.map((p) => {
      const anyP = p as any
      const rawBase = anyP.precio_base ?? anyP.precio ?? null
      const rawOferta = anyP.precio_oferta ?? null
      const precioBase = typeof rawBase === 'string' ? Number(rawBase) : rawBase
      const precioOferta = typeof rawOferta === 'string' ? Number(rawOferta) : rawOferta
      const price = (precioOferta ?? precioBase ?? 0) as number
      return {
        id: p.id,
        name: p.nombre,
        description: p.descripcion || '',
        price,
        precio_original: typeof precioBase === 'number' && precioOferta != null ? precioBase : (typeof anyP.precio_original === 'number' ? anyP.precio_original : undefined),
        precio_oferta: typeof precioOferta === 'number' ? precioOferta : undefined,
        promociones: anyP.promociones || undefined,
        image: p.imagen_url || '',
        category: p.categoria?.nombre || '',
        inStock: p.activo,
        rating: 0,
        reviews: 0,
      }
    })
  }, [])

  // Cargar clientes asignados
  useEffect(() => {
    getClientesAsignados()
      .then(data => setClientes(data))
      .catch(() => setClientes([]))
      .finally(() => setLoadingClientes(false))
  }, [])

  // Cargar productos (todos o por cliente)
  useEffect(() => {
    setLoading(true)
    const fetchProductos = async () => {
      try {
        let items: any[] = []
        if (clienteSeleccionado) {
          // Si hay cliente seleccionado, usar endpoint específico (asumiendo que devuelve estructura similar)
          // Nota: getProductosPorCliente en API devuelve Producto[], pero mapeamos manualmente para asegurar consistencia
          // con la estructura que realmente llega del backend (que suele ser tipo Product)
          const resp = await getProductosPorCliente(clienteSeleccionado)
          items = resp
        } else {
          items = await getAllProducts()
        }
        setProductos(mapProductToFrontend(items))
      } catch (error) {
        console.error('Error cargando productos:', error)
        setProductos([])
      } finally {
        setLoading(false)
      }
    }
    fetchProductos()
  }, [clienteSeleccionado, mapProductToFrontend])

  useEffect(() => {
    const cargar = async () => {
      setCargando(true)
      setCargando(false)
    }
    cargar()
  }, [])

  useEffect(() => {
    let mounted = true
    getAllCategories()
      .then(list => {
        if (!mounted) return
        setCategories(list.map(c => ({ id: c.id, nombre: c.nombre })))
      })
      .catch(() => { })
    return () => { mounted = false }
  }, [])

  const productosFiltrados = useMemo(
    () =>
      productos.filter(producto => {
        const coincideBusqueda =
          producto.name.toLowerCase().includes(busqueda.toLowerCase()) ||
          producto.description.toLowerCase().includes(busqueda.toLowerCase())
        const coincideCategoria = filtros.category === 'all' || producto.category === filtros.category
        const coincidePrecio = producto.price >= filtros.minPrice && producto.price <= filtros.maxPrice
        const coincideStock = !filtros.inStock || producto.inStock
        return coincideBusqueda && coincideCategoria && coincidePrecio && coincideStock
      }),
    [busqueda, filtros.category, filtros.inStock, filtros.maxPrice, filtros.minPrice, productos],
  )

  const openDetail = (producto: Producto) => {
    setSelectedProducto(producto)
    setIsDetailOpen(true)
  }

  const closeDetail = () => {
    setIsDetailOpen(false)
    setSelectedProducto(null)
  }

  const addToCart = async (producto: Producto) => {
    if (!clienteSeleccionado) {
      alert('Debe seleccionar un cliente primero')
      return
    }

    try {
      // Verificar si el producto ya está en el carrito local
      const existingItem = cart.find(item => item.producto.id === producto.id)
      const newQuantity = existingItem ? existingItem.cantidad + 1 : 1

      console.log('Adding to cart:', {
        productoId: producto.id,
        existingQuantity: existingItem?.cantidad || 0,
        newQuantity
      })

      // Llamar al backend para agregar/actualizar el carrito usando httpOrders
      await httpOrders(`/orders/cart/client/${clienteSeleccionado}`, {
        method: 'POST',
        body: {
          producto_id: producto.id,
          cantidad: newQuantity  // Enviar la cantidad total, no solo +1
        }
      })

      // Actualizar estado local
      setCart(prev => {
        const existing = prev.find(item => item.producto.id === producto.id)
        if (existing) {
          return prev.map(item =>
            item.producto.id === producto.id
              ? { ...item, cantidad: item.cantidad + 1 }
              : item
          )
        }
        return [...prev, { producto, cantidad: 1 }]
      })

      // Mostrar toast de confirmación
      setLastAddedProduct(producto)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
    } catch (error) {
      console.error('Error adding to cart:', error)
      alert('Error al agregar producto al carrito')
    }
  }

  const goToCrearPedido = () => {
    // Guardar en localStorage
    localStorage.setItem('vendedor_cart', JSON.stringify(cart))
    localStorage.setItem('vendedor_cliente_seleccionado', clienteSeleccionado)
    navigate('/vendedor/crear-pedido')
  }

  // Cargar carrito desde localStorage al montar
  useEffect(() => {
    const savedCart = localStorage.getItem('vendedor_cart')
    const savedCliente = localStorage.getItem('vendedor_cliente_seleccionado')
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart))
      } catch (e) {
        // ignore
      }
    }
    if (savedCliente) {
      setClienteSeleccionado(savedCliente)
    }
  }, [])

  // Guardar carrito en localStorage cuando cambie
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem('vendedor_cart', JSON.stringify(cart))
    }
  }, [cart])

  // Guardar cliente seleccionado cuando cambie
  useEffect(() => {
    if (clienteSeleccionado) {
      localStorage.setItem('vendedor_cliente_seleccionado', clienteSeleccionado)
    }
  }, [clienteSeleccionado])

  // TODO: Implementar filtros si es necesario

  return (
    <div className="space-y-6">
      <PageHero
        title="Catálogo de Productos"
        subtitle="Explora el catálogo completo para crear pedidos"
        chips={[
          { label: 'Solo lectura', variant: 'neutral' },
          { label: 'Precios base', variant: 'blue' },
        ]}
      />



      {/* Toast de confirmación - estilo cliente */}
      {showToast && lastAddedProduct && (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm transition-all duration-300 translate-y-0 opacity-100">
          <div
            className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xl"
            onMouseEnter={() => {
              // Pausar auto-cierre al pasar el mouse
            }}
          >
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-brand-red/10 p-2 text-brand-red">
                <ShoppingCart size={18} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-neutral-900 flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500"></span>
                  Producto agregado al carrito
                </p>
                <p className="text-sm text-neutral-600">{lastAddedProduct.name}</p>
                <p className="text-xs text-neutral-500">
                  Cantidad total: {cart.find(item => item.producto.id === lastAddedProduct.id)?.cantidad || 1}
                </p>
              </div>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={() => setShowToast(false)}
                className="rounded-full p-1 text-neutral-500 hover:bg-neutral-100"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl border border-neutral-200 px-3 py-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Disminuir"
                  onClick={() => {
                    const currentQty = cart.find(item => item.producto.id === lastAddedProduct.id)?.cantidad || 1
                    if (currentQty > 1) {
                      setCart(prev => prev.map(item =>
                        item.producto.id === lastAddedProduct.id
                          ? { ...item, cantidad: item.cantidad - 1 }
                          : item
                      ))
                    } else {
                      setCart(prev => prev.filter(item => item.producto.id !== lastAddedProduct.id))
                      setShowToast(false)
                    }
                  }}
                  className="rounded-lg border border-neutral-200 bg-neutral-50 p-1 text-neutral-700 hover:bg-neutral-100"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center text-sm font-semibold">
                  {cart.find(item => item.producto.id === lastAddedProduct.id)?.cantidad || 1}
                </span>
                <button
                  type="button"
                  aria-label="Aumentar"
                  onClick={() => {
                    setCart(prev => prev.map(item =>
                      item.producto.id === lastAddedProduct.id
                        ? { ...item, cantidad: item.cantidad + 1 }
                        : item
                    ))
                  }}
                  className="rounded-lg border border-neutral-200 bg-neutral-50 p-1 text-neutral-700 hover:bg-neutral-100"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="text-right text-sm">
                <p className="font-semibold text-neutral-900">
                  ${((cart.find(item => item.producto.id === lastAddedProduct.id)?.cantidad || 1) * lastAddedProduct.price).toFixed(2)}
                </p>
                <p className="text-xs text-neutral-500">
                  Carrito: {cart.reduce((sum, item) => sum + item.cantidad, 0)} productos · ${cart.reduce((sum, item) => sum + (item.producto.price * item.cantidad), 0).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={goToCrearPedido}
                className="rounded-xl bg-brand-red px-3 py-2 text-sm font-semibold text-white hover:brightness-90"
              >
                Ver carrito
              </button>
              <button
                type="button"
                onClick={() => setShowToast(false)}
                className="rounded-xl border border-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
              >
                Seguir comprando
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selector de Cliente y Filtros */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">Seleccionar Cliente para ver precios específicos</label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
              <Store size={18} />
            </div>
            <select
              value={clienteSeleccionado}
              onChange={(e) => setClienteSeleccionado(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-red-500 focus:ring-red-500 sm:max-w-md"
              disabled={loadingClientes}
            >
              <option value="">-- Catálogo General --</option>
              {clientes.map(cliente => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.razon_social || cliente.nombre_comercial} ({cliente.identificacion || 'Sin ID'})
                </option>
              ))}
            </select>
            {loadingClientes && <div className="absolute right-3 top-2.5 text-xs text-gray-400">Cargando...</div>}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Nombre o código..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-transparent focus:ring-2 focus:ring-red-500"
            />
          </div>
          <button
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 transition hover:bg-gray-50"
          >
            <Filter size={20} />
            <span>Filtros</span>
          </button>
        </div>

        {mostrarFiltros && (
          <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4 mt-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Categoría</label>
              <select
                value={categoryId || 'all'}
                onChange={e => {
                  const val = e.target.value
                  if (val === 'all') {
                    setCategoryId('')
                    setFiltros({ ...filtros, category: 'all' })
                    return
                  }
                  setCategoryId(val)
                  const idNum = Number(val)
                  const found = categories.find(c => c.id === idNum)
                  setFiltros({ ...filtros, category: found ? found.nombre : 'all' })
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-red-500"
              >
                <option value="all">Todas las categorías</option>
                {categories.map(cat => (
                  <option key={cat.id} value={String(cat.id)}>{cat.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Precio: ${filtros.minPrice} - ${filtros.maxPrice}</label>
              <input
                type="range"
                min="0"
                max="10000"
                step="10"
                value={filtros.maxPrice}
                onChange={e => setFiltros({ ...filtros, maxPrice: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="inStock"
                checked={filtros.inStock}
                onChange={e => setFiltros({ ...filtros, inStock: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="inStock" className="text-sm text-gray-700">
                Solo productos disponibles
              </label>
            </div>

            <button
              onClick={() => setMostrarFiltros(false)}
              className="w-full rounded-lg bg-gray-200 px-4 py-2 text-sm transition hover:bg-gray-300"
            >
              Cerrar Filtros
            </button>
          </div>
        )}
      </section>

      {/* Catálogo */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="text-lg font-bold text-neutral-950 mb-4">Catálogo Completo</h3>
        {loading ? (
          <div className="flex justify-center items-center h-32">Cargando productos...</div>
        ) : productos.length === 0 ? (
          <EmptyContent
            icon={<Package className="h-16 w-16" />}
            title="No hay productos disponibles"
            description="El catálogo de productos se cargará desde el backend"
          />
        ) : (
          <div>
            {productosFiltrados.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-600">No se encontraron productos con los filtros seleccionados.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {productosFiltrados.map((producto) => (
                  <ProductCard
                    key={producto.id}
                    producto={producto}
                    onAddToCart={() => addToCart(producto)}
                    onView={openDetail}
                    fetchPromos
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Información */}
      <section className="rounded-xl border border-orange-200 bg-orange-50 p-6">
        <h4 className="font-semibold text-orange-900 mb-2">Limitaciones del Rol</h4>
        <ul className="text-sm text-orange-800 space-y-1">
          <li>✗ No puedes cambiar precios</li>
          <li>✗ No puedes crear productos</li>
          <li>✓ Visualiza precios base y presentaciones</li>
          <li>✓ Los productos se usan al crear pedidos</li>
        </ul>
      </section>

      {/* Modal de detalles del producto */}
      {selectedProducto && (
        <ProductDetailModal
          producto={selectedProducto}
          isOpen={isDetailOpen}
          onClose={closeDetail}
          onAddToCart={() => { }}
        />
      )}
    </div>
  )
}

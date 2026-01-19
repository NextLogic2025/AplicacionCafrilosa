import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHero } from '../../../../components/ui/PageHero'
import { ActionButton } from '../../../../components/ui/ActionButton'
import { EmptyContent } from '../../../../components/ui/EmptyContent'
import { ShoppingCart, Users, Package, Trash2, Plus, Minus, ArrowLeft } from 'lucide-react'
import { getClientesAsignados } from '../../services/vendedorApi'
import type { Cliente } from '../../../supervisor/services/clientesApi'
import type { Producto } from '../../../cliente/types'
import { Alert } from '../../../../components/ui/Alert'

interface CartItem {
  producto: Producto
  cantidad: number
}

export default function VendedorCrearPedido() {
  const navigate = useNavigate()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState<string>('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [isLoadingClientes, setIsLoadingClientes] = useState(false)
  const [condicionPago, setCondicionPago] = useState<'CONTADO' | 'CREDITO'>('CONTADO')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar clientes y carrito desde backend
  useEffect(() => {
    setIsLoadingClientes(true)
    getClientesAsignados()
      .then(data => setClientes(data))
      .catch(() => setClientes([]))
      .finally(() => setIsLoadingClientes(false))

    // Cargar cliente desde localStorage
    const savedCliente = localStorage.getItem('vendedor_cliente_seleccionado')
    if (savedCliente) {
      setClienteSeleccionado(savedCliente)
      // Cargar carrito desde backend
      loadCartFromBackend(savedCliente)
    }
  }, [])

  const loadCartFromBackend = async (clienteId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_ORDERS_BASE_URL}/api/orders/cart/client/${clienteId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const cartData = await response.json()
        console.log('Cart from backend:', cartData)

        // El backend devuelve: { id, usuario_id, vendedor_id, items: [...] }
        if (cartData.items && Array.isArray(cartData.items)) {
          // Necesitamos obtener los detalles de los productos para cada item
          const cartItems: CartItem[] = []

          for (const item of cartData.items) {
            try {
              // Obtener detalles del producto desde el catálogo
              const productResponse = await fetch(`${import.meta.env.VITE_CATALOGO_BASE_URL}/api/products/${item.producto_id}`, {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
              })

              if (productResponse.ok) {
                const productData = await productResponse.json()

                // Mapear a nuestro formato de Producto
                const producto: Producto = {
                  id: productData.id,
                  name: productData.nombre,
                  description: productData.descripcion || '',
                  price: item.precio_unitario || productData.precio_base || 0,
                  image: productData.imagen_url || '',
                  category: productData.categoria?.nombre || '',
                  inStock: productData.activo,
                  rating: 0,
                  reviews: 0
                }

                cartItems.push({
                  producto,
                  cantidad: item.cantidad
                })
              }
            } catch (err) {
              console.error(`Error loading product ${item.producto_id}:`, err)
            }
          }

          setCart(cartItems)
        }
      }
    } catch (error) {
      console.error('Error loading cart:', error)
    }
  }

  const updateQuantity = async (productoId: string, newQuantity: number) => {
    if (!clienteSeleccionado) return

    if (newQuantity <= 0) {
      removeItem(productoId)
      return
    }

    try {
      // Actualizar en el backend
      const response = await fetch(`${import.meta.env.VITE_ORDERS_BASE_URL}/api/orders/cart/client/${clienteSeleccionado}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          producto_id: productoId,
          cantidad: newQuantity
        })
      })

      if (!response.ok) {
        throw new Error('Error al actualizar cantidad')
      }

      // Actualizar estado local
      setCart(prev => prev.map(item =>
        item.producto.id === productoId
          ? { ...item, cantidad: newQuantity }
          : item
      ))
    } catch (error) {
      console.error('Error updating quantity:', error)
      setError('Error al actualizar la cantidad')
    }
  }

  const removeItem = async (productoId: string) => {
    if (!clienteSeleccionado) return

    try {
      // Eliminar del backend
      const response = await fetch(`${import.meta.env.VITE_ORDERS_BASE_URL}/api/orders/cart/client/${clienteSeleccionado}/item/${productoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        throw new Error('Error al eliminar producto')
      }

      // Actualizar estado local
      setCart(prev => prev.filter(item => item.producto.id !== productoId))
    } catch (error) {
      console.error('Error removing item:', error)
      setError('Error al eliminar el producto')
    }
  }

  const clearCart = async () => {
    if (!clienteSeleccionado) return

    try {
      // Limpiar en el backend
      const response = await fetch(`${import.meta.env.VITE_ORDERS_BASE_URL}/api/orders/cart/client/${clienteSeleccionado}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        throw new Error('Error al limpiar carrito')
      }

      // Actualizar estado local
      setCart([])
      localStorage.removeItem('vendedor_cart')
      localStorage.removeItem('vendedor_cliente_seleccionado')
    } catch (error) {
      console.error('Error clearing cart:', error)
      setError('Error al limpiar el carrito')
    }
  }

  const goBackToProducts = () => {
    navigate('/vendedor/productos')
  }

  const handleSubmitOrder = async () => {
    if (!clienteSeleccionado) {
      setError('Debe seleccionar un cliente')
      return
    }

    if (cart.length === 0) {
      setError('El carrito está vacío')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      // Preparar los items del pedido
      const items = cart.map(item => ({
        producto_id: item.producto.id,
        cantidad: item.cantidad,
        precio_unitario: item.producto.price
      }))

      // Llamar al endpoint del backend
      const response = await fetch(`${import.meta.env.VITE_ORDERS_BASE_URL}/api/orders/from-cart/client/${clienteSeleccionado}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          items,
          condicionPago
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error al crear el pedido' }))
        throw new Error(errorData.message || 'Error al crear el pedido')
      }

      const pedido = await response.json()

      // Limpiar carrito y localStorage
      clearCart()

      // Mostrar mensaje de éxito
      alert(`¡Pedido creado exitosamente! ID: ${pedido.id}`)

      // Redirigir a la lista de pedidos o dashboard
      navigate('/vendedor/pedidos')
    } catch (err) {
      console.error('Error creating order:', err)
      setError(err instanceof Error ? err.message : 'Error al crear el pedido')
    } finally {
      setIsSubmitting(false)
    }
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.producto.price * item.cantidad), 0)
  const totalItems = cart.reduce((sum, item) => sum + item.cantidad, 0)

  const clienteInfo = clientes.find(c => c.id === clienteSeleccionado)

  return (
    <div className="space-y-6">
      <PageHero
        title="Crear Pedido"
        subtitle="Gestión de pedidos para clientes"
        chips={[
          { label: 'Módulo principal', variant: 'red' },
          { label: 'Gestión comercial', variant: 'blue' },
        ]}
      />

      {error && (
        <Alert
          type="error"
          title="Error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {/* Información del cliente */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="text-lg font-bold text-neutral-950 mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Cliente Seleccionado
        </h3>

        {clienteInfo ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="font-semibold text-blue-900">{clienteInfo.razon_social || clienteInfo.nombre_comercial}</p>
            <p className="text-sm text-blue-700">ID: {clienteInfo.identificacion || 'N/A'}</p>
          </div>
        ) : (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-orange-800">No hay cliente seleccionado</p>
            <button
              onClick={goBackToProducts}
              className="mt-2 text-sm text-orange-600 hover:text-orange-800 font-medium"
            >
              ← Volver a Productos para seleccionar cliente
            </button>
          </div>
        )}
      </section>

      {/* Condición de Pago */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="text-lg font-bold text-neutral-950 mb-4">Condición de Pago</h3>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="condicionPago"
              value="CONTADO"
              checked={condicionPago === 'CONTADO'}
              onChange={(e) => setCondicionPago(e.target.value as 'CONTADO' | 'CREDITO')}
              className="h-4 w-4 text-brand-red focus:ring-brand-red"
            />
            <span className="text-sm font-medium text-gray-900">Contado</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="condicionPago"
              value="CREDITO"
              checked={condicionPago === 'CREDITO'}
              onChange={(e) => setCondicionPago(e.target.value as 'CONTADO' | 'CREDITO')}
              className="h-4 w-4 text-brand-red focus:ring-brand-red"
            />
            <span className="text-sm font-medium text-gray-900">Crédito</span>
          </label>
        </div>
      </section>

      {/* Productos en el carrito */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-neutral-950 flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Productos Seleccionados ({totalItems})
          </h3>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-sm text-red-600 hover:text-red-800 font-medium flex items-center gap-1"
            >
              <Trash2 className="h-4 w-4" />
              Limpiar carrito
            </button>
          )}
        </div>

        {cart.length === 0 ? (
          <div className="py-12">
            <EmptyContent
              icon={<Package className="h-16 w-16" />}
              title="No hay productos seleccionados"
              description="Ve a la página de Productos para agregar items al pedido"
            />
            <div className="flex justify-center mt-4">
              <button
                onClick={goBackToProducts}
                className="flex items-center gap-2 px-6 py-3 bg-brand-red text-white rounded-lg hover:bg-red-700 transition"
              >
                <ArrowLeft className="h-5 w-5" />
                Ir a Productos
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Tabla de productos */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Producto</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Precio Unit.</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Cantidad</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Subtotal</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cart.map((item) => (
                    <tr key={item.producto.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {item.producto.image && (
                            <img
                              src={item.producto.image}
                              alt={item.producto.name}
                              className="h-12 w-12 rounded object-cover"
                            />
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{item.producto.name}</p>
                            <p className="text-sm text-gray-500">{item.producto.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="font-medium text-gray-900">${item.producto.price.toFixed(2)}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.producto.id, item.cantidad - 1)}
                            className="p-1 rounded hover:bg-gray-200 transition"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-12 text-center font-semibold">{item.cantidad}</span>
                          <button
                            onClick={() => updateQuantity(item.producto.id, item.cantidad + 1)}
                            className="p-1 rounded hover:bg-gray-200 transition"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="font-bold text-gray-900">
                          ${(item.producto.price * item.cantidad).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => removeItem(item.producto.id)}
                          className="text-red-600 hover:text-red-800 transition"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Resumen del pedido */}
            <div className="border-t border-gray-200 pt-4 mt-6">
              <div className="flex justify-end">
                <div className="w-full max-w-sm space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total de items:</span>
                    <span className="font-semibold">{totalItems}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                    <span>Total:</span>
                    <span className="text-brand-red">${subtotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
              <button
                onClick={goBackToProducts}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                ← Agregar más productos
              </button>
              <button
                onClick={handleSubmitOrder}
                disabled={!clienteSeleccionado || isSubmitting}
                className="px-6 py-3 bg-brand-red text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Creando pedido...
                  </>
                ) : (
                  'Crear Pedido'
                )}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

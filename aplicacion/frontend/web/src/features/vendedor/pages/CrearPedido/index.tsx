import { useEffect, useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHero } from '../../../../components/ui/PageHero'
import { SectionHeader } from '../../../../components/ui/SectionHeader'
import { Alert } from '../../../../components/ui/Alert'
import { ShoppingCart, Users, Package, Trash2, Plus, Minus, ArrowLeft, CheckCircle2, Info, Building2 } from 'lucide-react'
import { getClientesAsignados } from '../../services/vendedorApi'
import type { Cliente } from '../../../supervisor/services/clientesApi'
import type { Producto } from '../../../cliente/types'
import { httpOrders, httpCatalogo } from '../../../../services/api/http'
import { fetchSucursalesByCliente } from '../../../cliente/pages/sucursal/sucursalesApi'

interface CartItem {
  producto: Producto
  cantidad: number
}

interface SucursalCliente {
  id: string
  nombre_sucursal: string
  direccion_entrega?: string
  contacto_nombre?: string
  contacto_telefono?: string
  zona_nombre?: string
  // Alias para compatibilidad
  nombre?: string
  direccion?: string
  ciudad?: string
  estado?: string
}

interface ClienteDetalle extends Omit<Cliente, 'limite_credito' | 'saldo_actual' | 'deuda_actual' | 'dias_plazo' | 'direccion_texto'> {
  creditLimit?: number
  currentDebt?: number
  limite_credito?: string | number
  saldo_actual?: string | number
  deuda_actual?: string | number
  dias_plazo?: number
  direccion?: string
  direccion_texto?: string
  ciudad?: string
  estado?: string
}

export default function VendedorCrearPedido() {
  const navigate = useNavigate()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState<string>('')
  const [clienteDetalle, setClienteDetalle] = useState<ClienteDetalle | null>(null)
  const [sucursales, setSucursales] = useState<SucursalCliente[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [isLoadingClientes, setIsLoadingClientes] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Estado para destino del pedido
  const [destinoTipo, setDestinoTipo] = useState<'cliente' | 'sucursal'>('cliente')
  const [selectedSucursalId, setSelectedSucursalId] = useState<string | null>(null)
  const [invalidSucursalMessage, setInvalidSucursalMessage] = useState<string | null>(null)

  // Estado para condición de pago manual
  const [condicionPagoManual, setCondicionPagoManual] = useState<'CONTADO' | 'CREDITO'>('CREDITO')

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
      // Cargar detalles del cliente (crédito)
      loadClienteDetalle(savedCliente)
      // Cargar sucursales del cliente
      loadSucursales(savedCliente)
    }
  }, [])

  const loadCartFromBackend = async (clienteId: string) => {
    try {
      const cartData = await httpOrders<any>(`/orders/cart/client/${clienteId}`)
      console.log('Cart from backend:', cartData)

      // El backend devuelve: { id, usuario_id, vendedor_id, items: [...] }
      if (cartData.items && Array.isArray(cartData.items)) {
        console.log('Cart items from backend:', cartData.items)

        // Necesitamos obtener los detalles de los productos para cada item
        const cartItems: CartItem[] = []

        for (const item of cartData.items) {
          console.log('Processing cart item:', item)

          try {
            // Obtener detalles del producto desde el catálogo
            const productData = await httpCatalogo<any>(`/api/products/${item.producto_id}`)

            // Determinar el precio correcto - el backend usa precio_oferta o precio_original
            const precioFinal = item.precio_unitario
              || productData.precio_oferta
              || productData.precio_original
              || productData.precio_base
              || productData.precio
              || productData.precioBase
              || productData.price
              || 0

            console.log('Product data:', {
              productId: item.producto_id,
              nombre: productData.nombre,
              itemPrice: item.precio_unitario,
              precioOferta: productData.precio_oferta,
              precioOriginal: productData.precio_original,
              productBasePrice: productData.precio_base,
              finalPrice: precioFinal
            })

            // Mapear a nuestro formato de Producto
            const producto: Producto = {
              id: productData.id,
              name: productData.nombre,
              description: productData.descripcion || '',
              price: precioFinal,
              image: productData.imagen_url || '',
              category: productData.categoria?.nombre || '',
              inStock: productData.activo,
              rating: 0,
              reviews: 0
            }

            console.log('Cart item cantidad:', item.cantidad)

            cartItems.push({
              producto,
              cantidad: item.cantidad || 1  // Asegurar que siempre haya una cantidad
            })
          } catch (err) {
            console.error(`Error loading product ${item.producto_id}:`, err)
          }
        }

        console.log('Final cart items:', cartItems)
        setCart(cartItems)
      }
    } catch (error) {
      console.error('Error loading cart:', error)
    }
  }

  const loadClienteDetalle = async (clienteId: string) => {
    try {
      const cliente = await httpCatalogo<ClienteDetalle>(`/api/clientes/${clienteId}`)
      console.log('=== CLIENTE DETALLE ===')
      console.log('Cliente completo:', cliente)
      console.log('Credit fields:', {
        creditLimit: cliente?.creditLimit,
        currentDebt: cliente?.currentDebt,
        limite_credito: (cliente as any)?.limite_credito,
        deuda_actual: (cliente as any)?.deuda_actual,
        credito_disponible: (cliente as any)?.credito_disponible
      })
      setClienteDetalle(cliente)

      // Auto-seleccionar condición de pago basado en crédito
      const limite = parseFloat(`${cliente?.creditLimit || (cliente as any)?.limite_credito || 0}`)
      const deuda = parseFloat(`${cliente?.currentDebt || (cliente as any)?.deuda_actual || (cliente as any)?.saldo_actual || 0}`)
      const creditoDisponible = Math.max(limite - deuda, 0)

      console.log('Crédito disponible calculado:', { limite, deuda, creditoDisponible })

      if (creditoDisponible <= 0) {
        console.log('Sin crédito disponible, seleccionando CONTADO automáticamente')
        setCondicionPagoManual('CONTADO')
      } else {
        // Si tiene crédito, por defecto CREDITO
        setCondicionPagoManual('CREDITO')
      }
    } catch (error) {
      console.error('Error loading client details:', error)
    }
  }

  const loadSucursales = async (clienteId: string) => {
    try {
      const sucursalesData = await fetchSucursalesByCliente(clienteId)
      console.log('Sucursales loaded:', sucursalesData)
      setSucursales(Array.isArray(sucursalesData) ? sucursalesData : [])
    } catch (error) {
      console.error('Error loading sucursales:', error)
      setSucursales([])
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
      await httpOrders(`/orders/cart/client/${clienteSeleccionado}`, {
        method: 'POST',
        body: {
          producto_id: productoId,
          cantidad: newQuantity
        }
      })

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

    console.log('=== REMOVING ITEM ===')
    console.log('Cliente ID:', clienteSeleccionado)
    console.log('Producto ID:', productoId)
    console.log('Endpoint:', `/orders/cart/client/${clienteSeleccionado}/item/${productoId}`)

    try {
      // Usar el patrón estándar del cart service
      const endpoint = `/orders/cart/client/${clienteSeleccionado}/item/${productoId}`
      const result = await httpOrders(endpoint, { method: 'DELETE' })

      console.log('DELETE successful:', result)

      // Actualizar estado local
      setCart(prev => prev.filter(item => item.producto.id !== productoId))
    } catch (error: any) {
      console.error('=== ERROR REMOVING ITEM ===')
      console.error('Error completo:', error)
      console.error('Error message:', error?.message)
      console.error('Error status:', error?.status)

      // Si el carrito no existe (404), simplemente eliminamos del estado local
      if (error?.message?.includes('no encontrado') || error?.message?.includes('404')) {
        console.log('⚠️ Cart not found in backend (404)')
        console.log('Esto significa que el carrito no existe en la base de datos')
        console.log('Verifica que el carrito se haya creado correctamente al agregar productos')
      }

      // Siempre eliminamos del estado local
      setCart(prev => prev.filter(item => item.producto.id !== productoId))
    }
  }

  const clearCart = async () => {
    if (!clienteSeleccionado) return

    try {
      // Usar el patrón estándar del cart service
      const endpoint = `/orders/cart/client/${clienteSeleccionado}`
      await httpOrders(endpoint, { method: 'DELETE' })

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

  const isUuid = useCallback((value: string | null | undefined) => {
    if (!value) return false
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  }, [])

  const selectedSucursal = useMemo(() => sucursales.find(s => s.id === selectedSucursalId) ?? null, [sucursales, selectedSucursalId])

  useEffect(() => {
    if (destinoTipo !== 'sucursal') {
      setInvalidSucursalMessage(null)
      return
    }
    if (!selectedSucursalId) {
      setInvalidSucursalMessage('Selecciona una sucursal disponible para enviar el pedido.')
      return
    }
    const stillExists = sucursales.some(s => s.id === selectedSucursalId)
    if (!stillExists) {
      setSelectedSucursalId(null)
      setInvalidSucursalMessage('La sucursal seleccionada ya no está disponible, elige otra opción.')
      return
    }
    setInvalidSucursalMessage(isUuid(selectedSucursalId) ? null : 'Esta sucursal no cuenta con un identificador compatible con el servicio de pedidos.')
  }, [selectedSucursalId, sucursales, isUuid, destinoTipo])

  useEffect(() => {
    if (destinoTipo === 'sucursal' && !selectedSucursalId && sucursales.length > 0) {
      setSelectedSucursalId(sucursales[0].id)
    }
    if (destinoTipo === 'sucursal' && sucursales.length === 0) {
      setDestinoTipo('cliente')
      setSelectedSucursalId(null)
    }
  }, [destinoTipo, selectedSucursalId, sucursales])

  const handleDestinoTipoChange = (tipo: 'cliente' | 'sucursal') => {
    if (tipo === 'sucursal' && sucursales.length === 0) return
    setDestinoTipo(tipo)
    if (tipo === 'cliente') {
      setSelectedSucursalId(null)
    } else if (!selectedSucursalId && sucursales.length > 0) {
      setSelectedSucursalId(sucursales[0].id)
    }
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

    if (superaCredito && condicionPagoManual === 'CREDITO') {
      setError('El total excede el crédito disponible del cliente. Seleccione pago al Contado.')
      return
    }

    const wantsSucursal = destinoTipo === 'sucursal'
    const sucursalIdForApi = wantsSucursal && selectedSucursalId && isUuid(selectedSucursalId) ? selectedSucursalId : undefined

    if (wantsSucursal && !selectedSucursalId) {
      setInvalidSucursalMessage('Selecciona una sucursal para poder enviar el pedido a esa ubicación.')
      return
    }
    if (wantsSucursal && selectedSucursalId && !sucursalIdForApi) {
      setInvalidSucursalMessage('La sucursal seleccionada no tiene un identificador válido.')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      // Llamar al endpoint del backend usando httpOrders
      const pedido = await httpOrders<any>(`/orders/from-cart/client/${clienteSeleccionado}`, {
        method: 'POST',
        body: {
          condicion_pago: condicionPagoManual,
          sucursal_id: sucursalIdForApi
        }
      })

      // Limpiar carrito local
      setCart([])
      localStorage.removeItem('vendedor_cart')
      localStorage.removeItem('vendedor_cliente_seleccionado')

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

  const total = cart.reduce((sum, item) => sum + (item.producto.price * item.cantidad), 0)
  const totalItems = cart.reduce((sum, item) => sum + item.cantidad, 0)

  const limiteCredito = parseFloat(`${clienteDetalle?.creditLimit || clienteDetalle?.limite_credito || 0}`)
  const deudaActual = parseFloat(`${clienteDetalle?.currentDebt || clienteDetalle?.deuda_actual || clienteDetalle?.saldo_actual || 0}`)
  const creditoDisponible = Math.max(limiteCredito - deudaActual, 0)

  const superaCredito = total > creditoDisponible
  const condicionComercial = superaCredito ? 'Contado' : 'Crédito'
  const condicionPagoApi = superaCredito ? 'CONTADO' : 'CREDITO'
  const destinoDescripcion = destinoTipo === 'cliente'
    ? 'Cliente principal'
    : selectedSucursal
      ? `${selectedSucursal.nombre_sucursal || selectedSucursal.nombre}${selectedSucursal.zona_nombre ? ` · ${selectedSucursal.zona_nombre}` : ''}`
      : 'Selecciona una sucursal'

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

      <div className="space-y-4">
        <SectionHeader
          title="Carrito de compras"
          rightSlot={
            cart.length > 0 ? (
              <button
                type="button"
                onClick={clearCart}
                className="text-sm font-semibold text-brand-red underline-offset-2 hover:underline"
              >
                Vaciar carrito
              </button>
            ) : null
          }
        />

        {cart.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-6 text-center text-sm text-neutral-600">
            El carrito está vacío.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3 items-start">
            <div className="lg:col-span-2 space-y-3 max-h-[60vh] overflow-auto pr-2">
              {cart.map(item => (
                <div key={item.producto.id} className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-neutral-900">{item.producto.name}</p>
                    <p className="text-xs text-neutral-500">Precio unitario: ${item.producto.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="Disminuir"
                      onClick={() => updateQuantity(item.producto.id, Math.max(item.cantidad - 1, 0))}
                      className="rounded-lg border border-neutral-200 bg-neutral-50 p-1 text-neutral-700 hover:bg-neutral-100"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{item.cantidad}</span>
                    <button
                      type="button"
                      aria-label="Aumentar"
                      onClick={() => updateQuantity(item.producto.id, item.cantidad + 1)}
                      className="rounded-lg border border-neutral-200 bg-neutral-50 p-1 text-neutral-700 hover:bg-neutral-100"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="w-24 text-right text-sm font-bold text-neutral-900">
                    ${(item.producto.price * item.cantidad).toFixed(2)}
                  </div>
                  <button
                    type="button"
                    aria-label="Eliminar"
                    onClick={() => removeItem(item.producto.id)}
                    className="rounded-lg bg-red-50 p-2 text-brand-red hover:bg-red-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs text-neutral-700">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-neutral-500" />
                  <span>Stock sujeto a disponibilidad. El pedido será validado.</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm lg:col-span-1 lg:sticky lg:top-24">
              <div className="flex items-center justify-between">
                <p className="text-sm text-neutral-700">Total de ítems</p>
                <p className="text-sm font-semibold text-neutral-900">{totalItems}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-neutral-700">Total</p>
                <p className="text-xl font-bold text-neutral-900">${total.toFixed(2)}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-neutral-700">Crédito disponible</p>
                <p className={`text-sm font-semibold ${superaCredito ? 'text-brand-red' : 'text-emerald-700'}`}>${creditoDisponible.toFixed(2)}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-neutral-700">Condición comercial</p>
                <p className="text-sm font-semibold text-neutral-900">{condicionComercial}</p>
              </div>
              {superaCredito ? (
                <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
                  El total excede el crédito disponible.
                </div>
              ) : (
                <div className="rounded-xl bg-green-50 px-3 py-2 text-sm text-green-800">
                  <CheckCircle2 className="mr-1 inline h-4 w-4" /> Cumple con crédito disponible.
                </div>
              )}

              {/* Sección de selección de condición de pago */}
              <div className="rounded-2xl border border-neutral-200 px-3 py-3">
                <p className="text-sm font-semibold text-neutral-900 mb-2">Condición de Pago</p>
                <div className="space-y-2">
                  <label className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm ${condicionPagoManual === 'CONTADO' ? 'border-brand-red/50 bg-brand-red/5' : 'border-neutral-200 hover:border-neutral-300'}`}>
                    <input
                      type="radio"
                      name="condicionPago"
                      value="CONTADO"
                      checked={condicionPagoManual === 'CONTADO'}
                      onChange={(e) => setCondicionPagoManual(e.target.value as 'CONTADO' | 'CREDITO')}
                    />
                    <span className="font-medium">Contado</span>
                  </label>
                  <label className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm ${condicionPagoManual === 'CREDITO' ? 'border-brand-red/50 bg-brand-red/5' : 'border-neutral-200 hover:border-neutral-300'} ${superaCredito ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <input
                      type="radio"
                      name="condicionPago"
                      value="CREDITO"
                      checked={condicionPagoManual === 'CREDITO'}
                      onChange={(e) => setCondicionPagoManual(e.target.value as 'CONTADO' | 'CREDITO')}
                      disabled={superaCredito}
                    />
                    <span className="font-medium">Crédito</span>
                  </label>
                </div>
              </div>
              {/* Sección de destino del pedido - siempre visible */}
              <div className="rounded-2xl border border-neutral-200 px-3 py-3">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-900">
                  <Building2 className="h-4 w-4 text-brand-red" /> Destino del pedido
                </div>
                <p className="text-xs text-neutral-500">
                  {sucursales.length > 0
                    ? 'Si el cliente tiene sucursales, puedes enviar este pedido directamente a una de ellas.'
                    : 'El pedido se enviará a la dirección principal del cliente.'}
                </p>
                <div className="mt-3 space-y-2">
                  <label className={`flex cursor-pointer items-start gap-2 rounded-xl border px-3 py-2 text-sm ${destinoTipo === 'cliente' ? 'border-brand-red/50 bg-brand-red/5' : 'border-neutral-200 hover:border-neutral-300'}`}>
                    <input
                      type="radio"
                      name="destinoPedido"
                      checked={destinoTipo === 'cliente'}
                      onChange={() => handleDestinoTipoChange('cliente')}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-semibold text-neutral-900">Cliente principal</p>
                      <p className="text-xs text-neutral-500">
                        {clienteDetalle?.direccion_texto || clienteDetalle?.direccion
                          ? `${clienteDetalle.direccion_texto || clienteDetalle.direccion}${clienteDetalle.ciudad ? ` · ${clienteDetalle.ciudad}` : ''}${clienteDetalle.estado ? ` · ${clienteDetalle.estado}` : ''}`
                          : 'Usaremos la dirección registrada del cliente.'}
                      </p>
                    </div>
                  </label>
                  {sucursales.length > 0 && (
                    <label className={`flex cursor-pointer items-start gap-2 rounded-xl border px-3 py-2 text-sm ${destinoTipo === 'sucursal' ? 'border-brand-red/50 bg-brand-red/5' : 'border-neutral-200 hover:border-neutral-300'}`}>
                      <input
                        type="radio"
                        name="destinoPedido"
                        checked={destinoTipo === 'sucursal'}
                        onChange={() => handleDestinoTipoChange('sucursal')}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-semibold text-neutral-900">Sucursal</p>
                        <p className="text-xs text-neutral-500">
                          Selecciona una de las sucursales registradas.
                        </p>
                      </div>
                    </label>
                  )}
                </div>
                {destinoTipo === 'sucursal' && sucursales.length > 0 && (
                  <div className="mt-3 space-y-2 rounded-xl border border-dashed border-brand-red/40 bg-brand-red/5 px-3 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-red">Selecciona la sucursal</p>
                    <div className="space-y-2">
                      {sucursales.map(sucursal => (
                        <label
                          key={sucursal.id}
                          className={`flex cursor-pointer items-start gap-2 rounded-xl border bg-white px-3 py-2 text-sm ${selectedSucursalId === sucursal.id ? 'border-brand-red/60 shadow-sm' : 'border-brand-red/10 hover:border-brand-red/40'}`}
                        >
                          <input
                            type="radio"
                            name="destinoSucursal"
                            checked={selectedSucursalId === sucursal.id}
                            onChange={() => setSelectedSucursalId(sucursal.id)}
                            className="mt-1"
                          />
                          <div>
                            <p className="font-semibold text-neutral-900">{sucursal.nombre_sucursal || sucursal.nombre}</p>
                            <p className="text-xs text-neutral-500">
                              {[sucursal.direccion_entrega || sucursal.direccion, sucursal.zona_nombre, sucursal.contacto_telefono].filter(Boolean).join(' · ') || 'Sin dirección registrada'}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-3 rounded-xl bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
                  Destino actual: {destinoDescripcion}
                </div>
                {invalidSucursalMessage ? (
                  <div className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    {invalidSucursalMessage}
                  </div>
                ) : null}
              </div>
              <div className="grid gap-2">
                <button
                  type="button"
                  onClick={goBackToProducts}
                  className="rounded-xl border border-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
                >
                  ← Agregar más productos
                </button>
                <button
                  type="button"
                  disabled={cart.length === 0 || (superaCredito && condicionPagoManual === 'CREDITO') || isSubmitting}
                  onClick={handleSubmitOrder}
                  className="rounded-xl bg-brand-red px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Creando pedido...
                    </>
                  ) : (
                    'Confirmar pedido'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

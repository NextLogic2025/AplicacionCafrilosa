
import { useEffect, useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getClientesAsignados } from '../../../services/vendedorApi'
import type { Cliente } from '../../../../supervisor/services/clientesApi'
import { httpOrders, httpCatalogo } from '../../../../../services/api/http'
import { fetchSucursalesByCliente } from '../../../../cliente/pages/sucursal/sucursalesApi'
import type { CartItem, ClienteDetalle, SucursalCliente, Producto } from '../types'

export const useCrearPedido = () => {
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

    // Cargar clientes y carrito desde backend
    useEffect(() => {
        setIsLoadingClientes(true)
        getClientesAsignados()
            .then((data: Cliente[]) => setClientes(data))
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

    const total = cart.reduce((sum, item) => sum + (item.producto.price * item.cantidad), 0)

    const limiteCredito = parseFloat(`${clienteDetalle?.creditLimit || clienteDetalle?.limite_credito || 0}`)
    const deudaActual = parseFloat(`${clienteDetalle?.currentDebt || clienteDetalle?.deuda_actual || clienteDetalle?.saldo_actual || 0}`)
    const creditoDisponible = Math.max(limiteCredito - deudaActual, 0)
    const superaCredito = total > creditoDisponible

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

    const totalItems = cart.reduce((sum, item) => sum + item.cantidad, 0)
    const condicionComercial = superaCredito ? 'Contado' : 'Crédito'

    return {
        clientes,
        clienteSeleccionado,
        setClienteSeleccionado,
        clienteDetalle,
        sucursales,
        cart,
        isLoadingClientes,
        isSubmitting,
        error,
        setError,
        destinoTipo,
        selectedSucursalId,
        setSelectedSucursalId,
        invalidSucursalMessage,
        condicionPagoManual,
        setCondicionPagoManual,
        updateQuantity,
        removeItem,
        clearCart,
        goBackToProducts,
        handleDestinoTipoChange,
        handleSubmitOrder,
        total,
        totalItems,
        creditoDisponible,
        superaCredito,
        condicionComercial,
        selectedSucursal
    }
}

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Alert } from 'react-native'
import { CartService, CartItem as CartItemDto, AddToCartPayload } from '../services/api/CartService'
import { UserService } from '../services/api/UserService'
import { CatalogService } from '../services/api/CatalogService'
import { Client, ClientBranch } from '../services/api/ClientService'

// Define types locally or import
export interface CartItem {
    id: string
    producto_id: string
    nombre_producto: string
    cantidad: number
    unidad_medida: string
    precio_lista: number
    precio_final: number
    subtotal: number
    imagen_url?: string
    codigo_sku?: string
    // Promotion details
    motivo_descuento?: string
    campania_aplicada_id?: number
    tiene_promocion?: boolean
    descuento_porcentaje?: number
}

interface Cart {
    items: CartItem[]
    total_estimado: number
    subtotal?: number
    descuento_total?: number
    impuestos_total?: number
    total_final?: number
    cliente_id?: string
    cliente_nombre?: string
    sucursal_id?: string
    sucursal_nombre?: string
}

interface CartContextValue {
    userId: string | null
    cart: Cart
    currentClient: Client | null
    // Legacy support aliases
    items: CartItem[]
    totalItems: number

    addToCart: (product: {
        id?: string
        producto_id?: string
        codigo_sku: string
        nombre?: string
        nombre_producto?: string
        imagen_url?: string
        unidad_medida: string
        precio_lista: number
        precio_final: number
        lista_precios_id: number
        tiene_promocion: boolean
        descuento_porcentaje?: number
        campania_aplicada_id?: number
        motivo_descuento?: string
        subtotal?: number
    }, quantity?: number) => void
    removeFromCart: (productId: string) => void
    removeItem: (productId: string) => void // Alias for removeFromCart

    updateQuantity: (productId: string, quantity: number) => void
    clearCart: () => void
    setClient: (client: Client | null, branch?: ClientBranch | null) => void
    currentBranch: ClientBranch | null
    getItemCount: () => number
    validatePriceList: (clientListId: number) => boolean
    recalculatePrices: (newListId: number, productos: any[]) => void
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [userId, setUserId] = useState<string | null>(null)
    const [userRole, setUserRole] = useState<string | null>(null)
    const [cart, setCart] = useState<Cart>({
        items: [],
        total_estimado: 0,
        subtotal: 0,
        descuento_total: 0,
        impuestos_total: 0,
        total_final: 0
    })
    const [currentClient, setCurrentClient] = useState<Client | null>(null)
    const [currentBranch, setCurrentBranch] = useState<ClientBranch | null>(null)
    const [loading, setLoading] = useState(false)

    // Load User ID and Role on Mount
    useEffect(() => {
        const initCart = async () => {
            try {
                const user = await UserService.getProfile()
                if (user?.id) {
                    setUserId(prev => prev || user.id) // Only set if not already set (e.g. by setClient)
                    setUserRole(user.role)
                }
            } catch (error) {
                console.warn('Error loading user profile for cart', error)
            }
        }
        initCart()
    }, [])

    // Load Cart from Server when userId changes
    useEffect(() => {
        if (!userId) {
            setCart({ items: [], total_estimado: 0 })
            return
        }
        loadCart(userId)
    }, [userId])

    const loadCart = async (uid: string) => {
        setLoading(true)
        try {
            // CRITICAL: Only vendors can use 'client' endpoint
            // If user is a client (not vendor), always use 'me' endpoint
            const isVendor = userRole === 'Vendedor' || userRole === 'vendedor'
            const target = (currentClient && isVendor)
                ? { type: 'client' as const, clientId: currentClient.id }
                : { type: 'me' as const }

            const serverCart = await CartService.getCart(target)
            const mappedCart = await mapServerCartToState(serverCart)
            setCart(mappedCart)
        } catch (error) {
            console.warn('Error loading cart from server', error)
            // Establecer carrito vacío con estructura válida
            setCart({
                items: [],
                total_estimado: 0,
                subtotal: 0,
                descuento_total: 0,
                impuestos_total: 0,
                total_final: 0,
                cliente_id: currentClient?.id,
                cliente_nombre: currentClient?.nombre_comercial || currentClient?.razon_social,
                sucursal_id: currentBranch?.id,
                sucursal_nombre: currentBranch?.nombre_sucursal
            })
        } finally {
            setLoading(false)
        }
    }

    const mapServerCartToState = async (serverCart: any): Promise<Cart> => {
        if (!serverCart || !serverCart.items) return { items: [], total_estimado: 0 }

        const items: CartItem[] = []

        // STRATEGY: Enrich cart items with product details
        // CLIENTES: Use getClientProducts (filtered by client's price list)
        // VENDEDORES: Use getProductsPaginated (general catalog)
        let productsMap = new Map<string, any>()
        try {
            if (userRole?.toLowerCase() === 'cliente') {
                // Client-specific endpoint with their price list
                const productsResponse = await CatalogService.getClientProducts(1, 1000)
                productsResponse.items.forEach(p => productsMap.set(p.id, p))
            } else {
                // General catalog for vendedores/otros roles
                const productsResponse = await CatalogService.getProductsPaginated(1, 1000)
                productsResponse.items.forEach(p => productsMap.set(p.id, p))
            }
        } catch (err) {
            console.warn('Could not fetch products for cart enrichment', err)
        }

        for (const item of serverCart.items) {
            try {
                // Get product details from the map
                const productDetails = productsMap.get(item.producto_id)

                // --- SNAPSHOT STRATEGY ---
                // Usar precios del snapshot del carrito (backend ya incluye toda la info necesaria)
                const precioLista = Number(item.precio_original_snapshot || 0)

                const precioFinal = Number(item.precio_unitario_ref || 0)

                // Calculate Promotion Status
                const tienePromocion = precioLista > precioFinal || !!item.campania_aplicada_id
                let descuentoPorcentaje = 0
                if (tienePromocion && precioLista > 0) {
                    descuentoPorcentaje = Math.round(((precioLista - precioFinal) / precioLista) * 100)
                }

                const cantidad = Number(item.cantidad || 0)
                const subtotal = cantidad * precioFinal

                items.push({
                    id: item.id,
                    producto_id: item.producto_id,
                    nombre_producto: productDetails?.nombre || item.nombre_producto || 'Producto',
                    codigo_sku: productDetails?.codigo_sku || item.codigo_sku || 'N/A',
                    imagen_url: productDetails?.imagen_url || item.imagen_url,
                    cantidad,
                    unidad_medida: productDetails?.unidad_medida || item.unidad_medida || 'UN',
                    precio_lista: precioLista,
                    precio_final: precioFinal,
                    subtotal,
                    campania_aplicada_id: item.campania_aplicada_id,
                    motivo_descuento: item.motivo_descuento,
                    tiene_promocion: tienePromocion,
                    descuento_porcentaje: descuentoPorcentaje
                })
            } catch (err) {
                console.error(`Error processing cart item ${item.producto_id}`, err)
                // Agregar item con valores mínimos para evitar perder datos
                items.push({
                    id: item.id,
                    producto_id: item.producto_id,
                    nombre_producto: 'Producto',
                    codigo_sku: 'N/A',
                    imagen_url: undefined,
                    cantidad: Number(item.cantidad || 0),
                    unidad_medida: 'UN',
                    precio_lista: 0,
                    precio_final: 0,
                    subtotal: 0,
                    campania_aplicada_id: item.campania_aplicada_id,
                    motivo_descuento: item.motivo_descuento,
                    tiene_promocion: false,
                    descuento_porcentaje: 0
                })
            }
        }

        const subtotal = items.reduce((acc, curr) => acc + (curr.subtotal || 0), 0)
        // Calculate Discount Total: Sum of (List Price - Final Price) * Quantity
        const descuento_total = items.reduce((acc, curr) => {
            const discountPerUnit = Math.max(0, curr.precio_lista - curr.precio_final)
            return acc + (discountPerUnit * curr.cantidad)
        }, 0)

        const impuestos_total = (subtotal) * 0.12 // Example TAX
        const total_final = subtotal + impuestos_total

        return {
            items,
            total_estimado: total_final,
            subtotal,
            descuento_total,
            impuestos_total,
            total_final,
            cliente_id: serverCart.cliente_id,
            cliente_nombre: currentClient?.nombre_comercial || currentClient?.razon_social,
            sucursal_id: currentBranch?.id,
            sucursal_nombre: currentBranch?.nombre_sucursal
        }
    }

    const setClient = (client: Client | null, branch?: ClientBranch | null) => {
        setCurrentClient(client)
        setCurrentBranch(branch || null)

        // Actualizar info del cliente en el carrito
        if (client) {
            setCart(prev => ({
                ...prev,
                cliente_id: client.id,
                cliente_nombre: client.nombre_comercial || client.razon_social,
                sucursal_id: branch?.id,
                sucursal_nombre: branch?.nombre_sucursal
            }))

            // IMPORTANTE: Cambiar el contexto del userId al usuario_principal_id del cliente
            // Esto permite que el vendedor opere el carrito del cliente
            if (client.usuario_principal_id) {
                setUserId(client.usuario_principal_id)
            }
        } else {
            // Limpiar info del cliente
            setCart(prev => ({
                ...prev,
                cliente_id: undefined,
                cliente_nombre: undefined,
                sucursal_id: undefined,
                sucursal_nombre: undefined
            }))

            // Restaurar el userId al usuario logueado (vendedor)
            UserService.getProfile().then(p => {
                if (p?.id) setUserId(p.id)
            }).catch(() => { })
        }
    }

    const addToCart = async (product: any, quantity: number = 1) => {
        let currentUserId = userId

        // Lazy load user if not present (fixes "Debes iniciar sesión" bug when context is stale)
        if (!currentUserId) {
            try {
                console.log('CartContext: userId missing in addToCart, attempting to fetch profile...')
                const user = await UserService.getProfile()
                if (user?.id) {
                    console.log('CartContext: Profile recovered', user.id)
                    currentUserId = user.id
                    setUserId(user.id)
                }
            } catch (error) {
                console.warn('CartContext: Failed to recover user profile', error)
            }
        }

        if (!currentUserId) {
            Alert.alert('Error', 'Debes iniciar sesión para comprar')
            return
        }

        try {
            // Server Call First
            const payload: AddToCartPayload = {
                producto_id: product.id || product.producto_id,
                cantidad: quantity,
                campania_aplicada_id: product.campania_aplicada_id,
                motivo_descuento: product.motivo_descuento
            }

            // CRITICAL: Only vendors can use 'client' endpoint
            const isVendor = userRole === 'Vendedor' || userRole === 'vendedor'
            const target = (currentClient && isVendor)
                ? { type: 'client' as const, clientId: currentClient.id }
                : { type: 'me' as const }

            await CartService.addToCart(target, payload)

            // Recargar carrito desde servidor para sincronizar precios calculados
            await loadCart(currentUserId)

        } catch (error) {
            console.error('Error adding to cart', error)
            Alert.alert('Error', 'No se pudo agregar al carrito')
            await loadCart(currentUserId)
        }
    }

    const existingItem = (prodId: string) => cart.items.some(i => i.producto_id === prodId)

    const removeFromCart = async (productId: string) => {
        if (!userId) return

        // Optimistic UI update
        setCart(prev => ({
            ...prev,
            items: prev.items.filter(i => i.producto_id !== productId)
        }))

        try {
            // CRITICAL: Only vendors can use 'client' endpoint
            // When vendor is working with client cart, userId is already set to the client's usuario_principal_id
            const isVendor = userRole === 'Vendedor' || userRole === 'vendedor'
            const target = (currentClient && isVendor)
                ? { type: 'client' as const, clientId: userId }  // Use userId (usuario_principal_id)
                : { type: 'me' as const }

            await CartService.removeFromCart(target, productId)
            loadCart(userId)
        } catch (error) {
            console.error('Error removing item', error)
            loadCart(userId)
        }
    }

    const updateQuantity = async (productId: string, quantity: number) => {
        if (!userId || quantity <= 0) return

        // Optimistic
        setCart(prev => ({
            ...prev,
            items: prev.items.map(i => i.producto_id === productId
                ? { ...i, cantidad: quantity, subtotal: quantity * i.precio_final }
                : i)
        }))

        try {
            const payload: AddToCartPayload = {
                producto_id: productId,
                cantidad: quantity
            }
            // CRITICAL: Only vendors can use 'client' endpoint
            const isVendor = userRole === 'Vendedor' || userRole === 'vendedor'
            const target = (currentClient && isVendor)
                ? { type: 'client' as const, clientId: currentClient.id }
                : { type: 'me' as const }

            await CartService.addToCart(target, payload)
            loadCart(userId)
        } catch (error) {
            console.error('Error updating quantity', error)
            loadCart(userId)
        }
    }

    const clearCart = async () => {
        if (!userId) return
        setCart({ items: [], total_estimado: 0 })
        try {
            // CRITICAL: Only vendors can use 'client' endpoint
            const isVendor = userRole === 'Vendedor' || userRole === 'vendedor'
            const target = (currentClient && isVendor)
                ? { type: 'client' as const, clientId: currentClient.id }
                : { type: 'me' as const }
            await CartService.clearCart(target)
        } catch (e) { console.warn(e) }
    }

    const getItemCount = () => cart.items.reduce((acc, item) => acc + item.cantidad, 0)

    const validatePriceList = (listId: number) => true
    const recalculatePrices = () => { } // Placeholder

    const value: CartContextValue = {
        userId,
        cart,
        currentClient,
        currentBranch,
        items: cart.items,
        totalItems: getItemCount(),
        addToCart,
        removeFromCart,
        removeItem: removeFromCart,
        updateQuantity,
        clearCart,
        setClient,
        getItemCount,
        validatePriceList,
        recalculatePrices
    }

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    )
}

export const useCart = () => {
    const context = useContext(CartContext)
    if (!context) throw new Error('useCart must be used within a CartProvider')
    return context
}

export const useCartOptional = () => {
    return useContext(CartContext) || {
        cart: { items: [], total_estimado: 0 },
        getItemCount: () => 0,
        items: [],
        totalItems: 0
    }
}
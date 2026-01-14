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
    getItemCount: () => number
    validatePriceList: (clientListId: number) => boolean
    recalculatePrices: (newListId: number, productos: any[]) => void
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [userId, setUserId] = useState<string | null>(null)
    const [cart, setCart] = useState<Cart>({ items: [], total_estimado: 0 })
    const [currentClient, setCurrentClient] = useState<Client | null>(null)
    const [loading, setLoading] = useState(false)

    // Load User ID on Mount
    useEffect(() => {
        const initCart = async () => {
            try {
                const user = await UserService.getProfile()
                if (user?.id) {
                    setUserId(prev => prev || user.id) // Only set if not already set (e.g. by setClient)
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
            const target = currentClient
                ? { type: 'client' as const, clientId: currentClient.id }
                : { type: 'me' as const }

            // Note: uid param is kept for compatibility but service uses target
            const serverCart = await CartService.getCart(target)
            const mappedCart = await mapServerCartToState(serverCart)
            setCart(mappedCart)
        } catch (error) {
            console.warn('Error loading cart from server', error)
        } finally {
            setLoading(false)
        }
    }

    const mapServerCartToState = async (serverCart: any): Promise<Cart> => {
        if (!serverCart || !serverCart.items) return { items: [], total_estimado: 0 }

        const items: CartItem[] = []
        for (const item of serverCart.items) {
            try {
                // Enrich with Catalog Data for display
                const productDetails = await CatalogService.getProductById(item.producto_id)

                // --- SNAPSHOT STRATEGY ---
                // We trust the prices stored in the cart item (snapshots).
                // If they are 0 (legacy data), we fallback to productDetails (current catalog price).

                // Logic:
                // 1. item.precio_original_snapshot -> Original Price (List Price)
                // 2. item.precio_unitario_ref -> Final Price (Unit Price)

                const precioLista = Number(item.precio_original_snapshot) > 0
                    ? Number(item.precio_original_snapshot)
                    : (productDetails?.precio_original ?? 0);

                const precioFinal = Number(item.precio_unitario_ref) > 0
                    ? Number(item.precio_unitario_ref)
                    : (productDetails?.precio_oferta ?? productDetails?.precio_original ?? 0);

                // Calculate Promotion Status
                const tienePromocion = precioLista > precioFinal || !!item.campania_aplicada_id;
                let descuentoPorcentaje = 0;
                if (tienePromocion && precioLista > 0) {
                    descuentoPorcentaje = Math.round(((precioLista - precioFinal) / precioLista) * 100);
                }

                items.push({
                    id: item.id,
                    producto_id: item.producto_id,
                    nombre_producto: productDetails?.nombre || 'Producto Desconocido',
                    codigo_sku: productDetails?.codigo_sku || '',
                    imagen_url: productDetails?.imagen_url || '',
                    cantidad: Number(item.cantidad),
                    unidad_medida: 'UN', // Default
                    precio_lista: precioLista,
                    precio_final: precioFinal,
                    subtotal: Number(item.cantidad) * precioFinal,
                    campania_aplicada_id: item.campania_aplicada_id,
                    motivo_descuento: item.motivo_descuento, // Mapped from backend
                    tiene_promocion: tienePromocion,
                    descuento_porcentaje: descuentoPorcentaje
                })
            } catch (err) {
                console.warn(`Error enriching cart item ${item.producto_id}`, err)
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
            cliente_id: serverCart.cliente_id
        }
    }

    const setClient = (client: Client | null, branch?: ClientBranch | null) => {
        setCurrentClient(client)
        // Switch Context to Client's User if available
        if (client?.usuario_principal_id) {
            setUserId(client.usuario_principal_id)
        } else if (client === null) {
            // Reset to logged in user
            UserService.getProfile().then(p => { if (p?.id) setUserId(p.id) })
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
            // The optimistic update is tricky because we need the snapshot prices from backend response
            // to show correct promotion tag instantly if we rely on backend calc.

            const payload: AddToCartPayload = {
                producto_id: product.id || product.producto_id,
                cantidad: quantity,
                // Do NOT send prices. Backend calculates them.
                campania_aplicada_id: product.campania_aplicada_id,
                motivo_descuento: product.motivo_descuento
            }

            // --- FIX: Use addToCart instead of addItem ---
            const target = currentClient
                ? { type: 'client' as const, clientId: currentClient.id }
                : { type: 'me' as const }

            if (existingItem(product.id || product.producto_id)) {
                await CartService.addToCart(target, payload)
            } else {
                await CartService.addToCart(target, payload)
            }
            // ---------------------------------------------

            // Reload to sync - this will fetch the cart with the calculated prices and promotions
            loadCart(currentUserId)

        } catch (error) {
            console.error('Error adding to cart', error)
            Alert.alert('Error', 'No se pudo agregar al carrito')
            loadCart(currentUserId)
        }
    }

    const existingItem = (prodId: string) => cart.items.some(i => i.producto_id === prodId)

    const removeFromCart = async (productId: string) => {
        if (!userId) return

        // Optimistic
        setCart(prev => ({
            ...prev,
            items: prev.items.filter(i => i.producto_id !== productId)
        }))

        try {
            const target = currentClient
                ? { type: 'client' as const, clientId: currentClient.id }
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
            // FIX: Use addToCart for update/upsert
            const target = currentClient
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
            const target = currentClient
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
        currentClient, // Expose this
        items: cart.items, // Alias
        totalItems: getItemCount(), // Alias
        addToCart,
        removeFromCart,
        removeItem: removeFromCart, // Alias
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

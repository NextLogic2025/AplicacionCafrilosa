import React, { createContext, useContext, useState, useCallback } from 'react'
import { Alert } from 'react-native'
import type { CartItem, Cart } from '../services/api/CartService'
import type { Client } from '../services/api/ClientService'
import { UserService } from '../services/api/UserService'
import { OrderService } from '../services/api/OrderService'

/**
 * Interfaz del contexto del carrito
 */
interface CartContextValue {
    cart: Cart
    addToCart: (product: {
        id: string
        codigo_sku: string
        nombre: string
        imagen_url?: string
        unidad_medida: string
        precio_lista: number
        precio_final: number
        lista_precios_id: number
        tiene_promocion: boolean
        descuento_porcentaje?: number
    }, quantity: number) => void
    removeFromCart: (productId: string) => void
    updateQuantity: (productId: string, quantity: number) => void
    clearCart: () => void
    setClient: (client: Client | null) => void
    getItemCount: () => number
    validatePriceList: (clientListId: number) => boolean
    recalculatePrices: (newListId: number, productos: any[]) => void
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

/**
 * CartProvider - Proveedor del contexto del carrito
 *
 * Maneja el estado global del carrito para el vendedor:
 * - Items agregados
 * - Cliente seleccionado
 * - Validación de lista de precios
 * - Cálculo de totales
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
    const [cart, setCart] = useState<Cart>({
        items: [],
        subtotal: 0,
        descuento_total: 0,
        impuestos_total: 0,
        total_final: 0
    })
    const [userId, setUserId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    // Cargar usuario y carrito al iniciar
    React.useEffect(() => {
        const initCart = async () => {
            try {
                const user = await UserService.getProfile()
                if (user?.id) {
                    setUserId(user.id)
                    await loadCart(user.id)
                }
            } catch (error) {
                console.log('Error initializing cart:', error)
            }
        }
        initCart()
    }, [])

    const loadCart = async (uid: string) => {
        setIsLoading(true)
        try {
            const serverCart = await OrderService.getCart(uid)
            mapServerCartToState(serverCart)
        } catch (error) {
            console.error('Error loading cart:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const mapServerCartToState = (serverCart: any) => {
        // Mapear respuesta del backend al estado local
        // Nota: El backend simplificado podría no devolver todos los cálculos, por lo que recalcula localmente si es necesario
        // Pero idealmente usamos lo que viene. Si falta data, preservamos estructura.

        const mappedItems: CartItem[] = serverCart.items.map((item: any) => ({
            id: item.id,
            producto_id: item.producto_id,
            codigo_sku: item.producto?.codigo_principal || 'SKU',
            nombre_producto: item.producto?.nombre || 'Producto',
            imagen_url: item.producto?.imagen_url,
            cantidad: Number(item.cantidad),
            unidad_medida: 'UN', // Default
            precio_lista: Number(item.precio_unitario_ref),
            precio_final: Number(item.precio_unitario_ref), // Asumir mismo si no hay promo
            lista_precios_id: 1, // Default
            tiene_promocion: false,
            subtotal: Number(item.cantidad) * Number(item.precio_unitario_ref)
        }))

        // Recalcular totales basados en items mapped (o usar del server si vienen)
        const subtotal = mappedItems.reduce((acc, item) => acc + item.subtotal, 0)
        const impuestos = subtotal * 0.12
        const total = subtotal + impuestos

        setCart({
            items: mappedItems,
            cliente_id: serverCart.cliente_id,
            subtotal: subtotal,
            descuento_total: 0,
            impuestos_total: impuestos,
            total_final: total // serverCart.total_estimado si confiamos en el backend
        })
    }

    /**
     * Calcular totales del carrito (Helper local)
     */
    const calculateTotals = useCallback((items: CartItem[]): Cart => {
        const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
        const descuento_total = items.reduce((sum, item) => {
            const descuento_item = (item.precio_lista - item.precio_final) * item.cantidad
            return sum + descuento_item
        }, 0)
        const impuestos_total = subtotal * 0.12
        const total_final = subtotal + impuestos_total

        return {
            ...cart,
            items,
            subtotal,
            descuento_total,
            impuestos_total,
            total_final
        }
    }, [cart])

    /**
     * Agregar producto al carrito
     */
    const addToCart = useCallback(async (product: {
        id: string
        codigo_sku: string
        nombre: string
        imagen_url?: string
        unidad_medida: string
        precio_lista: number
        precio_final: number
        lista_precios_id: number
        tiene_promocion: boolean
        descuento_porcentaje?: number
    }, quantity: number) => {
        let newQuantity = quantity
        const existingItemIndex = cart.items.findIndex(item => item.producto_id === product.id)

        // Calcular nueva cantidad total
        if (existingItemIndex >= 0) {
            newQuantity = cart.items[existingItemIndex].cantidad + quantity
        }

        // 1. Actualización Optimista local
        setCart(prevCart => {
            const existingIndex = prevCart.items.findIndex(item => item.producto_id === product.id)
            let newItems: CartItem[]
            if (existingIndex >= 0) {
                newItems = [...prevCart.items]
                const item = newItems[existingIndex]
                newItems[existingIndex] = {
                    ...item,
                    cantidad: newQuantity,
                    subtotal: newQuantity * product.precio_final
                }
            } else {
                newItems = [...prevCart.items, {
                    id: `temp-${Date.now()}`,
                    producto_id: product.id,
                    codigo_sku: product.codigo_sku,
                    nombre_producto: product.nombre,
                    imagen_url: product.imagen_url,
                    cantidad: newQuantity,
                    unidad_medida: product.unidad_medida,
                    precio_lista: product.precio_lista,
                    precio_final: product.precio_final,
                    lista_precios_id: product.lista_precios_id,
                    tiene_promocion: product.tiene_promocion,
                    descuento_porcentaje: product.descuento_porcentaje,
                    subtotal: newQuantity * product.precio_final
                }]
            }
            return calculateTotals(newItems)
        })

        // 2. Persistencia en Backend
        try {
            const currentUser = userId || (await UserService.getProfile())?.id
            if (currentUser) {
                if (!userId) setUserId(currentUser)
                await OrderService.addToCart(currentUser, { producto_id: product.id, cantidad: newQuantity })
            }
        } catch (error) {
            console.error('Error persisting cart add:', error)
            Alert.alert('Error', 'No se pudo guardar el producto en el carrito remoto.')
            // Revertir optimismo (simplificado: recargar carrito)
            if (userId) loadCart(userId)
        }
    }, [calculateTotals, userId, cart.items, loadCart])

    /**
     * Eliminar producto del carrito
     */
    const removeFromCart = useCallback(async (productId: string) => {
        // Optimistic
        setCart(prevCart => {
            const newItems = prevCart.items.filter(item => item.producto_id !== productId)
            return calculateTotals(newItems)
        })

        try {
            const currentUser = userId || (await UserService.getProfile())?.id
            if (currentUser) {
                await OrderService.removeFromCart(currentUser, productId)
            }
        } catch (error) {
            console.error('Error removing item from remote cart:', error)
            if (userId) loadCart(userId)
        }
    }, [calculateTotals, userId, loadCart])

    /**
     * Actualizar cantidad de un producto
     */
    const updateQuantity = useCallback(async (productId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(productId)
            return
        }

        // Optimistic
        setCart(prevCart => {
            const newItems = prevCart.items.map(item =>
                item.producto_id === productId
                    ? { ...item, cantidad: quantity, subtotal: quantity * item.precio_final }
                    : item
            )
            return calculateTotals(newItems)
        })

        // Persistence
        try {
            const currentUser = userId || (await UserService.getProfile())?.id
            if (currentUser) {
                await OrderService.addToCart(currentUser, { producto_id: productId, cantidad: quantity })
            }
        } catch (error) {
            console.error('Error updating quantity:', error)
            if (userId) loadCart(userId)
        }
    }, [calculateTotals, removeFromCart, userId, loadCart])

    /**
     * Limpiar carrito
     */
    const clearCart = useCallback(async () => {
        setCart({
            items: [],
            subtotal: 0,
            descuento_total: 0,
            impuestos_total: 0,
            total_final: 0
        })
        // Backend clear logic not strictly defined in OrderService tools yet, but assuming individual removes or checkout clears it.
    }, [])

    /**
     * Asignar cliente al carrito
     */
    const setClient = useCallback((client: Client | null) => {
        setCart(prevCart => ({
            ...prevCart,
            cliente_id: client?.id,
            cliente_nombre: client?.nombre_comercial || client?.razon_social,
            lista_precios_cliente: client?.lista_precios_id || undefined
        }))
    }, [])

    const getItemCount = useCallback(() => {
        return cart.items.reduce((sum, item) => sum + item.cantidad, 0)
    }, [cart.items])

    const validatePriceList = useCallback((clientListId: number): boolean => {
        if (cart.items.length === 0) return true
        return cart.items.every(item => item.lista_precios_id === clientListId)
    }, [cart.items])

    const recalculatePrices = useCallback((newListId: number, productos: any[]) => {
        // Keep existing logic
        setCart(prevCart => {
            const newItems: CartItem[] = []
            for (const item of prevCart.items) {
                const producto = productos.find(p => p.id === item.producto_id)
                if (!producto) continue
                const nuevoPrecio = producto.precios?.find((p: any) => p.lista_id === newListId)
                if (!nuevoPrecio) continue

                const promocion = producto.precio_oferta && producto.precio_oferta < nuevoPrecio.precio
                    ? producto.precio_oferta : null
                const precioFinal = promocion || nuevoPrecio.precio

                newItems.push({
                    ...item,
                    precio_lista: nuevoPrecio.precio,
                    precio_final: precioFinal,
                    lista_precios_id: newListId,
                    tiene_promocion: !!promocion,
                    descuento_porcentaje: promocion
                        ? Math.round(((nuevoPrecio.precio - promocion) / nuevoPrecio.precio) * 100)
                        : undefined,
                    subtotal: item.cantidad * precioFinal
                })
            }
            return calculateTotals(newItems)
        })
    }, [calculateTotals])

    const value: CartContextValue = {
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        setClient,
        getItemCount,
        validatePriceList,
        recalculatePrices
    }

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

/**
 * Hook para usar el contexto del carrito
 */
export function useCart() {
    const context = useContext(CartContext)
    if (context === undefined) {
        throw new Error('useCart debe ser usado dentro de un CartProvider')
    }

    // Aliases para compatibilidad con diferentes componentes
    return {
        ...context,
        items: context.cart.items,
        removeItem: context.removeFromCart,
        totalPrice: context.cart.total_final,
        totalItems: context.getItemCount()
    }
}

/**
 * Hook opcional para usar el carrito
 * Retorna null si no está dentro de un CartProvider (no lanza error)
 * Útil para componentes compartidos que pueden o no tener acceso al carrito
 */
export function useCartOptional() {
    const context = useContext(CartContext)

    if (context === undefined) {
        return null
    }

    // Aliases para compatibilidad con diferentes componentes
    return {
        ...context,
        items: context.cart.items,
        removeItem: context.removeFromCart,
        totalPrice: context.cart.total_final,
        totalItems: context.getItemCount()
    }
}

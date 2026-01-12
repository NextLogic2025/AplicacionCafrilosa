import React, { createContext, useContext, useState, useCallback } from 'react'
import { Alert } from 'react-native'
import type { CartItem, Cart } from '../services/api/CartService'
import type { Client } from '../services/api/ClientService'
import { UserService } from '../services/api/UserService'
import { OrderService } from '../services/api/OrderService'
import { CatalogService, Product } from '../services/api/CatalogService'

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

    /**
     * Cargar usuario y carrito al iniciar la aplicación
     * Se ejecuta una sola vez cuando el componente se monta
     */
    React.useEffect(() => {
        const initCart = async () => {
            try {
                const user = await UserService.getProfile()
                if (user?.id) {
                    setUserId(user.id)
                    await loadCart(user.id)
                }
            } catch (error) {
                console.log('Error inicializando carrito:', error)
            }
        }
        initCart()
    }, [])

    /**
     * Servicio: Cargar carrito del usuario desde el backend
     * Obtiene el carrito del servidor, enriquece con datos del catálogo y sincroniza con el estado local
     */
    const loadCart = async (uid: string) => {
        setIsLoading(true)
        try {
            const serverCart = await OrderService.getCart(uid)
            await mapServerCartToState(serverCart)
        } catch (error) {
            console.error('Error cargando carrito:', error)
            // Si el backend falla, mantener el estado local vacío
        } finally {
            setIsLoading(false)
        }
    }

    const mapServerCartToState = async (serverCart: any) => {
        // El backend del carrito solo guarda producto_id, cantidad, precio_unitario_ref
        // Necesitamos enriquecer con datos del catálogo (nombre, SKU, imagen)
        
        const enrichedItems: CartItem[] = await Promise.all(
            serverCart.items.map(async (item: any) => {
                // Intentar obtener datos del producto desde el catálogo
                let producto: Product | null = null
                try {
                    producto = await CatalogService.getProductById(item.producto_id)
                } catch (error) {
                    console.warn(`No se pudo obtener producto ${item.producto_id} del catálogo`)
                }
                
                // Usar datos del catálogo si están disponibles, sino usar fallbacks
                const nombreProducto = producto?.nombre || item.producto?.nombre || 'Producto'
                const codigoSku = producto?.codigo_sku || item.producto?.codigo_principal || 'SKU'
                const imagenUrl = producto?.imagen_url || item.producto?.imagen_url || null
                const unidadMedida = producto?.unidad_medida || 'UN'
                
                // Precios: preferir los del item guardado, luego los del catálogo
                const precioRef = Number(item.precio_unitario_ref || 0)
                const precioLista = precioRef > 0 ? precioRef : Number(producto?.precio_original || 0)
                const precioFinal = precioRef > 0 ? precioRef : Number(producto?.precio_oferta || precioLista)
                
                // Calcular si tiene promoción
                const tienePromocion = precioFinal < precioLista && precioLista > 0
                const descuentoPorcentaje = tienePromocion 
                    ? Math.round(((precioLista - precioFinal) / precioLista) * 100) 
                    : 0
                
                const cantidad = Number(item.cantidad || 1)
                
                return {
                    id: item.id || `item-${item.producto_id}`,
                    producto_id: item.producto_id,
                    codigo_sku: codigoSku,
                    nombre_producto: nombreProducto,
                    imagen_url: imagenUrl,
                    cantidad: cantidad,
                    unidad_medida: unidadMedida,
                    precio_lista: precioLista,
                    precio_final: precioFinal,
                    lista_precios_id: item.lista_precios_id || 1,
                    tiene_promocion: tienePromocion,
                    descuento_porcentaje: descuentoPorcentaje,
                    subtotal: cantidad * precioFinal
                }
            })
        )

        // Recalcular totales basados en items enriquecidos
        const subtotal = enrichedItems.reduce((acc, item) => acc + item.subtotal, 0)
        const descuento_total = enrichedItems.reduce((acc, item) => {
            return acc + ((item.precio_lista - item.precio_final) * item.cantidad)
        }, 0)
        const impuestos = subtotal * 0.12
        const total = subtotal + impuestos

        setCart({
            items: enrichedItems,
            cliente_id: serverCart.cliente_id,
            subtotal: subtotal,
            descuento_total: descuento_total,
            impuestos_total: impuestos,
            total_final: total
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
     * Servicio: Agregar producto al carrito en la vista del cliente
     * Actualización optimista: primero actualiza la UI, luego sincroniza con el backend
     * Si falla el backend, revierte la operación
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
                // Solo enviar campos que el backend acepta: producto_id, cantidad, precio_unitario_ref
                await OrderService.addToCart(currentUser, {
                    producto_id: product.id,
                    cantidad: newQuantity,
                    precio_unitario_ref: product.precio_final
                })
            }
        } catch (error) {
            console.error('Error persisting cart add:', error)
            Alert.alert('Error', 'No se pudo guardar el producto en el carrito remoto.')
            // Revertir optimismo (simplificado: recargar carrito)
            if (userId) loadCart(userId)
        }
    }, [calculateTotals, userId, cart.items, loadCart])

    /**
     * Servicio: Eliminar producto del carrito en la vista del cliente
     * Actualización optimista con rollback en caso de error
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
     * Servicio: Actualizar cantidad de un producto en el carrito del cliente
     * Si la cantidad es 0 o negativa, elimina el producto
     */
    const updateQuantity = useCallback(async (productId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(productId)
            return
        }

        // Optimistic
        let precioFinal = 0
        setCart(prevCart => {
            const newItems = prevCart.items.map(item => {
                if (item.producto_id === productId) {
                    precioFinal = item.precio_final // Guardar precio para enviar al backend
                    return { ...item, cantidad: quantity, subtotal: quantity * item.precio_final }
                }
                return item
            })
            return calculateTotals(newItems)
        })

        // Persistence
        try {
            const currentUser = userId || (await UserService.getProfile())?.id
            if (currentUser) {
                await OrderService.addToCart(currentUser, {
                    producto_id: productId,
                    cantidad: quantity,
                    precio_unitario_ref: precioFinal // Enviar precio del item existente
                })
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

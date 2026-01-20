import React, { createContext, useContext, useState, useEffect } from 'react'
import { Alert } from 'react-native'
import { CartService, CartItem as CartItemDto, AddToCartPayload } from '../services/api/CartService'
import { getUserFriendlyMessage } from '../utils/errorMessages'
import { UserService } from '../services/api/UserService'
import { CatalogService } from '../services/api/CatalogService'
import { Client, ClientBranch } from '../services/api/ClientService'
import { isApiError } from '../services/api/ApiError'

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
    userRole: string | null
    cart: Cart
    currentClient: Client | null
    items: CartItem[]
    totalItems: number
    isVendorMode: boolean // True when a vendor is managing a client's cart

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

const emptyCartState: Cart = {
    items: [],
    total_estimado: 0,
    subtotal: 0,
    descuento_total: 0,
    impuestos_total: 0,
    total_final: 0
}

const canUseCart = (role?: string | null) => {
    const normalized = role?.toLowerCase()
    return normalized === 'cliente' || normalized === 'vendedor'
}

const isVendorRole = (role?: string | null) => {
    const normalized = role?.toLowerCase()
    return normalized === 'vendedor'
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [userId, setUserId] = useState<string | null>(null)
    const [userRole, setUserRole] = useState<string | null>(null)
    const [cart, setCart] = useState<Cart>(emptyCartState)
    const [currentClient, setCurrentClient] = useState<Client | null>(null)
    const [currentBranch, setCurrentBranch] = useState<ClientBranch | null>(null)
    const [loading, setLoading] = useState(false)

    const isVendorMode = isVendorRole(userRole) && currentClient !== null

    const getClientIdentifier = (): string => {
        if (!currentClient) return ''
        return currentClient.usuario_principal_id || currentClient.id
    }

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

    // ✅ MEJORADO: También recargar cuando cambia el cliente seleccionado (para vendedores)
    useEffect(() => {
        if (!userId) {
            setCart(emptyCartState)
            return
        }

        if (!canUseCart(userRole)) {
            setCart(emptyCartState)
            return
        }

        loadCart(userId)
    }, [userId, userRole, currentClient?.id]) // ✅ Añadido currentClient?.id

    const loadCart = async (uid: string) => {
        if (!canUseCart(userRole)) return

        setLoading(true)
        try {
            const target = isVendorMode
                ? { type: 'client' as const, clientId: getClientIdentifier() }
                : { type: 'me' as const }

            const serverCart = await CartService.getCart(target)
            const mappedCart = await mapServerCartToState(serverCart)
            setCart(mappedCart)
        } catch (error) {
            console.warn('Error loading cart from server', error)
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

    // ✅ NUEVA FUNCIÓN: Recalcular totales del carrito localmente
    const recalculateCartTotals = (items: CartItem[]): Pick<Cart, 'subtotal' | 'descuento_total' | 'impuestos_total' | 'total_final' | 'total_estimado'> => {
        const subtotal = items.reduce((acc, curr) => acc + (curr.subtotal || 0), 0)
        const descuento_total = items.reduce((acc, curr) => {
            const discountPerUnit = Math.max(0, curr.precio_lista - curr.precio_final)
            return acc + (discountPerUnit * curr.cantidad)
        }, 0)
        const impuestos_total = subtotal * 0.12 // IVA 12%
        const total_final = subtotal + impuestos_total

        return {
            subtotal,
            descuento_total,
            impuestos_total,
            total_final,
            total_estimado: total_final
        }
    }

    const mapServerCartToState = async (serverCart: any): Promise<Cart> => {
        if (!serverCart || !serverCart.items) return { items: [], total_estimado: 0 }

        const items: CartItem[] = []

        const normalizePrice = (value: unknown) => {
            if (value === undefined || value === null) return null
            const numeric = Number(value)
            return Number.isFinite(numeric) ? numeric : null
        }

        const resolvePrice = (candidates: unknown[]) => {
            for (const candidate of candidates) {
                const price = normalizePrice(candidate)
                if (price !== null) return price
            }
            return 0
        }

        let productsMap = new Map<string, any>()
        try {
            // ✅ MEJORADO: Obtener lista_precios_id del cliente para vendedores
            let clientListId: number | undefined
            if (isVendorMode && currentClient) {
                clientListId = currentClient.lista_precios_id ?? undefined
            }

            // Usar método unificado que maneja tanto cliente directo como vendedor
            const productsResponse = await CatalogService.getProductsForClient(1, 1000, undefined, clientListId)
            productsResponse.items.forEach(p => productsMap.set(p.id, p))
        } catch (err) {
            console.warn('Could not fetch products for cart enrichment', err)
        }

        for (const item of serverCart.items) {
            try {
                const productDetails = productsMap.get(item.producto_id)


                const precioLista = resolvePrice([
                    item.precio_original_snapshot,
                    item.precio_lista,
                    productDetails?.precio_original,
                    productDetails?.precio,
                    productDetails?.precio_oferta
                ])

                let precioFinal = resolvePrice([
                    item.precio_unitario_ref,
                    item.precio_unitario,
                    item.precio_final,
                    item.precio,
                    productDetails?.precio_oferta,
                    productDetails?.precio_original,
                    productDetails?.precio
                ])
                if (precioFinal === 0 && precioLista > 0) {
                    precioFinal = precioLista
                }

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

        if (client) {
            setCart(prev => ({
                ...prev,
                cliente_id: client.id,
                cliente_nombre: client.nombre_comercial || client.razon_social,
                sucursal_id: branch?.id,
                sucursal_nombre: branch?.nombre_sucursal
            }))


            if (client.usuario_principal_id) {
                setUserId(client.usuario_principal_id)
            }
        } else {
            setCart(prev => ({
                ...prev,
                cliente_id: undefined,
                cliente_nombre: undefined,
                sucursal_id: undefined,
                sucursal_nombre: undefined
            }))

            UserService.getProfile().then(p => {
                if (p?.id) setUserId(p.id)
            }).catch(() => { })
        }
    }

    const addToCart = async (product: any, quantity: number = 1) => {
        let currentUserId = userId

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
            Alert.alert('Error', 'Debes iniciar sesion para comprar')
            return
        }

        try {
            const payload: AddToCartPayload = {
                producto_id: product.id || product.producto_id,
                cantidad: quantity,
                campania_aplicada_id: product.campania_aplicada_id,
                motivo_descuento: product.motivo_descuento
            }

            const target = isVendorMode
                ? { type: 'client' as const, clientId: getClientIdentifier() }
                : { type: 'me' as const }

            await CartService.addToCart(target, payload)

            // Optimistic merge
            setCart(prev => {
                const prodId = payload.producto_id
                const priceFinal = Number(product.precio_final ?? product.precio_lista ?? 0)
                const priceLista = Number(product.precio_lista ?? priceFinal)
                const cantidad = quantity
                const existing = prev.items.find(i => i.producto_id === prodId)
                const updatedItem: CartItem = {
                    id: existing?.id || prodId,
                    producto_id: prodId,
                    nombre_producto: product.nombre || product.nombre_producto || existing?.nombre_producto || 'Producto',
                    codigo_sku: product.codigo_sku || existing?.codigo_sku || 'N/A',
                    imagen_url: product.imagen_url || existing?.imagen_url,
                    cantidad,
                    unidad_medida: product.unidad_medida || existing?.unidad_medida || 'UN',
                    precio_lista: priceLista,
                    precio_final: priceFinal,
                    subtotal: cantidad * priceFinal,
                    campania_aplicada_id: payload.campania_aplicada_id ?? existing?.campania_aplicada_id,
                    motivo_descuento: payload.motivo_descuento ?? existing?.motivo_descuento,
                    tiene_promocion: (priceLista > priceFinal) || !!(payload.campania_aplicada_id || existing?.campania_aplicada_id),
                    descuento_porcentaje: priceLista > 0 ? Math.round(Math.max(0, (priceLista - priceFinal) / priceLista) * 100) : 0
                }

                const items = existing
                    ? prev.items.map(i => i.producto_id === prodId ? updatedItem : i)
                    : prev.items.concat(updatedItem)

                const total_estimado = items.reduce((acc, i) => acc + i.subtotal, 0)
                return { ...prev, items, total_estimado }
            })

            await loadCart(currentUserId)

        } catch (error) {
            console.error('Error adding to cart', error)
            Alert.alert('Error', getUserFriendlyMessage(error, 'CART_ERROR'))
            await loadCart(currentUserId)
        }
    }

    const existingItem = (prodId: string) => cart.items.some(i => i.producto_id === prodId)

    const removeFromCart = async (productId: string) => {
        if (!userId) return

        // ✅ MEJORADO: Recalcular totales al remover item
        setCart(prev => {
            const updatedItems = prev.items.filter(i => i.producto_id !== productId)
            const totals = recalculateCartTotals(updatedItems)
            return {
                ...prev,
                items: updatedItems,
                ...totals
            }
        })

        try {
            const target = isVendorMode
                ? { type: 'client' as const, clientId: getClientIdentifier() }
                : { type: 'me' as const }

            await CartService.removeFromCart(target, productId)
            loadCart(userId)
        } catch (error) {
            const isNotFoundError = isApiError(error) && error.status === 404
            if (!isNotFoundError) {
                console.error('Error removing item', error)
            } else {
                console.warn('Intento de eliminar producto de carrito inexistente', { productId })
            }
            loadCart(userId)
        }
    }

    const updateQuantity = async (productId: string, quantity: number) => {
        if (!userId || quantity <= 0) return

        // ✅ MEJORADO: Recalcular totales al actualizar cantidad
        setCart(prev => {
            const updatedItems = prev.items.map(i => i.producto_id === productId
                ? { ...i, cantidad: quantity, subtotal: quantity * i.precio_final }
                : i)
            const totals = recalculateCartTotals(updatedItems)
            return {
                ...prev,
                items: updatedItems,
                ...totals
            }
        })

        try {
            const payload: AddToCartPayload = {
                producto_id: productId,
                cantidad: quantity
            }
            const target = isVendorMode
                ? { type: 'client' as const, clientId: getClientIdentifier() }
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
        // ✅ MEJORADO: Incluir todos los campos al limpiar carrito
        setCart({
            items: [],
            total_estimado: 0,
            subtotal: 0,
            descuento_total: 0,
            impuestos_total: 0,
            total_final: 0
        })
        try {
            const target = isVendorMode
                ? { type: 'client' as const, clientId: getClientIdentifier() }
                : { type: 'me' as const }
            await CartService.clearCart(target)
        } catch (e) { console.warn(e) }
    }

    const getItemCount = () => cart.items.reduce((acc, item) => acc + item.cantidad, 0)

    const validatePriceList = (listId: number) => true
    const recalculatePrices = () => { }

    const value: CartContextValue = {
        userId,
        userRole,
        cart,
        currentClient,
        currentBranch,
        items: cart.items,
        totalItems: getItemCount(),
        isVendorMode,
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
        totalItems: 0,
        isVendorMode: false,
        userRole: null
    }
}

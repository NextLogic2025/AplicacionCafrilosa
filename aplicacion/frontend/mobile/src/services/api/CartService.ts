import { env } from '../../config/env'
import { apiRequest } from './client'

/**
 * Interfaz para items de carrito (entrada/salida backend)
 */
/**
 * Interfaz para items de carrito (entrada/salida backend)
 */
export interface CartItemDto {
    producto_id: string
    cantidad: number
    precio_unitario_ref?: number // Precio final (snapshot)
    precio_original_snapshot?: number // Precio lista (snapshot)
    campania_aplicada_id?: number
    motivo_descuento?: string
    // Campos opcionales para la UI (enriquecimiento)
    codigo_sku?: string
    nombre_producto?: string
    imagen_url?: string
    uniad_medida?: string
}

/**
 * DTO para enviar al backend (POST /orders/cart/:userId)
 * Solo incluye los campos permitidos por el backend
 */
export interface AddToCartPayload {
    producto_id: string
    cantidad: number
    campania_aplicada_id?: number
    motivo_descuento?: string
    referido_id?: string
}

/**
 * Interfaz para un item del carrito (respuesta completa)
 */
export interface CartItem {
    id: string
    producto_id: string
    cantidad: number
    precio_unitario_ref: number // Precio pactado con el backend
    precio_original_snapshot?: number
    campania_aplicada_id?: number
    motivo_descuento?: string

    // Campos enriquecidos (provienen de Producto o snapshot)
    codigo_sku: string
    nombre_producto: string
    imagen_url?: string
    unidad_medida: string
    precio_lista: number
    precio_final: number
    lista_precios_id: number
    tiene_promocion: boolean
    descuento_porcentaje?: number
    subtotal: number
}

/**
 * Interfaz para el carrito completo
 */
export interface Cart {
    id?: string
    usuario_id?: string
    cliente_id?: string
    cliente_nombre?: string
    sucursal_id?: string
    sucursal_nombre?: string
    items: CartItem[]

    // Totales calculados
    subtotal: number
    descuento_total: number
    impuestos_total: number
    total_final: number

    // Warnings del backend (ej. precios actualizados)
    warnings?: any[]
}

/**
 * CartService - Servicio de gestión de carrito
 * 
 * Soporta dos flujos:
 * 1. Cliente: usa endpoints /orders/cart/me (carrito propio)
 * 2. Vendedor: usa endpoints /orders/cart/client/:clienteId (carrito del cliente)
 */
export const CartService = {
    // Obtener carrito actual (personal o de cliente para vendedor)
    getCart: async (target: { type: 'me' } | { type: 'client', clientId: string }): Promise<any> => {
        try {
            const endpoint = target.type === 'client'
                ? `${env.api.ordersUrl}/orders/cart/client/${target.clientId}`
                : `${env.api.ordersUrl}/orders/cart/me`

            return await apiRequest(endpoint)
        } catch (error) {
            console.error('Error fetching cart:', error)
            throw error
        }
    },

    // Agregar o actualizar item en el carrito
    addToCart: async (target: { type: 'me' } | { type: 'client', clientId: string }, item: AddToCartPayload): Promise<any> => {
        try {
            const endpoint = target.type === 'client'
                ? `${env.api.ordersUrl}/orders/cart/client/${target.clientId}`
                : `${env.api.ordersUrl}/orders/cart/me`

            console.log(`[CartService] Adding to ${target.type} cart:`, JSON.stringify(item, null, 2))

            const response = await apiRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify(item)
            })
            return response
        } catch (error) {
            console.error('Error adding to cart:', error)
            throw error
        }
    },

    // Eliminar item del carrito
    removeFromCart: async (target: { type: 'me' } | { type: 'client', clientId: string }, productId: string): Promise<void> => {
        try {
            const endpoint = target.type === 'client'
                ? `${env.api.ordersUrl}/orders/cart/client/${target.clientId}/item/${productId}`
                : `${env.api.ordersUrl}/orders/cart/me/item/${productId}`

            await apiRequest(endpoint, {
                method: 'DELETE'
            })
        } catch (error) {
            console.error('Error removing from cart:', error)
            throw error
        }
    },

    // Vaciar carrito completo
    clearCart: async (target: { type: 'me' } | { type: 'client', clientId: string }): Promise<void> => {
        try {
            const endpoint = target.type === 'client'
                ? `${env.api.ordersUrl}/orders/cart/client/${target.clientId}` // Assuming DELETE on root cart resource clears it
                : `${env.api.ordersUrl}/orders/cart/me`

            await apiRequest(endpoint, {
                method: 'DELETE'
            })
        } catch (error) {
            console.error('Error clearing cart:', error)
            throw error
        }
    },

    /**
     * Asociar un cliente al carrito (para vendedores)
     */
    /*
    // El backend actual no tiene endpoint para asociar cliente al carrito.
    // La asociación se resuelve al crear la orden.
    setCartClient: async (userId: string, clienteId: string): Promise<any> => { ... }
    */
}

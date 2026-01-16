import { env } from '../../config/env'
import { apiRequest } from './client'
import { endpoints } from './endpoints'

export interface CartItemDto {
    producto_id: string
    cantidad: number
    precio_unitario_ref?: number
    precio_original_snapshot?: number
    campania_aplicada_id?: number
    motivo_descuento?: string
    codigo_sku?: string
    nombre_producto?: string
    imagen_url?: string
    uniad_medida?: string
}

export interface AddToCartPayload {
    producto_id: string
    cantidad: number
    campania_aplicada_id?: number
    motivo_descuento?: string
    referido_id?: string
}

export interface CartItem {
    id: string
    producto_id: string
    cantidad: number
    precio_unitario_ref: number
    precio_original_snapshot?: number
    campania_aplicada_id?: number
    motivo_descuento?: string
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

export interface Cart {
    id?: string
    usuario_id?: string
    cliente_id?: string
    cliente_nombre?: string
    sucursal_id?: string
    sucursal_nombre?: string
    items: CartItem[]
    subtotal: number
    descuento_total: number
    impuestos_total: number
    total_final: number
    warnings?: any[]
}

type CartTarget = { type: 'me' } | { type: 'client', clientId: string }

export const CartService = {
    getCart: async (target: CartTarget): Promise<any> => {
        try {
            const endpoint =
                target.type === 'client'
                    ? `${env.api.ordersUrl}${endpoints.orders.cartClient(target.clientId)}`
                    : `${env.api.ordersUrl}${endpoints.orders.cartMe}`

            return await apiRequest(endpoint)
        } catch (error) {
            console.error('Error fetching cart:', error)
            throw error
        }
    },

    addToCart: async (target: CartTarget, item: AddToCartPayload): Promise<any> => {
        try {
            const endpoint =
                target.type === 'client'
                    ? `${env.api.ordersUrl}${endpoints.orders.cartClient(target.clientId)}`
                    : `${env.api.ordersUrl}${endpoints.orders.cartMe}`

            return await apiRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify(item)
            })
        } catch (error) {
            console.error('Error adding to cart:', error)
            throw error
        }
    },

    removeFromCart: async (target: CartTarget, productId: string): Promise<void> => {
        try {
            const endpoint =
                target.type === 'client'
                    ? `${env.api.ordersUrl}${endpoints.orders.cartClientItem(target.clientId, productId)}`
                    : `${env.api.ordersUrl}${endpoints.orders.cartMeItem(productId)}`

            await apiRequest(endpoint, { method: 'DELETE' })
        } catch (error) {
            console.error('Error removing from cart:', error)
            throw error
        }
    },

    clearCart: async (target: CartTarget): Promise<void> => {
        try {
            const endpoint =
                target.type === 'client'
                    ? `${env.api.ordersUrl}${endpoints.orders.cartClient(target.clientId)}`
                    : `${env.api.ordersUrl}${endpoints.orders.cartMe}`

            await apiRequest(endpoint, { method: 'DELETE' })
        } catch (error) {
            console.error('Error clearing cart:', error)
            throw error
        }
    }
}

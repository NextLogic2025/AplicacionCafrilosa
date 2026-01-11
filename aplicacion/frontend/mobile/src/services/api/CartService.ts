import { apiRequest } from './client'

/**
 * Interfaz para un item del carrito
 */
export interface CartItem {
    id: string
    producto_id: string
    codigo_sku: string
    nombre_producto: string
    imagen_url?: string
    cantidad: number
    unidad_medida: string
    precio_lista: number        // Precio original sin promoción
    precio_final: number         // Precio final (con promoción si aplica)
    lista_precios_id: number     // Lista de precios del precio
    tiene_promocion: boolean
    descuento_porcentaje?: number
    subtotal: number             // cantidad * precio_final
}

/**
 * Interfaz para el carrito completo
 */
export interface Cart {
    items: CartItem[]
    cliente_id?: string
    cliente_nombre?: string
    lista_precios_cliente?: number
    subtotal: number
    descuento_total: number
    impuestos_total: number
    total_final: number
}

/**
 * Interfaz para crear un pedido desde el carrito
 */
export interface CreateOrderFromCartPayload {
    cliente_id: string
    vendedor_id: string
    items: Array<{
        producto_id: string
        codigo_sku: string
        nombre_producto: string
        cantidad: number
        unidad_medida: string
        precio_lista: number
        precio_final: number
        subtotal_linea: number
    }>
    subtotal: number
    descuento_total: number
    impuestos_total: number
    total_final: number
    condicion_pago?: string
    fecha_entrega_solicitada?: string
    observaciones_entrega?: string
}

/**
 * CartService - Servicio de gestión de carrito (almacenamiento local)
 *
 * IMPORTANTE: Este servicio maneja el carrito en memoria local (AsyncStorage o estado).
 * No usa los endpoints /orders/cart/:userId del backend porque esos son para
 * el carrito persistente del usuario cliente.
 *
 * El vendedor arma el carrito localmente y luego crea el pedido con POST /orders
 */
export const CartService = {
    /**
     * Obtener carrito local (desde AsyncStorage o estado global)
     * Por ahora retorna un carrito vacío - se implementará con Context/Redux
     */
    getLocalCart: async (): Promise<Cart> => {
        // TODO: Implementar con AsyncStorage o Context
        return {
            items: [],
            subtotal: 0,
            descuento_total: 0,
            impuestos_total: 0,
            total_final: 0
        }
    },

    /**
     * Crear pedido desde el carrito
     *
     * Endpoint: POST /orders
     * Roles permitidos: admin, vendedor, cliente
     */
    createOrderFromCart: async (payload: CreateOrderFromCartPayload): Promise<any> => {
        try {
            // Crear la cabecera del pedido
            const order = await apiRequest<any>('/api/orders', {
                method: 'POST',
                body: JSON.stringify({
                    cliente_id: payload.cliente_id,
                    vendedor_id: payload.vendedor_id,
                    estado_actual: 'PENDIENTE',
                    subtotal: payload.subtotal,
                    descuento_total: payload.descuento_total,
                    impuestos_total: payload.impuestos_total,
                    total_final: payload.total_final,
                    condicion_pago: payload.condicion_pago || 'CONTADO',
                    fecha_entrega_solicitada: payload.fecha_entrega_solicitada,
                    origen_pedido: 'MOBILE_VENDEDOR',
                    observaciones_entrega: payload.observaciones_entrega
                })
            })

            // Agregar los items al pedido
            for (const item of payload.items) {
                await apiRequest<any>(`/api/orders/${order.id}/detalles`, {
                    method: 'POST',
                    body: JSON.stringify({
                        producto_id: item.producto_id,
                        codigo_sku: item.codigo_sku,
                        nombre_producto: item.nombre_producto,
                        cantidad: item.cantidad,
                        unidad_medida: item.unidad_medida,
                        precio_lista: item.precio_lista,
                        precio_final: item.precio_final,
                        es_bonificacion: false,
                        subtotal_linea: item.subtotal_linea
                    })
                })
            }

            return order
        } catch (error: any) {
            console.error('Error creating order from cart:', error)
            throw error
        }
    },

    /**
     * Calcular totales del carrito
     */
    calculateTotals: (items: CartItem[]): {
        subtotal: number
        descuento_total: number
        impuestos_total: number
        total_final: number
    } => {
        const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)

        // Calcular descuentos aplicados
        const descuento_total = items.reduce((sum, item) => {
            const descuento_item = (item.precio_lista - item.precio_final) * item.cantidad
            return sum + descuento_item
        }, 0)

        // Calcular impuestos (12% IVA en Ecuador)
        const impuestos_total = subtotal * 0.12

        const total_final = subtotal + impuestos_total

        return {
            subtotal,
            descuento_total,
            impuestos_total,
            total_final
        }
    }
}

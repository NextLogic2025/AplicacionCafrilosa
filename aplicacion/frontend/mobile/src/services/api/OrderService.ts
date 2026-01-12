import { apiRequest } from './client'
import { env } from '../../config/env'

/**
 * Estados de Pedido
 * Basados en la tabla estados_pedido del backend
 */
export type OrderStatus =
    | 'PENDIENTE'
    | 'APROBADO'
    | 'EN_PREPARACION'
    | 'FACTURADO'
    | 'EN_RUTA'
    | 'ENTREGADO'
    | 'ANULADO'
    | 'RECHAZADO'

/**
 * Mapeo de estados a colores para UI
 */
export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
    PENDIENTE: '#F59E0B',        // Amber
    APROBADO: '#3B82F6',         // Blue
    EN_PREPARACION: '#8B5CF6',   // Purple
    FACTURADO: '#06B6D4',        // Cyan
    EN_RUTA: '#6366F1',          // Indigo
    ENTREGADO: '#10B981',        // Green
    ANULADO: '#6B7280',          // Gray
    RECHAZADO: '#EF4444'         // Red
}

/**
 * Mapeo de estados a nombres legibles
 */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
    PENDIENTE: 'Pendiente',
    APROBADO: 'Aprobado',
    EN_PREPARACION: 'En Preparación',
    FACTURADO: 'Facturado',
    EN_RUTA: 'En Camino',
    ENTREGADO: 'Entregado',
    ANULADO: 'Anulado',
    RECHAZADO: 'Rechazado'
}

/**
 * Detalle de Pedido (Items)
 */
export interface OrderDetail {
    id: string
    pedido_id: string
    producto_id: string
    codigo_sku?: string
    nombre_producto?: string
    cantidad: number
    unidad_medida?: string
    precio_lista?: number
    precio_final?: number
    es_bonificacion: boolean
    motivo_descuento?: string
    subtotal_linea: number
    created_at: string
    updated_at: string
}

/**
 * Pedido (Order)
 */
export interface Order {
    id: string
    codigo_visual: number
    cliente_id: string
    vendedor_id: string
    sucursal_id?: string
    estado_actual: OrderStatus
    subtotal: number
    descuento_total: number
    impuestos_total: number
    total_final: number
    condicion_pago?: string
    fecha_entrega_solicitada?: string
    origen_pedido?: string
    ubicacion_pedido?: string
    observaciones_entrega?: string
    created_at: string
    updated_at: string
    deleted_at?: string

    // Relaciones (cuando se incluyen)
    detalles?: OrderDetail[]
    cliente?: {
        id: string
        razon_social: string
        nombre_comercial?: string
        identificacion: string
    }
}

/**
 * Payload para crear un pedido
 */
export interface CreateOrderPayload {
    cliente_id: string
    vendedor_id: string
    sucursal_id?: string
    items: {
        producto_id: string
        cantidad: number
        precio_unitario: number
        codigo_sku?: string
        nombre_producto?: string
        unidad_medida?: string
        motivo_descuento?: string
    }[]
    observaciones_entrega?: string
}

export interface CartItemDto {
    producto_id: string
    cantidad: number
    precio_unitario_ref?: number
}

export interface Cart {
    id: string
    usuario_id: string
    cliente_id?: string
    items: {
        id: string
        producto_id: string
        cantidad: number
        precio_unitario_ref: number
        producto?: {
            id: string
            nombre: string
            codigo_principal: string
            precio_venta: number
            imagen_url?: string
        }
    }[]
    total_estimado: number
}

export interface OrderFilters {
    vendedor_id?: string
    cliente_id?: string
    estado_actual?: OrderStatus
    fecha_desde?: string
    fecha_hasta?: string
    limit?: number
    offset?: number
}

/**
 * OrderService
 *
 * Servicio para manejar pedidos (orders)
 */
export const OrderService = {
    /**
     * Servicio: Crear un nuevo pedido desde la vista del cliente o vendedor
     * Envía los items del carrito y datos del cliente al backend
     */
    createOrder: async (payload: CreateOrderPayload): Promise<Order> => {
        try {
            return await apiRequest<Order>(`${env.api.ordersUrl}/orders`, {
                method: 'POST',
                body: JSON.stringify(payload)
            })
        } catch (error) {
            console.error('Error creating order:', error)
            throw error
        }
    },

    /**
     * Servicio: Obtener el carrito del usuario cliente en la vista de productos
     * Retorna todos los items del carrito con sus precios y cantidades
     */
    getCart: async (userId: string): Promise<Cart> => {
        try {
            return await apiRequest<Cart>(`${env.api.ordersUrl}/orders/cart/${userId}`, {
                method: 'GET'
            })
        } catch (error) {
            console.error('Error fetching cart:', error)
            throw error
        }
    },

    /**
     * Servicio: Agregar o actualizar item en el carrito del cliente
     * Si el producto ya existe, actualiza la cantidad; si no, lo agrega
     */
    addToCart: async (userId: string, item: CartItemDto): Promise<Cart> => {
        try {
            return await apiRequest<Cart>(`${env.api.ordersUrl}/orders/cart/${userId}`, {
                method: 'POST',
                body: JSON.stringify(item)
            })
        } catch (error) {
            console.error('Error adding to cart:', error)
            throw error
        }
    },

    /**
     * Servicio: Eliminar item del carrito del cliente
     * Elimina completamente un producto del carrito
     */
    removeFromCart: async (userId: string, productId: string): Promise<Cart> => {
        try {
            return await apiRequest<Cart>(`${env.api.ordersUrl}/orders/cart/${userId}/item/${productId}`, {
                method: 'DELETE'
            })
        } catch (error) {
            console.error('Error removing from cart:', error)
            throw error
        }
    },

    /**
     * Servicio: Obtener pedidos de un cliente específico para la vista "Mis Pedidos"
     * Retorna el historial de pedidos ordenado por fecha (más reciente primero)
     */
    getClientOrders: async (userId: string): Promise<Order[]> => {
        try {
            const orders = await apiRequest<Order[]>(`${env.api.ordersUrl}/orders/client/${userId}`)
            // Ordenar por fecha (más reciente primero)
            return orders.sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
        } catch (error) {
            console.error('Error fetching client orders:', error)
            throw error
        }
    },

    /**
     * Obtener lista de pedidos (General)
     */
    getOrders: async (filters?: OrderFilters): Promise<Order[]> => {
        try {
            // Construir query params
            const params = new URLSearchParams()

            if (filters?.vendedor_id) params.append('vendedor_id', filters.vendedor_id)
            if (filters?.cliente_id) params.append('cliente_id', filters.cliente_id)
            if (filters?.estado_actual) params.append('estado', filters.estado_actual)
            if (filters?.fecha_desde) params.append('fecha_desde', filters.fecha_desde)
            if (filters?.fecha_hasta) params.append('fecha_hasta', filters.fecha_hasta)
            if (filters?.limit) params.append('limit', filters.limit.toString())
            if (filters?.offset) params.append('offset', filters.offset.toString())

            const queryString = params.toString()
            const url = `${env.api.ordersUrl}/orders${queryString ? `?${queryString}` : ''}`

            const orders = await apiRequest<Order[]>(url, {
                method: 'GET'
            })

            // Ordenar por fecha de creación (más reciente primero)
            return orders.sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
        } catch (error) {
            console.error('Error fetching orders:', error)
            throw error
        }
    },

    /**
     * Obtener pedidos del vendedor autenticado
     */
    getMyOrders: async (vendedorId: string, filters?: Omit<OrderFilters, 'vendedor_id'>): Promise<Order[]> => {
        return OrderService.getOrders({
            ...filters,
            vendedor_id: vendedorId
        })
    },

    /**
     * Obtener detalles de un pedido específico
     */
    getOrderById: async (orderId: string): Promise<Order> => {
        try {
            const order = await apiRequest<Order>(`${env.api.ordersUrl}/orders/${orderId}`, {
                method: 'GET'
            })
            return order
        } catch (error) {
            console.error('Error fetching order details:', error)
            throw error
        }
    },

    /**
     * Obtener detalles (items) de un pedido
     */
    getOrderDetails: async (orderId: string): Promise<OrderDetail[]> => {
        try {
            // Primero intenta obtener el pedido completo
            const order = await OrderService.getOrderById(orderId)

            // Si el pedido incluye detalles, retornarlos
            if (order.detalles && order.detalles.length > 0) {
                return order.detalles
            }

            // Por ahora retornar array vacío
            console.warn(`No details found for order ${orderId}. Backend endpoint may not be implemented.`)
            return []
        } catch (error) {
            console.error('Error fetching order details:', error)
            throw error
        }
    },

    /**
     * Cancelar un pedido (solo si está en estado PENDIENTE)
     */
    cancelOrder: async (orderId: string): Promise<Order> => {
        try {
            const cancelledOrder = await apiRequest<Order>(`${env.api.ordersUrl}/orders/${orderId}/cancel`, {
                method: 'PATCH'
            })
            return cancelledOrder
        } catch (error) {
            console.error('Error cancelling order:', error)
            throw error
        }
    },

    /**
     * Actualizar un pedido
     */
    updateOrder: async (orderId: string, data: Partial<Order>): Promise<Order> => {
        try {
            const updatedOrder = await apiRequest<Order>(`${env.api.ordersUrl}/orders/${orderId}`, {
                method: 'PATCH',
                body: JSON.stringify(data)
            })
            return updatedOrder
        } catch (error) {
            console.error('Error updating order:', error)
            throw error
        }
    },

    /**
     * Cambiar estado de un pedido
     */
    changeOrderStatus: async (orderId: string, newStatus: OrderStatus, _motivo?: string): Promise<Order> => {
        try {
            // Por ahora usar PATCH /orders/:id
            return OrderService.updateOrder(orderId, {
                estado_actual: newStatus
            })
        } catch (error) {
            console.error('Error changing order status:', error)
            throw error
        }
    },

    /**
     * Formatear fecha para mostrar
     */
    formatOrderDate: (dateString: string): string => {
        const date = new Date(dateString)
        const options: Intl.DateTimeFormatOptions = {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }
        return date.toLocaleDateString('es-EC', options)
    },

    /**
     * Formatear solo fecha (sin hora)
     */
    formatOrderDateShort: (dateString: string): string => {
        const date = new Date(dateString)
        const options: Intl.DateTimeFormatOptions = {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }
        return date.toLocaleDateString('es-EC', options)
    },

    /**
     * Obtener estadísticas de pedidos
     */
    getOrderStats: (orders: Order[]) => {
        const total = orders.length
        const porEstado = orders.reduce((acc, order) => {
            acc[order.estado_actual] = (acc[order.estado_actual] || 0) + 1
            return acc
        }, {} as Record<OrderStatus, number>)

        const totalVentas = orders.reduce((sum, order) => sum + order.total_final, 0)

        return {
            total,
            porEstado,
            totalVentas
        }
    }
}

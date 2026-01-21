import { apiRequest } from './client'
import { env } from '../../config/env'
import { endpoints } from './endpoints'
import { isApiError } from './ApiError'
import { logErrorForDebugging } from '../../utils/errorMessages'

function ordersEndpoint(path: string) {
    return `${env.api.ordersUrl}${path}`
}

export type OrderStatus =
    | 'PENDIENTE'
    | 'APROBADO'
    | 'EN_PREPARACION'
    | 'PREPARADO'
    | 'FACTURADO'
    | 'EN_RUTA'
    | 'ENTREGADO'
    | 'ANULADO'
    | 'RECHAZADO'

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
    PENDIENTE: '#F59E0B',
    APROBADO: '#3B82F6',
    EN_PREPARACION: '#8B5CF6',
    PREPARADO: '#10B981',
    FACTURADO: '#06B6D4',
    EN_RUTA: '#6366F1',
    ENTREGADO: '#10B981',
    ANULADO: '#6B7280',
    RECHAZADO: '#EF4444'
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
    PENDIENTE: 'Pendiente',
    APROBADO: 'Aprobado',
    EN_PREPARACION: 'En Preparación',
    PREPARADO: 'Preparado',
    FACTURADO: 'Facturado',
    EN_RUTA: 'En Camino',
    ENTREGADO: 'Entregado',
    ANULADO: 'Anulado',
    RECHAZADO: 'Rechazado'
}

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

    detalles?: OrderDetail[]
    cliente?: {
        id: string
        razon_social: string
        nombre_comercial?: string
        identificacion: string
    }
    sucursal?: {
        id: string
        nombre: string
        direccion?: string
    }

    status?: 'pending' | 'processing' | 'shipped' | 'delivered'
    clientName?: string
    address?: string
    itemsCount?: number
    priority?: string
    numero?: number
    fecha_creacion?: string
    total?: number
}

export interface CreateOrderPayload {
    cliente_id: string
    vendedor_id: string
    sucursal_id?: string
    items: {
        producto_id: string
        cantidad: number
        precio_unitario: number
        precio_original?: number
        codigo_sku?: string
        nombre_producto?: string
        unidad_medida?: string
        motivo_descuento?: string
        campania_aplicada_id?: number
    }[]
    observaciones_entrega?: string
    condicion_pago?: string
    fecha_entrega_solicitada?: string
    origen_pedido?: string
    ubicacion?: {
        lat: number
        lng: number
    }
    descuento_total?: number
}

export type TrackingInfo = {
    id: string | number
    status: 'pending' | 'shipped' | 'delivered'
    carrier?: string
    estimatedDelivery?: string
    evidence?: { photo?: string; signature?: string }
    dates: { confirmed?: string; shipped?: string; delivered?: string }
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

function applyOrderFilters(orders: Order[], filters?: OrderFilters) {
    let result = orders

    if (filters?.vendedor_id) result = result.filter(o => o.vendedor_id === filters.vendedor_id)
    if (filters?.cliente_id) result = result.filter(o => o.cliente_id === filters.cliente_id)
    if (filters?.estado_actual) result = result.filter(o => o.estado_actual === filters.estado_actual)

    const fromMs = filters?.fecha_desde ? new Date(filters.fecha_desde).getTime() : null
    const toMs = filters?.fecha_hasta ? new Date(filters.fecha_hasta).getTime() : null
    if (Number.isFinite(fromMs as number)) result = result.filter(o => new Date(o.created_at).getTime() >= (fromMs as number))
    if (Number.isFinite(toMs as number)) result = result.filter(o => new Date(o.created_at).getTime() <= (toMs as number))

    result = result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    const offset = Math.max(0, filters?.offset ?? 0)
    const limit = filters?.limit
    if (typeof limit === 'number' && Number.isFinite(limit)) {
        return result.slice(offset, offset + Math.max(0, limit))
    }
    if (offset > 0) return result.slice(offset)
    return result
}

export const OrderService = {
    normalizeOrder: (order: Order): Order => {
        const clientName =
            order.clientName ?? order.cliente?.nombre_comercial ?? order.cliente?.razon_social

        const itemsCount = order.itemsCount ?? order.detalles?.length
        const total = order.total ?? order.total_final
        const numero = order.numero ?? order.codigo_visual
        const fecha_creacion = order.fecha_creacion ?? order.created_at

        const status: Order['status'] =
            order.status ??
            (order.estado_actual === 'ENTREGADO'
                ? 'delivered'
                : order.estado_actual === 'EN_RUTA'
                    ? 'shipped'
                    : order.estado_actual === 'EN_PREPARACION'
                        ? 'processing'
                        : 'pending')

        return {
            ...order,
            clientName,
            itemsCount,
            total,
            numero,
            fecha_creacion,
            status
        }
    },

    createOrder: async (payload: CreateOrderPayload): Promise<Order> => {
        void payload
        throw new Error('CREATE_ORDER_NOT_SUPPORTED')
    },

    createOrderFromCart: async (
        target: { type: 'me' } | { type: 'client', clientId: string },
        options?: {
            condicion_pago?: 'CONTADO' | 'CREDITO' | 'TRANSFERENCIA' | 'CHEQUE'
            sucursal_id?: string
        }
    ): Promise<Order> => {
        try {
            const endpoint =
                target.type === 'client'
                    ? ordersEndpoint(endpoints.orders.orderFromCartClient(target.clientId))
                    : ordersEndpoint(endpoints.orders.orderFromCartMe)

            const payload = {
                forma_pago_solicitada: options?.condicion_pago || 'CONTADO',
                ...(options?.sucursal_id && { sucursal_id: options.sucursal_id })
            }

            const order = await apiRequest<Order>(endpoint, {
                method: 'POST',
                body: JSON.stringify(payload)
            })
            return OrderService.normalizeOrder(order)
        } catch (error) {
            logErrorForDebugging(error, 'OrderService.createOrderFromCart', { target })
            throw error
        }
    },

    getOrderHistory: async (): Promise<Order[]> => {
        try {
            const orders = await apiRequest<Order[]>(ordersEndpoint(endpoints.orders.ordersUserHistory))
            return orders
                .map(OrderService.normalizeOrder)
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        } catch (error) {
            logErrorForDebugging(error, 'OrderService.getOrderHistory')
            throw error
        }
    },

    getClientOrders: async (userId: string): Promise<Order[]> => {
        try {
            const orders = await apiRequest<Order[]>(ordersEndpoint(endpoints.orders.ordersByClientId(userId)))
            return orders.map(OrderService.normalizeOrder).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        } catch (error) {
            logErrorForDebugging(error, 'OrderService.getClientOrders', { userId })
            throw error
        }
    },

    getOrders: async (filters?: OrderFilters): Promise<Order[]> => {
        const baseUrl = ordersEndpoint(endpoints.orders.orders)

        if (filters?.cliente_id && !filters.vendedor_id) {
            const orders = await OrderService.getClientOrders(filters.cliente_id)
            return applyOrderFilters(orders, filters)
        }

        const params = new URLSearchParams()
        if (filters?.vendedor_id) params.append('vendedor_id', filters.vendedor_id)
        if (filters?.cliente_id) params.append('cliente_id', filters.cliente_id)
        if (filters?.estado_actual) params.append('estado', filters.estado_actual)
        if (filters?.fecha_desde) params.append('fecha_desde', filters.fecha_desde)
        if (filters?.fecha_hasta) params.append('fecha_hasta', filters.fecha_hasta)
        if (filters?.limit) params.append('limit', filters.limit.toString())
        if (filters?.offset) params.append('offset', filters.offset.toString())

        const queryString = params.toString()
        const url = `${baseUrl}${queryString ? `?${queryString}` : ''}`

        try {
            const orders = await apiRequest<Order[]>(url, { method: 'GET' })
            return applyOrderFilters(orders.map(OrderService.normalizeOrder), filters)
        } catch (error) {
            if (isApiError(error) && (error.status === 403 || error.status === 404)) {
                const orders = await apiRequest<Order[]>(ordersEndpoint(endpoints.orders.ordersUserHistory))
                return applyOrderFilters(orders.map(OrderService.normalizeOrder), filters)
            }
            logErrorForDebugging(error, 'OrderService.getOrders', { filters })
            throw error
        }
    },

    getOrdersByClient: async (clientId: string): Promise<Order[]> => {
        return OrderService.getClientOrders(clientId)
    },

    getTrackingInfo: async (orderId?: string): Promise<TrackingInfo | null> => {
        if (!orderId) return null
        const order = await OrderService.getOrderById(orderId)

        try {
            const tracking = await apiRequest<{
                orderId: string
                currentStatus: string
                lastUpdate: string
                timeline: { status: string; time: string; message?: string }[]
            }>(ordersEndpoint(endpoints.orders.orderTracking(orderId)))

            const timeline = Array.isArray(tracking.timeline) ? tracking.timeline : []
            const statusRaw = tracking.currentStatus || order.estado_actual
            const status: TrackingInfo['status'] =
                statusRaw === 'ENTREGADO' ? 'delivered' : statusRaw === 'EN_RUTA' ? 'shipped' : 'pending'

            const confirmed = timeline[0]?.time ?? order.created_at
            const shipped = timeline.find(t => t.status === 'EN_RUTA')?.time
            const delivered = timeline.find(t => t.status === 'ENTREGADO')?.time

            const result: TrackingInfo = {
                id: order.codigo_visual ?? order.id,
                status,
                carrier: undefined as string | undefined,
                estimatedDelivery: order.fecha_entrega_solicitada ?? 'N/A',
                evidence: undefined as { photo?: string; signature?: string } | undefined,
                dates: { confirmed, shipped, delivered }
            }
            return result
        } catch (error) {
            if (isApiError(error) && error.status !== 0 && error.status !== 404) throw error

            const normalized = OrderService.normalizeOrder(order)
            const status: TrackingInfo['status'] =
                normalized.status === 'delivered' ? 'delivered' : normalized.status === 'shipped' ? 'shipped' : 'pending'

            const result: TrackingInfo = {
                id: normalized.codigo_visual ?? normalized.id,
                status,
                carrier: undefined as string | undefined,
                estimatedDelivery: normalized.fecha_entrega_solicitada ?? 'N/A',
                evidence: undefined as { photo?: string; signature?: string } | undefined,
                dates: {
                    confirmed: normalized.created_at,
                    shipped: normalized.estado_actual === 'EN_RUTA' || normalized.estado_actual === 'ENTREGADO' ? normalized.updated_at : undefined,
                    delivered: normalized.estado_actual === 'ENTREGADO' ? normalized.updated_at : undefined,
                }
            }
            return result
        }
    },

    getMyOrders: async (vendedorId: string, filters?: Omit<OrderFilters, 'vendedor_id'>): Promise<Order[]> => {
        return OrderService.getOrders({
            ...filters,
            vendedor_id: vendedorId
        })
    },

    getOrderById: async (orderId: string): Promise<Order> => {
        try {
            const order = await apiRequest<Order>(ordersEndpoint(endpoints.orders.orderById(orderId)), {
                method: 'GET'
            })
            return OrderService.normalizeOrder(order)
        } catch (error) {
            logErrorForDebugging(error, 'OrderService.getOrderById', { orderId })
            throw error
        }
    },

    getOrderDetails: async (orderId: string): Promise<OrderDetail[]> => {
        try {
            const detail = await apiRequest<{
                id: string
                detalles: { producto_id: string; cantidad: number; precio_unitario: number; subtotal: number }[]
                fecha_creacion?: string
            }>(ordersEndpoint(endpoints.orders.orderDetail(orderId)))

            const createdAt = detail.fecha_creacion ?? new Date().toISOString()
            const detalles = Array.isArray(detail.detalles) ? detail.detalles : []

            return detalles.map((item, index) => ({
                id: `${orderId}:${item.producto_id}:${index}`,
                pedido_id: orderId,
                producto_id: item.producto_id,
                cantidad: item.cantidad,
                es_bonificacion: false,
                precio_lista: item.precio_unitario,
                precio_final: item.precio_unitario,
                subtotal_linea: item.subtotal,
                created_at: createdAt,
                updated_at: createdAt,
            }))
        } catch (error) {
            logErrorForDebugging(error, 'OrderService.getOrderDetails', { orderId })
            throw error
        }
    },

    cancelOrder: async (orderId: string): Promise<Order> => {
        try {
            const cancelledOrder = await apiRequest<Order>(ordersEndpoint(endpoints.orders.orderCancel(orderId)), {
                method: 'PATCH'
            })
            return OrderService.normalizeOrder(cancelledOrder)
        } catch (error) {
            logErrorForDebugging(error, 'OrderService.cancelOrder', { orderId })
            throw error
        }
    },

    /**
     * Cambia el estado de un pedido
     * @param orderId - ID del pedido
     * @param newStatus - Nuevo estado
     * @param comentario - Comentario opcional sobre el cambio
     */
    changeOrderStatus: async (orderId: string, newStatus: OrderStatus, comentario?: string): Promise<Order> => {
        try {
            // Usar el endpoint correcto: /orders/estados/:orderId/state
            const updatedOrder = await apiRequest<Order>(ordersEndpoint(endpoints.orders.orderEstadosChangeState(orderId)), {
                method: 'PATCH',
                body: JSON.stringify({
                    nuevoEstado: newStatus,
                    comentario: comentario || `Cambio de estado a ${newStatus}`
                })
            })
            return OrderService.normalizeOrder(updatedOrder)
        } catch (error) {
            logErrorForDebugging(error, 'OrderService.changeOrderStatus', { orderId, newStatus, comentario })
            throw error
        }
    },

    /**
     * Obtiene el picking asociado a un pedido
     * @param orderId - ID del pedido
     * @returns Picking asociado o null si no existe
     */
    getOrderPicking: async (orderId: string): Promise<any | null> => {
        try {
            // Importación dinámica para evitar dependencia circular
            const { PickingService } = await import('./PickingService')

            // Buscar pickings del pedido
            const pickings = await PickingService.list()
            const orderPicking = pickings.find(p => p.pedidoId === orderId)

            return orderPicking || null
        } catch (error) {
            logErrorForDebugging(error, 'OrderService.getOrderPicking', { orderId })
            // No fallar si no se puede obtener el picking
            return null
        }
    },

    confirmPicking: async (orderId: string) => {
        await OrderService.changeOrderStatus(orderId, 'EN_PREPARACION')
    },

    confirmDispatch: async (orderId: string, _carrierId?: string, _guideNumber?: string) => {
        await OrderService.changeOrderStatus(orderId, 'EN_RUTA')
    },

    updateOrder: async (orderId: string, data: Partial<Order>): Promise<Order> => {
        if (typeof data.estado_actual === 'string') {
            return OrderService.changeOrderStatus(orderId, data.estado_actual as OrderStatus)
        }
        throw new Error('UPDATE_ORDER_NOT_SUPPORTED')
    },

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

    formatOrderDateShort: (dateString: string): string => {
        const date = new Date(dateString)
        const options: Intl.DateTimeFormatOptions = {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }
        return date.toLocaleDateString('es-EC', options)
    },

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

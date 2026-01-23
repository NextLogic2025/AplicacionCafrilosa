import { ApiService } from './ApiService'
import { env } from '../../config/env'
import { endpoints } from './endpoints'
import { isApiError } from './ApiError'
import { logErrorForDebugging } from '../../utils/errorMessages'
import { createService } from './createService'

const ordersEndpoint = (path: string) => `${env.api.ordersUrl}${path}`

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
    factura_numero?: string
    factura_id?: string
    url_pdf_factura?: string
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

export interface OrderFromCartOptions {
    condicion_pago?: PaymentMethod
    sucursal_id?: string
    ubicacion?: {
        lat: number
        lng: number
    }
}

export type PaymentMethod = 'CONTADO' | 'CREDITO' | 'TRANSFERENCIA' | 'CHEQUE'

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

const normalizeOrder = (order: Order): Order => {
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
}

const formatOrderDate = (dateString: string): string => {
    const date = new Date(dateString)
    const options: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }
    return date.toLocaleDateString('es-EC', options)
}

const formatOrderDateShort = (dateString: string): string => {
    const date = new Date(dateString)
    const options: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    }
    return date.toLocaleDateString('es-EC', options)
}

const getOrderStats = (orders: Order[]) => {
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

const fetchOrderDetailsFromApi = async (orderId: string): Promise<OrderDetail[]> => {
    const detail = await ApiService.get<{
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
}

const rawService = {
    normalizeOrder,
    createOrder: async (_payload: CreateOrderPayload): Promise<Order> => {
        void _payload
        throw new Error('CREATE_ORDER_NOT_SUPPORTED')
    },

    createOrderFromCart: async (
        target: { type: 'me' } | { type: 'client'; clientId: string },
        options?: OrderFromCartOptions
    ): Promise<Order> => {
        const endpoint =
            target.type === 'client'
                ? ordersEndpoint(endpoints.orders.orderFromCartClient(target.clientId))
                : ordersEndpoint(endpoints.orders.orderFromCartMe)

        const payload = {
            forma_pago_solicitada: options?.condicion_pago || 'CONTADO',
            ...(options?.sucursal_id && { sucursal_id: options.sucursal_id }),
            ...(options?.ubicacion && { ubicacion: options.ubicacion })
        }

        const order = await ApiService.post<Order>(endpoint, payload)
        return normalizeOrder(order)
    },

    setPaymentMethod: async (orderId: string, method: PaymentMethod): Promise<void> => {
        await ApiService.post(endpoints.orders.orderPaymentMethod(orderId), { metodo: method })
    },

    getOrderHistory: async (): Promise<Order[]> => {
        const orders = await ApiService.get<Order[]>(ordersEndpoint(endpoints.orders.ordersUserHistory))
        return orders
            .map(normalizeOrder)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    },

    getClientOrders: async (userId: string): Promise<Order[]> => {
        const orders = await ApiService.get<Order[]>(ordersEndpoint(endpoints.orders.ordersByClientId(userId)))
        return orders.map(normalizeOrder).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    },

    getOrders: async (filters?: OrderFilters): Promise<Order[]> => {
        const baseUrl = ordersEndpoint(endpoints.orders.orders)

        if (filters?.cliente_id && !filters.vendedor_id) {
            const orders = await rawService.getClientOrders(filters.cliente_id)
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
            const orders = await ApiService.get<Order[]>(url)
            return applyOrderFilters(orders.map(normalizeOrder), filters)
        } catch (error) {
            if (isApiError(error) && (error.status === 403 || error.status === 404)) {
                const orders = await ApiService.get<Order[]>(ordersEndpoint(endpoints.orders.ordersUserHistory))
                return applyOrderFilters(orders.map(normalizeOrder), filters)
            }
            logErrorForDebugging(error, 'OrderService.getOrders', { filters })
            throw error
        }
    },

    getOrdersByClient: async (clientId: string): Promise<Order[]> => {
        return rawService.getClientOrders(clientId)
    },

    getTrackingInfo: async (orderId?: string): Promise<TrackingInfo | null> => {
        if (!orderId) return null
        const order = await rawService.getOrderById(orderId)

        try {
            const tracking = await ApiService.get<{
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

            return {
                id: order.codigo_visual ?? order.id,
                status,
                carrier: undefined,
                estimatedDelivery: order.fecha_entrega_solicitada ?? 'N/A',
                evidence: undefined,
                dates: { confirmed, shipped, delivered }
            }
        } catch (error) {
            if (isApiError(error) && error.status !== 0 && error.status !== 404) throw error

            const normalized = normalizeOrder(order)
            const status: TrackingInfo['status'] =
                normalized.status === 'delivered' ? 'delivered' : normalized.status === 'shipped' ? 'shipped' : 'pending'

            return {
                id: normalized.codigo_visual ?? normalized.id,
                status,
                carrier: undefined,
                estimatedDelivery: normalized.fecha_entrega_solicitada ?? 'N/A',
                evidence: undefined,
                dates: {
                    confirmed: normalized.created_at,
                    shipped: normalized.estado_actual === 'EN_RUTA' || normalized.estado_actual === 'ENTREGADO' ? normalized.updated_at : undefined,
                    delivered: normalized.estado_actual === 'ENTREGADO' ? normalized.updated_at : undefined,
                }
            }
        }
    },

    getMyOrders: async (vendedorId: string, filters?: Omit<OrderFilters, 'vendedor_id'>): Promise<Order[]> => {
        return rawService.getOrders({
            ...filters,
            vendedor_id: vendedorId
        })
    },

    getOrderById: async (orderId: string): Promise<Order> => {
        const order = await ApiService.get<Order>(ordersEndpoint(endpoints.orders.orderById(orderId)))
        return normalizeOrder(order)
    },

    getOrderDetails: async (orderId: string): Promise<OrderDetail[]> => {
        return fetchOrderDetailsFromApi(orderId)
    },

    cancelOrder: async (orderId: string): Promise<Order> => {
        const cancelledOrder = await ApiService.patch<Order>(ordersEndpoint(endpoints.orders.orderCancel(orderId)), {})
        return normalizeOrder(cancelledOrder)
    },

    changeOrderStatus: async (orderId: string, newStatus: OrderStatus, comentario?: string): Promise<Order> => {
        const updatedOrder = await ApiService.patch<Order>(ordersEndpoint(endpoints.orders.orderEstadosChangeState(orderId)), {
            nuevoEstado: newStatus,
            comentario: comentario || `Cambio de estado a ${newStatus}`
        })
        return normalizeOrder(updatedOrder)
    },

    getOrderPicking: async (orderId: string): Promise<any | null> => {
        try {
            const { PickingService } = await import('./PickingService')
            const pickings = await PickingService.list()
            const orderPicking = pickings.find(p => p.pedidoId === orderId)
            return orderPicking || null
        } catch (error) {
            logErrorForDebugging(error, 'OrderService.getOrderPicking', { orderId })
            return null
        }
    },

    confirmPicking: async (orderId: string) => {
        await rawService.changeOrderStatus(orderId, 'EN_PREPARACION')
    },

    confirmDispatch: async (orderId: string) => {
        await rawService.changeOrderStatus(orderId, 'EN_RUTA')
    },

    updateOrder: async (orderId: string, data: Partial<Order>): Promise<Order> => {
        if (typeof data.estado_actual === 'string') {
            return rawService.changeOrderStatus(orderId, data.estado_actual as OrderStatus)
        }
        throw new Error('UPDATE_ORDER_NOT_SUPPORTED')
    },

    formatOrderDate,
    formatOrderDateShort,
    getOrderStats
}

export const OrderService = createService('OrderService', rawService)

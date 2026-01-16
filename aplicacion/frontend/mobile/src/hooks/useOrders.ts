import { useState, useEffect, useCallback } from 'react'
import { Order, OrderStatus, OrderService, OrderFilters } from '../services/api/OrderService'

interface UseOrdersOptions {
    autoFetch?: boolean
    filters?: OrderFilters
}

interface UseOrdersReturn {
    orders: Order[]
    loading: boolean
    error: string | null
    refresh: () => Promise<void>
    getOrderById: (id: string) => Promise<Order | null>
    cancelOrder: (id: string) => Promise<boolean>
    changeStatus: (id: string, status: OrderStatus) => Promise<boolean>
    stats: {
        total: number
        porEstado: Record<string, number>
        totalVentas: number
    }
}

export function useOrders(options: UseOrdersOptions = {}): UseOrdersReturn {
    const { autoFetch = true, filters } = options

    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)
            const data = await OrderService.getOrders(filters)
            setOrders(data)
        } catch (err) {
            setError('Error al cargar pedidos')
            console.error('useOrders fetch error:', err)
        } finally {
            setLoading(false)
        }
    }, [filters])

    const getOrderById = useCallback(async (id: string): Promise<Order | null> => {
        try {
            return await OrderService.getOrderById(id)
        } catch (err) {
            console.error('Error fetching order:', err)
            return null
        }
    }, [])

    const cancelOrder = useCallback(async (id: string): Promise<boolean> => {
        try {
            await OrderService.cancelOrder(id)
            setOrders(prev => prev.map(order =>
                order.id === id ? { ...order, estado_actual: 'ANULADO' } : order
            ))
            return true
        } catch (err) {
            console.error('Error cancelling order:', err)
            return false
        }
    }, [])

    const changeStatus = useCallback(async (id: string, status: OrderStatus): Promise<boolean> => {
        try {
            await OrderService.changeOrderStatus(id, status)
            setOrders(prev => prev.map(order =>
                order.id === id ? { ...order, estado_actual: status } : order
            ))
            return true
        } catch (err) {
            console.error('Error changing order status:', err)
            return false
        }
    }, [])

    useEffect(() => {
        if (autoFetch) {
            fetchOrders()
        }
    }, [autoFetch, fetchOrders])

    const stats = OrderService.getOrderStats(orders)

    return {
        orders,
        loading,
        error,
        refresh: fetchOrders,
        getOrderById,
        cancelOrder,
        changeStatus,
        stats
    }
}

export function useMyOrderHistory() {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)
            const data = await OrderService.getOrderHistory()
            setOrders(data)
        } catch (err) {
            setError('Error al cargar historial de pedidos')
            console.error('useMyOrderHistory error:', err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchOrders()
    }, [fetchOrders])

    return {
        orders,
        loading,
        error,
        refresh: fetchOrders,
        stats: OrderService.getOrderStats(orders)
    }
}

export function useOrderDetail(orderId: string | null) {
    const [order, setOrder] = useState<Order | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchOrder = useCallback(async () => {
        if (!orderId) return

        try {
            setLoading(true)
            setError(null)
            const data = await OrderService.getOrderById(orderId)
            setOrder(data)
        } catch (err) {
            setError('Error al cargar detalles del pedido')
            console.error('useOrderDetail error:', err)
        } finally {
            setLoading(false)
        }
    }, [orderId])

    useEffect(() => {
        fetchOrder()
    }, [fetchOrder])

    return {
        order,
        loading,
        error,
        refresh: fetchOrder
    }
}

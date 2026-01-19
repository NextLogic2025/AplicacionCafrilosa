import React, { useCallback, useState } from 'react'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { OrderListTemplate } from '../../../../components/orders/OrderListTemplate'
import { OrderService, Order } from '../../../../services/api/OrderService'
import { useCart } from '../../../../context/CartContext'

export function ClientOrdersScreen() {
    const navigation = useNavigation()
    const { currentClient } = useCart()
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    const fetchOrders = async () => {
        try {
            const data = await OrderService.getOrderHistory()
            setOrders(data)
        } catch (error) {
            console.error('Error fetching orders:', error)
            setOrders([])
        } finally {
            setLoading(false)
        }
    }

    const handleRefresh = async () => {
        setRefreshing(true)
        await fetchOrders()
        setRefreshing(false)
    }

    useFocusEffect(
        useCallback(() => {
            setLoading(true)
            fetchOrders()
            return () => { }
        }, [currentClient])
    )

    return (
        <OrderListTemplate
            roleType="cliente"
            orders={orders}
            loading={loading}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            onOrderPress={(orderId) => {
                ; (navigation.navigate as any)('OrderDetail', { orderId })
            }}
        />
    )
}

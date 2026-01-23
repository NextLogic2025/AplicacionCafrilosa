import React, { useState, useCallback } from 'react'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { OrderListTemplate } from '../../../../components/orders/OrderListTemplate'
import { OrderService, Order } from '../../../../services/api/OrderService'
import { ClientService, Client } from '../../../../services/api/ClientService'

export function SupervisorOrdersScreen() {
    const navigation = useNavigation<any>()
    const [loading, setLoading] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const [orders, setOrders] = useState<Order[]>([])
    const [clients, setClients] = useState<Client[]>([])

    useFocusEffect(
        useCallback(() => {
            loadOrders()
            loadClients()
        }, [])
    )

    const loadOrders = async () => {
        setLoading(true)
        try {
            const data = await OrderService.getOrders()
            setOrders(data)
        } catch (error) {
            console.error('Error loading orders:', error)
            setOrders([])
        } finally {
            setLoading(false)
        }
    }

    const loadClients = async () => {
        try {
            const data = await ClientService.getClients()
            setClients(data)
        } catch (error) {
            console.error('Error loading clients:', error)
        }
    }

    const handleRefresh = async () => {
        setRefreshing(true)
        await loadOrders()
        setRefreshing(false)
    }

    return (
        <OrderListTemplate
            roleType="supervisor"
            orders={orders}
            loading={loading}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            onOrderPress={(orderId) => navigation.navigate('SupervisorOrderDetail', { orderId })}
            showClientFilter={true}
            clients={clients}
        />
    )
}

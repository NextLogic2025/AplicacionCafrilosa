import React, { useState, useCallback } from 'react'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { OrderListTemplate } from '../../../../components/orders/OrderListTemplate'
import { OrderService, Order } from '../../../../services/api/OrderService'
import { ClientService, Client } from '../../../../services/api/ClientService'
import { SellerStackParamList } from '../../../../navigation/SellerNavigator'

export function SellerOrderHistoryScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<SellerStackParamList>>()
    const [loading, setLoading] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const [orders, setOrders] = useState<Order[]>([])
    const [clients, setClients] = useState<Client[]>([])

    useFocusEffect(
        useCallback(() => {
            setLoading(true)
            loadOrders()
            loadClients()
        }, [])
    )

    const loadClients = async () => {
        try {
            const data = await ClientService.getMyClients()
            setClients(data)
        } catch (error) {
            console.error('Error loading clients:', error)
        }
    }

    const loadOrders = async () => {
        try {
            const data = await OrderService.getOrderHistory()
            setOrders(data)
        } catch (error) {
            console.error('Error loading orders:', error)
            setOrders([])
        } finally {
            setLoading(false)
        }
    }

    const handleRefresh = async () => {
        setRefreshing(true)
        await loadOrders()
        setRefreshing(false)
    }

    return (
        <OrderListTemplate
            roleType="vendedor"
            orders={orders}
            loading={loading}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            onOrderPress={(orderId) => navigation.navigate('SellerOrderDetail', { orderId })}
            showClientFilter={true}
            clients={clients}
        />
    )
}

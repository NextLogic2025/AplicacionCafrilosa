import React, { useState, useEffect } from 'react'
import { Alert } from 'react-native'
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import { OrderDetailTemplate } from '../../../../components/orders/OrderDetailTemplate'
import { OrderService, Order } from '../../../../services/api/OrderService'

type OrderDetailRouteProp = RouteProp<{ params: { orderId: string } }, 'params'>

export function SellerOrderDetailScreen() {
    const navigation = useNavigation()
    const route = useRoute<OrderDetailRouteProp>()
    const { orderId } = route.params

    const [loading, setLoading] = useState(true)
    const [order, setOrder] = useState<Order | null>(null)

    useEffect(() => {
        loadOrderDetails()
    }, [orderId])

    const loadOrderDetails = async () => {
        setLoading(true)
        try {
            const orderData = await OrderService.getOrderById(orderId)
            setOrder(orderData)
        } catch (error) {
            console.error('Error loading order details:', error)
            Alert.alert(
                'Error',
                'No se pudo cargar el pedido',
                [
                    { text: 'Reintentar', onPress: loadOrderDetails },
                    { text: 'Volver', onPress: () => navigation.goBack() }
                ]
            )
        } finally {
            setLoading(false)
        }
    }

    return (
        <OrderDetailTemplate
            roleType="vendedor"
            order={order}
            orderDetails={order?.detalles || []}
            loading={loading}
            showTimeline={false}
            onBackPress={() => navigation.goBack()}
        />
    )
}

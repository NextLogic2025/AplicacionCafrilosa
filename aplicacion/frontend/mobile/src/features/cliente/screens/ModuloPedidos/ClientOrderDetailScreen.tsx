import React, { useEffect, useState } from 'react'
import { Alert } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { OrderDetailTemplate } from '../../../../components/orders/OrderDetailTemplate'
import { OrderService, Order } from '../../../../services/api/OrderService'

export function ClientOrderDetailScreen() {
    const navigation = useNavigation()
    const route = useRoute()
    const { orderId } = (route.params as any) || {}

    const [order, setOrder] = useState<Order | null>(null)
    const [loading, setLoading] = useState(true)
    const [cancelling, setCancelling] = useState(false)

    useEffect(() => {
        if (orderId) {
            loadOrder()
        }
    }, [orderId])

    const loadOrder = async () => {
        try {
            const data = await OrderService.getOrderById(orderId)
            setOrder(data || null)
        } catch (error) {
            console.error('Error cargando pedido:', error)
            Alert.alert('Error', 'No se pudo cargar el detalle del pedido')
        } finally {
            setLoading(false)
        }
    }

    const handleCancelOrder = async () => {
        if (!order) return

        Alert.alert(
            'Cancelar Pedido',
            '¿Estás seguro de que quieres cancelar este pedido? Esta acción no se puede deshacer.',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Sí, cancelar',
                    style: 'destructive',
                    onPress: async () => {
                        setCancelling(true)
                        try {
                            await OrderService.cancelOrder(order.id)
                            await loadOrder()
                            Alert.alert('Pedido cancelado', 'El pedido ha sido cancelado exitosamente.')
                        } catch (error: any) {
                            console.error('Error cancelando pedido:', error)
                            Alert.alert('Error', error.message || 'No se pudo cancelar el pedido')
                        } finally {
                            setCancelling(false)
                        }
                    }
                }
            ]
        )
    }

    return (
        <OrderDetailTemplate
            roleType="cliente"
            order={order}
            orderDetails={order?.detalles || []}
            loading={loading}
            showTimeline={true}
            actionButtons={[
                {
                    id: 'cancel',
                    label: 'Cancelar Pedido',
                    icon: 'close-circle',
                    variant: 'danger',
                    onPress: handleCancelOrder,
                    visible: order?.estado_actual === 'PENDIENTE',
                    loading: cancelling
                }
            ]}
            onBackPress={() => navigation.goBack()}
        />
    )
}

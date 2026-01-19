import React, { useState, useEffect } from 'react'
import { Alert } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { OrderDetailTemplate } from '../../../../components/orders/OrderDetailTemplate'
import { OrderStatusModal } from '../../../../components/ui/OrderStatusModal'
import { OrderService, Order, OrderStatus } from '../../../../services/api/OrderService'

const SUPERVISOR_ALLOWED_STATUSES: OrderStatus[] = [
    'APROBADO',
    'RECHAZADO'
]

export function SupervisorOrderDetailScreen() {
    const navigation = useNavigation()
    const route = useRoute()
    const { orderId } = (route.params as any) || {}

    const [loading, setLoading] = useState(true)
    const [order, setOrder] = useState<Order | null>(null)
    const [showStatusModal, setShowStatusModal] = useState(false)

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

    const handleChangeStatus = async (newStatus: OrderStatus) => {
        if (!order) return

        try {
            await OrderService.changeOrderStatus(order.id, newStatus)
            setShowStatusModal(false)
            Alert.alert('Éxito', 'Pedido actualizado correctamente')
            await loadOrderDetails()
        } catch (error) {
            console.error('Error changing status:', error)
            Alert.alert('Error', 'No se pudo cambiar el estado del pedido')
        }
    }

    return (
        <>
            <OrderDetailTemplate
                roleType="supervisor"
                order={order}
                orderDetails={order?.detalles || []}
                loading={loading}
                showTimeline={false}
                actionButtons={[
                    {
                        id: 'changeStatus',
                        label: 'Cambiar Estado del Pedido',
                        icon: 'swap-horizontal',
                        variant: 'primary',
                        onPress: () => setShowStatusModal(true),
                        visible: true
                    }
                ]}
                onBackPress={() => navigation.goBack()}
            />

            <OrderStatusModal
                visible={showStatusModal}
                order={order}
                allowedStatuses={SUPERVISOR_ALLOWED_STATUSES}
                onStatusChange={handleChangeStatus}
                onClose={() => setShowStatusModal(false)}
            />
        </>
    )
}

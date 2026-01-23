import React, { useState, useEffect } from 'react'
import { Alert } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { OrderDetailTemplate } from '../../../../components/orders/OrderDetailTemplate'
import { OrderService, Order, OrderStatus } from '../../../../services/api/OrderService'
import { getUserFriendlyMessage } from '../../../../utils/errorMessages'

export function WarehouseOrderDetailScreen() {
    const navigation = useNavigation()
    const route = useRoute()
    const { orderId } = (route.params as any) || {}

    const [loading, setLoading] = useState(true)
    const [order, setOrder] = useState<Order | null>(null)
    const [processing, setProcessing] = useState(false)

    useEffect(() => {
        if (orderId) {
            loadOrderDetails()
        }
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

    const handlePrepare = async () => {
        if (!order) return
        setProcessing(true)
        try {
            await OrderService.changeOrderStatus(order.id, 'EN_PREPARACION')
            Alert.alert('Listo', `Pedido #${order.codigo_visual} enviado a preparación.`)
            await loadOrderDetails()
        } catch (error) {
            console.error('Error preparando pedido:', error)
            Alert.alert('Error', getUserFriendlyMessage(error, 'UPDATE_ERROR'))
        } finally {
            setProcessing(false)
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
                actionButtons={
                    order && order.estado_actual === 'PENDIENTE'
                        ? [
                              {
                                  id: 'prepare',
                                  label: 'Preparar',
                                  icon: 'construct-outline',
                                  color: '#EF4444',
                                  variant: 'primary',
                                  onPress: handlePrepare,
                                  disabled: processing,
                                  loading: processing
                              }
                          ]
                        : undefined
                }
                onBackPress={() => navigation.goBack()}
            />
        </>
    )
}

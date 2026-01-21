import React, { useState, useCallback } from 'react'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { OrderListTemplate } from '../../../../components/orders/OrderListTemplate'
import { OrderStatusModal } from '../../../../components/ui/OrderStatusModal'
import { FeedbackModal, type FeedbackType } from '../../../../components/ui/FeedbackModal'
import { OrderService, Order, OrderStatus } from '../../../../services/api/OrderService'
import { ClientService, Client } from '../../../../services/api/ClientService'
import { getUserFriendlyMessage } from '../../../../utils/errorMessages'
import { BRAND_COLORS } from '../../../../shared/types'

const SUPERVISOR_ALLOWED_STATUSES: OrderStatus[] = [
    'APROBADO',
    'RECHAZADO'
]

export function SupervisorOrdersScreen() {
    const navigation = useNavigation<any>()
    const [loading, setLoading] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const [changingStatus, setChangingStatus] = useState(false)
    const [orders, setOrders] = useState<Order[]>([])
    const [clients, setClients] = useState<Client[]>([])

    const [showStatusModal, setShowStatusModal] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

    const [feedbackModal, setFeedbackModal] = useState<{
        visible: boolean
        type: FeedbackType
        title: string
        message: string
    }>({
        visible: false,
        type: 'info',
        title: '',
        message: ''
    })

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

    const handleChangeStatus = (order: Order) => {
        setSelectedOrder(order)
        setShowStatusModal(true)
    }

    const confirmStatusChange = async (newStatus: OrderStatus) => {
        if (!selectedOrder) return

        setChangingStatus(true)
        try {
            await OrderService.changeOrderStatus(selectedOrder.id, newStatus)
            setShowStatusModal(false)
            setSelectedOrder(null)

            // Mostrar mensaje apropiado según el estado
            let message = `Pedido #${selectedOrder.codigo_visual} actualizado a ${newStatus}`
            if (newStatus === 'APROBADO') {
                message = `Pedido #${selectedOrder.codigo_visual} aprobado exitosamente. Se creará automáticamente una orden de picking para bodega.`
            } else if (newStatus === 'RECHAZADO') {
                message = `Pedido #${selectedOrder.codigo_visual} rechazado.`
            }

            setFeedbackModal({
                visible: true,
                type: 'success',
                title: 'Estado Actualizado',
                message
            })

            await loadOrders()
        } catch (error) {
            console.error('Error changing status:', error)
            setFeedbackModal({
                visible: true,
                type: 'error',
                title: 'Error al Cambiar Estado',
                message: getUserFriendlyMessage(error, 'UPDATE_ERROR')
            })
        } finally {
            setChangingStatus(false)
        }
    }

    return (
        <>
            <OrderListTemplate
                roleType="supervisor"
                orders={orders}
                loading={loading}
                refreshing={refreshing}
                onRefresh={handleRefresh}
                onOrderPress={(orderId) => navigation.navigate('SupervisorOrderDetail', { orderId })}
                showClientFilter={true}
                clients={clients}
                actionButtons={[
                    {
                        id: 'changeStatus',
                        label: 'Cambiar Estado',
                        icon: 'swap-horizontal',
                        color: BRAND_COLORS.red
                    }
                ]}
                onActionPress={(order) => handleChangeStatus(order)}
            />

            <OrderStatusModal
                visible={showStatusModal}
                order={selectedOrder}
                allowedStatuses={SUPERVISOR_ALLOWED_STATUSES}
                onStatusChange={confirmStatusChange}
                onClose={() => setShowStatusModal(false)}
                isProcessing={changingStatus}
            />

            <FeedbackModal
                visible={feedbackModal.visible}
                type={feedbackModal.type}
                title={feedbackModal.title}
                message={feedbackModal.message}
                onClose={() => setFeedbackModal(prev => ({ ...prev, visible: false }))}
            />
        </>
    )
}

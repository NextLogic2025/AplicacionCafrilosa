import React, { useState, useCallback, useMemo } from 'react'
import { View } from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'

import { Header } from '../../../../components/ui/Header'
import { DashboardCard } from '../../../../components/ui/DashboardCard'
import { GenericTabs } from '../../../../components/ui/GenericTabs'
import { GenericList } from '../../../../components/ui/GenericList'
import { FeedbackModal, type FeedbackType } from '../../../../components/ui/FeedbackModal'
import { OrderService, Order, OrderDetail } from '../../../../services/api/OrderService'
import { PickingService } from '../../../../services/api/PickingService'
import { BRAND_COLORS } from '../../../../shared/types'
import { getUserFriendlyMessage } from '../../../../utils/errorMessages'
import { OrderCard, ActionButton } from '../../../../components/ui/OrderCard'

type TabKey = 'disponibles' | 'mis-ordenes'

const TABS: { key: TabKey; label: string }[] = [
    { key: 'disponibles', label: 'Disponibles' },
    { key: 'mis-ordenes', label: 'Mis Pedidos' }
]

export function WarehouseOrdersScreen() {
    const navigation = useNavigation<any>()
    const [activeTab, setActiveTab] = useState<TabKey>('disponibles')
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(false)
    const [processingOrderId, setProcessingOrderId] = useState<string | null>(null)
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

    const stats = useMemo(() => ({
        total: orders.length,
        disponibles: orders.filter(o => o.estado_actual === 'APROBADO').length,
        enPreparacion: orders.filter(o => o.estado_actual === 'EN_PREPARACION').length
    }), [orders])

    const loadOrders = useCallback(async () => {
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
    }, [])

    useFocusEffect(
        useCallback(() => {
            loadOrders()
        }, [loadOrders])
    )

    const getDetails = async (order: Order): Promise<OrderDetail[]> => {
        if (order.detalles && order.detalles.length > 0) {
            return order.detalles
        }
        const orderDetails = await OrderService.getOrderById(order.id)
        return orderDetails.detalles || []
    }

    const handlePrepareOrder = async (order: Order) => {
        setProcessingOrderId(order.id)
        try {
            const details = await getDetails(order)
            await OrderService.changeOrderStatus(order.id, 'EN_PREPARACION')

            const pickingItems = details
                .map(d => ({
                    productoId: d.producto_id,
                    cantidad: typeof d.cantidad === 'number'
                        ? d.cantidad
                        : Number(d.cantidad ?? d.cantidad_solicitada ?? d.subtotal_linea ?? 0)
                }))
                .filter(item => item.productoId && Number(item.cantidad) > 0)
                .map(item => ({
                    productoId: item.productoId,
                    cantidadSolicitada: Number(item.cantidad)
                }))

            let pickingCreated = null
            let pickingError: unknown = null
            if (pickingItems.length) {
                try {
                    pickingCreated = await PickingService.create({
                        pedidoId: order.id,
                        items: pickingItems
                    })
                } catch (err) {
                    console.error('Picking creation failed:', err)
                    pickingError = err
                }
            }

            if (pickingError) {
                setFeedbackModal({
                    visible: true,
                    type: 'error',
                    title: 'Preparación incompleta',
                    message: `Pedido #${order.codigo_visual} está en preparación, pero no se pudo crear el picking. ${getUserFriendlyMessage(pickingError, 'UPDATE_ERROR')}`
                })
            } else {
                const pickingMsg = pickingCreated ? ` Se generó el picking ${pickingCreated.id.slice(0, 8).toUpperCase()}.` : ''
                setFeedbackModal({
                    visible: true,
                    type: 'success',
                    title: 'Pedido en preparación',
                    message: `Pedido #${order.codigo_visual} ahora está en preparación.${pickingMsg}`
                })
            }

            await loadOrders()
            setActiveTab('mis-ordenes')
        } catch (error) {
            console.error('Error preparando pedido:', error)
            setFeedbackModal({
                visible: true,
                type: 'error',
                title: 'No se pudo preparar',
                message: getUserFriendlyMessage(error, 'UPDATE_ERROR')
            })
        } finally {
            setProcessingOrderId(null)
        }
    }

    const renderActionButtons = (order: Order): ActionButton[] | undefined => {
        if (!['APROBADO', 'PENDIENTE'].includes(order.estado_actual)) return undefined
        return [
            {
                id: 'prepare',
                label: 'Preparar',
                icon: 'construct-outline',
                onPress: () => handlePrepareOrder(order),
                variant: 'primary',
                color: BRAND_COLORS.red,
                loading: processingOrderId === order.id,
                disabled: processingOrderId === order.id
            }
        ]
    }

    const ordersByTab = useMemo<Record<TabKey, Order[]>>(() => ({
        disponibles: orders.filter(o => o.estado_actual !== 'EN_PREPARACION' && o.estado_actual !== 'PREPARADO'),
        'mis-ordenes': orders.filter(o => o.estado_actual === 'EN_PREPARACION' || o.estado_actual === 'PREPARADO')
    }), [orders])

    const currentOrders = ordersByTab[activeTab]

    const emptyState = activeTab === 'disponibles'
        ? {
            icon: 'layers-outline',
            title: 'Sin pedidos disponibles',
            message: 'No hay pedidos aprobados para preparar en este momento.'
        }
        : {
            icon: 'person-outline',
            title: 'Sin pedidos en preparación',
            message: 'No tienes pedidos en preparación. Marca uno como "Preparar" desde Disponibles.'
        }

    const renderOrderItem = (order: Order) => (
        <View className="px-5 mb-3">
            <OrderCard
                order={order}
                onPress={() => navigation.navigate('WarehouseOrderDetail', { orderId: order.id })}
                showClientInfo
                actionButtons={renderActionButtons(order)}
            />
        </View>
    )

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Gestión de Pedidos" variant="standard" />

            <View className="mx-4 mt-4">
                <View className="flex-row justify-between mb-4">
                    <DashboardCard
                        label="Totales"
                        value={stats.total}
                        icon="layers"
                        color="#525252"
                        columns={3}
                    />
                    <DashboardCard
                        label="Disponibles"
                        value={stats.disponibles}
                        icon="clipboard-outline"
                        color="#D97706"
                        columns={3}
                    />
                    <DashboardCard
                        label="En preparación"
                        value={stats.enPreparacion}
                        icon="sync-outline"
                        color="#7C3AED"
                        columns={3}
                    />
                </View>
            </View>

            <GenericTabs
                tabs={TABS}
                activeTab={activeTab}
                onTabChange={(key) => setActiveTab(key as TabKey)}
            />

            <GenericList
                items={currentOrders}
                isLoading={loading}
                onRefresh={loadOrders}
                emptyState={emptyState}
                renderItem={renderOrderItem}
            />

            <FeedbackModal
                visible={feedbackModal.visible}
                type={feedbackModal.type}
                title={feedbackModal.title}
                message={feedbackModal.message}
                onClose={() => setFeedbackModal((prev) => ({ ...prev, visible: false }))}
            />
        </View>
    )
}

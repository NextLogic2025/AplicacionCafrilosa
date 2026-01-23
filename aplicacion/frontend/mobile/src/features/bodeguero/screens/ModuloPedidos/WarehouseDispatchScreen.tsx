import React, { useMemo, useState, useCallback } from 'react'
import { View, Text, ActivityIndicator, TextInput } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useFocusEffect } from '@react-navigation/native'

import { Header } from '../../../../components/ui/Header'
import { SearchBar } from '../../../../components/ui/SearchBar'
import { GenericList } from '../../../../components/ui/GenericList'
import { StatusBadge } from '../../../../components/ui/StatusBadge'
import { PrimaryButton } from '../../../../components/ui/PrimaryButton'
import { FeedbackModal, type FeedbackType } from '../../../../components/ui/FeedbackModal'
import { DashboardCard } from '../../../../components/ui/DashboardCard'
import { OrderService, type Order } from '../../../../services/api/OrderService'

export function WarehouseDispatchScreen() {
    const navigation = useNavigation<any>()
    const [loading, setLoading] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)
    const [orders, setOrders] = useState<Order[]>([])
    const [search, setSearch] = useState('')
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [showDispatchModal, setShowDispatchModal] = useState(false)
    const [carrierName, setCarrierName] = useState('')
    const [guideNumber, setGuideNumber] = useState('')
    const [feedback, setFeedback] = useState<{ visible: boolean; type: FeedbackType; title: string; message: string }>({
        visible: false,
        type: 'info',
        title: '',
        message: '',
    })

    const loadOrders = useCallback(async () => {
        setLoading(true)
        try {
            const allOrders = await OrderService.getOrders()
            // Solo pedidos EN_PREPARACION (listos para despachar)
            // Una vez despachados (EN_RUTA), ya no aparecen aquí
            const dispatchOrders = allOrders.filter(o => o.estado_actual === 'EN_PREPARACION')
            setOrders(dispatchOrders)
        } catch (error) {
            console.error('Error loading orders:', error)
            setOrders([])
            setFeedback({
                visible: true,
                type: 'error',
                title: 'Error al cargar',
                message: 'No se pudieron cargar los pedidos para despacho.',
            })
        } finally {
            setLoading(false)
        }
    }, [])

    useFocusEffect(
        useCallback(() => {
            loadOrders()
            return () => { }
        }, [loadOrders]),
    )

    const filteredOrders = useMemo(() => {
        if (!search) return orders

        const term = search.toLowerCase()
        return orders.filter(order => {
            const code = String(order.codigo_visual || order.numero || '').toLowerCase()
            const idMatch = order.id.toLowerCase().includes(term)
            const nameMatch = (order.clientName || order.cliente?.nombre_comercial || order.cliente?.razon_social || '')
                .toLowerCase()
                .includes(term)
            return code.includes(term) || idMatch || nameMatch
        })
    }, [orders, search])

    const totals = useMemo(() => {
        const totalValue = orders.reduce((sum, o) => {
            const val = Number(o.total_final || o.total || 0)
            return sum + (Number.isFinite(val) ? val : 0)
        }, 0)
        const totalItems = orders.reduce((sum, o) => sum + (o.detalles?.length || 0), 0)
        return {
            pedidos: orders.length,
            items: totalItems,
            valor: Number.isFinite(totalValue) ? totalValue : 0,
        }
    }, [orders])

    const handleOpenDispatchModal = (order: Order) => {
        setSelectedOrder(order)
        setCarrierName('')
        setGuideNumber('')
        setShowDispatchModal(true)
    }

    const handleConfirmDispatch = async () => {
        if (!selectedOrder) return
        setActionLoading(true)
        try {
            // Cambiar estado a EN_RUTA
            await OrderService.confirmDispatch(selectedOrder.id, carrierName, guideNumber)

            setFeedback({
                visible: true,
                type: 'success',
                title: 'Despacho Confirmado',
                message: 'El pedido ha sido enviado y está en ruta de entrega.',
            })

            // Recargar lista (el pedido ya no aparecerá porque ahora es EN_RUTA)
            await loadOrders()
        } catch (error) {
            setFeedback({
                visible: true,
                type: 'error',
                title: 'Error',
                message: 'No se pudo confirmar el despacho.',
            })
        } finally {
            setActionLoading(false)
            setSelectedOrder(null)
            setShowDispatchModal(false)
        }
    }

    const formatOrderTitle = (order: Order) => {
        if (order.codigo_visual) return `Pedido #${order.codigo_visual}`
        if (order.numero) return `Pedido #${order.numero}`
        return `Pedido #${order.id.slice(0, 8).toUpperCase()}`
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        return date.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    }

    const getClientName = (order: Order) => {
        return order.clientName || order.cliente?.nombre_comercial || order.cliente?.razon_social || 'Cliente'
    }

    const getClientAddress = (order: Order) => {
        return order.address || order.observaciones_entrega || 'Sin dirección especificada'
    }

    return (
        <View className="flex-1 bg-neutral-50">
            <Header
                title="Despachos"
                variant="standard"
                onBackPress={() => navigation.goBack()}
            />

            {/* KPIs */}
            <View className="mx-4 mt-4">
                <View className="flex-row justify-between">
                    <DashboardCard
                        label="Por Despachar"
                        value={totals.pedidos}
                        icon="cube"
                        color="#2563EB"
                        columns={3}
                    />
                    <DashboardCard
                        label="Productos"
                        value={totals.items}
                        icon="layers"
                        color="#7C3AED"
                        columns={3}
                    />
                    <DashboardCard
                        label="Valor Total"
                        value={`$${totals.valor.toFixed(0)}`}
                        icon="cash"
                        color="#059669"
                        columns={3}
                    />
                </View>
            </View>

            {/* Search */}
            <View className="bg-white px-5 pb-4 pt-4 border-b border-neutral-100 mt-4">
                <SearchBar
                    placeholder="Buscar por código, cliente..."
                    value={search}
                    onChangeText={setSearch}
                    onClear={() => setSearch('')}
                />
            </View>

            {/* Lista de Pedidos */}
            <GenericList
                items={filteredOrders}
                isLoading={loading}
                onRefresh={loadOrders}
                emptyState={{
                    icon: 'send-outline',
                    title: 'Sin pedidos para despachar',
                    message: 'Cuando verifiques y envíes pickings a despacho, los pedidos aparecerán aquí.',
                }}
                renderItem={(order) => {
                    const clientName = getClientName(order)
                    const address = getClientAddress(order)
                    const itemsCount = order.itemsCount ?? order.detalles?.length ?? 0
                    const totalValue = Number(order.total ?? order.total_final ?? 0)
                    const totalLabel = Number.isFinite(totalValue) ? `$${totalValue.toFixed(2)}` : '$0.00'

                    return (
                        <View
                            className="bg-white rounded-2xl border border-neutral-100 overflow-hidden mb-3"
                            style={{ elevation: 2 }}
                        >
                            {/* Header */}
                            <View className="p-4">
                                <View className="flex-row items-start justify-between">
                                    <View className="flex-row items-center flex-1">
                                        <View
                                            className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                                            style={{ backgroundColor: '#DBEAFE' }}
                                        >
                                            <Ionicons name="cube-outline" size={24} color="#2563EB" />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-base font-bold text-neutral-900">
                                                {formatOrderTitle(order)}
                                            </Text>
                                            <Text className="text-xs text-neutral-500 mt-0.5">
                                                {formatDate(order.created_at)}
                                            </Text>
                                        </View>
                                    </View>
                                    <StatusBadge
                                        label="Listo"
                                        variant="info"
                                        size="sm"
                                    />
                                </View>

                                {/* Client Info */}
                                <View className="mt-3 bg-neutral-50 rounded-xl p-3">
                                    <View className="flex-row items-center mb-2">
                                        <Ionicons name="person-outline" size={16} color="#525252" />
                                        <Text className="text-sm font-semibold text-neutral-800 ml-2">
                                            {clientName}
                                        </Text>
                                    </View>
                                    <View className="flex-row items-start">
                                        <Ionicons name="location-outline" size={16} color="#737373" style={{ marginTop: 2 }} />
                                        <Text className="text-xs text-neutral-600 ml-2 flex-1" numberOfLines={2}>
                                            {address}
                                        </Text>
                                    </View>
                                </View>

                                {/* Order Info */}
                                <View className="mt-3 flex-row items-center">
                                    <View className="bg-neutral-100 px-3 py-1.5 rounded-lg mr-2">
                                        <Text className="text-xs font-semibold text-neutral-700">
                                            {itemsCount} {itemsCount === 1 ? 'producto' : 'productos'}
                                        </Text>
                                    </View>
                                    <View className="bg-green-50 px-3 py-1.5 rounded-lg">
                                        <Text className="text-xs font-bold text-green-700">
                                            {totalLabel}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Action */}
                            <View className="px-4 pb-4">
                                <PrimaryButton
                                    title="Confirmar Despacho"
                                    onPress={() => handleOpenDispatchModal(order)}
                                />
                            </View>
                        </View>
                    )
                }}
            />

            {/* Modal de Despacho */}
            <FeedbackModal
                visible={showDispatchModal && selectedOrder !== null}
                type="info"
                title="Confirmar Despacho"
                message=""
                showCancel
                cancelText="Cancelar"
                confirmText={actionLoading ? 'Enviando...' : 'Confirmar Salida'}
                onClose={() => {
                    setSelectedOrder(null)
                    setShowDispatchModal(false)
                }}
                onConfirm={handleConfirmDispatch}
            >
                <View className="mb-4">
                    <Text className="text-sm text-neutral-600 mb-4">
                        Al confirmar, el pedido pasará a estado "En Ruta" y saldrá de esta lista.
                    </Text>

                    <View className="mb-3">
                        <Text className="text-xs font-semibold text-neutral-700 mb-1.5">
                            Transportista (opcional)
                        </Text>
                        <TextInput
                            className="bg-neutral-100 rounded-xl px-4 py-3 text-sm text-neutral-900"
                            placeholder="Nombre del transportista"
                            placeholderTextColor="#A3A3A3"
                            value={carrierName}
                            onChangeText={setCarrierName}
                        />
                    </View>

                    <View>
                        <Text className="text-xs font-semibold text-neutral-700 mb-1.5">
                            Número de Guía (opcional)
                        </Text>
                        <TextInput
                            className="bg-neutral-100 rounded-xl px-4 py-3 text-sm text-neutral-900"
                            placeholder="Ej: GUIA-001"
                            placeholderTextColor="#A3A3A3"
                            value={guideNumber}
                            onChangeText={setGuideNumber}
                        />
                    </View>
                </View>
            </FeedbackModal>

            {/* Feedback Modal */}
            <FeedbackModal
                visible={feedback.visible}
                type={feedback.type}
                title={feedback.title}
                message={feedback.message}
                onClose={() => setFeedback(prev => ({ ...prev, visible: false }))}
            />

            {/* Loading Overlay */}
            {actionLoading && (
                <View className="absolute inset-0 bg-black/20 items-center justify-center">
                    <View className="bg-white rounded-2xl p-6 items-center">
                        <ActivityIndicator size="large" color="#DC2626" />
                        <Text className="text-sm text-neutral-600 mt-3">Procesando...</Text>
                    </View>
                </View>
            )}
        </View>
    )
}

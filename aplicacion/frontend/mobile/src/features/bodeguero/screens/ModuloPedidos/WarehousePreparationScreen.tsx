import React, { useMemo, useState } from 'react'
import { View, Text, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useFocusEffect } from '@react-navigation/native'

import { Header } from '../../../../components/ui/Header'
import { SearchBar } from '../../../../components/ui/SearchBar'
import { CategoryFilter } from '../../../../components/ui/CategoryFilter'
import { GenericList } from '../../../../components/ui/GenericList'
import { StatusBadge } from '../../../../components/ui/StatusBadge'
import { PrimaryButton } from '../../../../components/ui/PrimaryButton'
import { FeedbackModal, type FeedbackType } from '../../../../components/ui/FeedbackModal'
import { KpiCard } from '../../../../components/ui/KpiCard'
import { OrderService, type Order } from '../../../../services/api/OrderService'

type FilterId = 'all' | 'APROBADO' | 'EN_PREPARACION'

const STATUS_FILTERS: { id: FilterId; name: string }[] = [
    { id: 'all', name: 'Todos' },
    { id: 'APROBADO', name: 'Aprobados' },
    { id: 'EN_PREPARACION', name: 'En Preparacion' },
]

const STATUS_CONFIG: Record<string, { label: string; variant: 'info' | 'warning' | 'success' | 'error' }> = {
    APROBADO: { label: 'Aprobado', variant: 'info' },
    EN_PREPARACION: { label: 'En Preparacion', variant: 'warning' },
    EN_RUTA: { label: 'En Ruta', variant: 'info' },
    ENTREGADO: { label: 'Entregado', variant: 'success' },
    ANULADO: { label: 'Anulado', variant: 'error' },
    RECHAZADO: { label: 'Rechazado', variant: 'error' },
    PENDIENTE: { label: 'Pendiente', variant: 'warning' },
}

export function WarehousePreparationScreen() {
    const navigation = useNavigation<any>()
    const [loading, setLoading] = useState(false)
    const [orders, setOrders] = useState<Order[]>([])
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<FilterId>('all')
    const [confirmOrder, setConfirmOrder] = useState<Order | null>(null)
    const [feedback, setFeedback] = useState<{ visible: boolean; type: FeedbackType; title: string; message: string }>({
        visible: false,
        type: 'info',
        title: '',
        message: '',
    })

    const loadOrders = async () => {
        setLoading(true)
        try {
            const allOrders = await OrderService.getOrders()
            setOrders(allOrders)
        } catch (error) {
            setOrders([])
            setFeedback({
                visible: true,
                type: 'error',
                title: 'No se pudo cargar',
                message: 'Revisa tu conexion e intenta de nuevo.',
            })
        } finally {
            setLoading(false)
        }
    }

    useFocusEffect(
        React.useCallback(() => {
            loadOrders()
            return () => {}
        }, []),
    )

    const relevantOrders = useMemo(
        () => orders.filter((o) => o.estado_actual === 'APROBADO' || o.estado_actual === 'EN_PREPARACION'),
        [orders],
    )

    const filteredOrders = useMemo(() => {
        const base = statusFilter === 'all' ? relevantOrders : relevantOrders.filter((o) => o.estado_actual === statusFilter)
        if (!search) return base
        const term = search.toLowerCase()
        return base.filter((order) => {
            const code = String(order.codigo_visual || order.numero || '').toLowerCase()
            const idMatch = order.id.toLowerCase().includes(term)
            const nameMatch = (order.clientName || order.cliente?.nombre_comercial || order.cliente?.razon_social || '')
                .toLowerCase()
                .includes(term)
            return code.includes(term) || idMatch || nameMatch
        })
    }, [relevantOrders, search, statusFilter])

    const totals = useMemo(() => {
        const aprobados = relevantOrders.filter((o) => o.estado_actual === 'APROBADO').length
        const enPreparacion = relevantOrders.filter((o) => o.estado_actual === 'EN_PREPARACION').length
        return {
            total: relevantOrders.length,
            aprobados,
            enPreparacion,
        }
    }, [relevantOrders])

    const handleConfirm = async () => {
        if (!confirmOrder) return
        setLoading(true)
        try {
            await OrderService.confirmPicking(confirmOrder.id)
            setFeedback({
                visible: true,
                type: 'success',
                title: 'Pedido actualizado',
                message: 'El pedido paso a estado En Preparacion.',
            })
            await loadOrders()
        } catch (error) {
            setFeedback({
                visible: true,
                type: 'error',
                title: 'No se pudo actualizar',
                message: 'Intenta nuevamente mas tarde.',
            })
        } finally {
            setLoading(false)
            setConfirmOrder(null)
        }
    }

    const formatOrderTitle = (order: Order) => {
        if (order.codigo_visual) return `Pedido #${order.codigo_visual}`
        if (order.numero) return `Pedido #${order.numero}`
        return `Pedido #${order.id.slice(0, 8).toUpperCase()}`
    }

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Preparacion" variant="standard" onBackPress={() => navigation.goBack()} />

            <View className="mx-4 mt-4">
                <View className="flex-row justify-between">
                    <KpiCard label="Total" value={totals.total} icon="layers-outline" color="#DC2626" columns={3} />
                    <KpiCard label="Aprobados" value={totals.aprobados} icon="checkmark-circle-outline" color="#2563EB" columns={3} />
                    <KpiCard label="En Preparacion" value={totals.enPreparacion} icon="cube-outline" color="#D97706" columns={3} />
                </View>
            </View>

            <View className="bg-white px-5 pb-4 pt-4 border-b border-neutral-100">
                <SearchBar
                    placeholder="Buscar por codigo, cliente o ID..."
                    value={search}
                    onChangeText={setSearch}
                    onClear={() => setSearch('')}
                />
                <View className="-mx-5 mt-3">
                    <CategoryFilter categories={STATUS_FILTERS} selectedId={statusFilter} onSelect={(id) => setStatusFilter(id as FilterId)} />
                </View>
            </View>

            <GenericList
                items={filteredOrders}
                isLoading={loading}
                onRefresh={loadOrders}
                emptyState={{
                    icon: 'cube-outline',
                    title: 'Sin pedidos para preparar',
                    message: 'Los pedidos aprobados apareceran aqui cuando pasen a preparacion.',
                }}
                renderItem={(order) => {
                    const status = STATUS_CONFIG[order.estado_actual] || { label: order.estado_actual, variant: 'neutral' as const }
                    const clientName = order.clientName || order.cliente?.nombre_comercial || order.cliente?.razon_social || 'Cliente'
                    const itemsCount = order.itemsCount ?? order.detalles?.length ?? 0
                    const totalValue = Number(order.total ?? order.total_final ?? 0)
                    const totalLabel = Number.isFinite(totalValue) ? totalValue.toFixed(2) : '0.00'
                    const canConfirm = order.estado_actual === 'APROBADO'

                    return (
                        <View className="bg-white rounded-2xl border border-neutral-100 overflow-hidden mb-3" style={{ elevation: 2 }}>
                            <View className="p-4">
                                <View className="flex-row items-start justify-between">
                                    <View className="flex-row items-center flex-1">
                                        <View className="w-12 h-12 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: '#FEF3C7' }}>
                                            <Ionicons name="cube-outline" size={24} color="#D97706" />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-base font-bold text-neutral-900">{formatOrderTitle(order)}</Text>
                                            <Text className="text-xs text-neutral-500 mt-0.5">
                                                {OrderService.formatOrderDateShort(order.created_at)}
                                            </Text>
                                        </View>
                                    </View>
                                    <StatusBadge label={status.label} variant={status.variant} size="sm" />
                                </View>

                                <View className="mt-3">
                                    <Text className="text-sm font-semibold text-neutral-800">{clientName}</Text>
                                    <Text className="text-xs text-neutral-500 mt-1">
                                        {itemsCount} {itemsCount === 1 ? 'producto' : 'productos'} - Total ${totalLabel}
                                    </Text>
                                </View>
                            </View>

                            {canConfirm ? (
                                <View className="px-4 pb-4">
                                    <PrimaryButton title="Enviar a Preparacion" onPress={() => setConfirmOrder(order)} loading={loading} />
                                </View>
                            ) : (
                                <View className="px-4 pb-4">
                                    <Pressable className="bg-neutral-100 rounded-xl py-3 items-center" disabled>
                                        <Text className="text-sm font-semibold text-neutral-500">En Preparacion</Text>
                                    </Pressable>
                                </View>
                            )}
                        </View>
                    )
                }}
            />

            <FeedbackModal
                visible={confirmOrder !== null}
                type="warning"
                title="Enviar a Preparacion"
                message="Al confirmar, el pedido pasara a estado En Preparacion."
                showCancel
                cancelText="Volver"
                confirmText="Confirmar"
                onClose={() => setConfirmOrder(null)}
                onConfirm={handleConfirm}
            />

            <FeedbackModal
                visible={feedback.visible}
                type={feedback.type}
                title={feedback.title}
                message={feedback.message}
                onClose={() => setFeedback((prev) => ({ ...prev, visible: false }))}
            />
        </View>
    )
}

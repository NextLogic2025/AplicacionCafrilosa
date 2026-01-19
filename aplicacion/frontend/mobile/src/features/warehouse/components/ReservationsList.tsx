import React, { useMemo, useState, useCallback } from 'react'
import { View, Text, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { Header } from '../../../components/ui/Header'
import { GenericList } from '../../../components/ui/GenericList'
import { FeedbackModal } from '../../../components/ui/FeedbackModal'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { CategoryFilter } from '../../../components/ui/CategoryFilter'
import { ReservationService, type Reservation, type ReservationItem } from '../../../services/api/ReservationService'
import { usePolling } from '../../../hooks/useRealtimeSync'

type Props = {
    title?: string
    onBack?: () => void
    onCreate?: () => void
    onOpen?: (reservationId: string) => void
    refreshToken?: number
}

const formatDate = (dateStr?: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

// Formatear cantidad - mostrar entero si es número redondo, sino 2 decimales
const formatQuantity = (qty: number | undefined | null): string => {
    if (qty === undefined || qty === null || !Number.isFinite(qty)) return '0'
    const num = Number(qty)
    return num % 1 === 0 ? num.toFixed(0) : num.toFixed(2)
}

const getStatusConfig = (status: Reservation['status']) => {
    const configs = {
        ACTIVE: { label: 'Pendiente', variant: 'warning' as const, icon: 'time-outline' as const },
        CONFIRMED: { label: 'Confirmada', variant: 'success' as const, icon: 'checkmark-circle-outline' as const },
        CANCELLED: { label: 'Cancelada', variant: 'error' as const, icon: 'close-circle-outline' as const },
    }
    return configs[status] || configs.ACTIVE
}

export function ReservationsList({ title = 'Reservas de Stock', onBack, onCreate, onOpen, refreshToken }: Props) {
    const [status, setStatus] = useState<string>('ACTIVE')
    const [loading, setLoading] = useState(false)
    const [reservations, setReservations] = useState<Reservation[]>([])
    const [detailModal, setDetailModal] = useState<{ visible: boolean; reservation?: Reservation }>({
        visible: false,
    })

    const loadData = useCallback(async () => {
        try {
            const data = await ReservationService.list()
            setReservations(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error('Error loading reservations:', error)
        }
    }, [])

    const loadDataWithLoading = useCallback(async () => {
        setLoading(true)
        try {
            await loadData()
        } finally {
            setLoading(false)
        }
    }, [loadData])

    // Polling cada 5 segundos para sincronización en tiempo real
    usePolling(loadData, 5000, true)

    React.useEffect(() => {
        loadDataWithLoading()
    }, [status, refreshToken, loadDataWithLoading])

    const filters = useMemo(
        () => [
            { id: 'ACTIVE', name: 'Pendientes' },
            { id: 'CONFIRMED', name: 'Confirmadas' },
            { id: 'CANCELLED', name: 'Canceladas' },
            { id: 'all', name: 'Todas' },
        ],
        [],
    )

    const filtered = useMemo(() => {
        let base = reservations
        if (status !== 'all') base = base.filter((r) => r.status === status)
        return base
    }, [reservations, status])

    // Helper para obtener el nombre del producto
    const getItemName = (item: ReservationItem) => {
        return item.nombreProducto || item.sku || `Producto ${item.productId?.slice(0, 8) || ''}`
    }

    // Helper para obtener info del cliente
    const getClientInfo = (reservation: Reservation) => {
        if (reservation.pedido?.clienteNombre) {
            return reservation.pedido.clienteNombre
        }
        if (reservation.pedido?.numero) {
            return `Pedido #${reservation.pedido.numero}`
        }
        return null
    }

    const totalItems = (reservation: Reservation): number => {
        if (!reservation.items || reservation.items.length === 0) return 0
        return reservation.items.reduce((acc, item) => {
            const qty = Number(item.quantity) || 0
            return acc + qty
        }, 0)
    }

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title={title} variant="standard" onBackPress={onBack} />

            <View className="bg-white px-4 pb-2 pt-2 border-b border-neutral-100">
                <CategoryFilter categories={filters} selectedId={status} onSelect={(id) => setStatus(String(id))} />
            </View>

            <GenericList
                items={filtered}
                isLoading={loading}
                onRefresh={loadDataWithLoading}
                emptyState={{
                    icon: 'layers-outline',
                    title: status === 'ACTIVE' ? 'Sin Reservas Pendientes' : 'Sin Reservas',
                    message: 'Las reservas se generan automaticamente cuando un cliente o vendedor realiza un pedido.',
                }}
                renderItem={(item) => {
                    const statusConfig = getStatusConfig(item.status)
                    const itemCount = item.items?.length || 0
                    const totalQty = totalItems(item)
                    const clientInfo = getClientInfo(item)

                    return (
                        <Pressable
                            onPress={() => setDetailModal({ visible: true, reservation: item })}
                            className="bg-white rounded-2xl border border-neutral-100 overflow-hidden mb-3"
                            style={{ elevation: 2 }}
                        >
                            <View className="p-4">
                                <View className="flex-row items-start justify-between">
                                    <View className="flex-row items-center flex-1">
                                        <View
                                            className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                                            style={{ backgroundColor: item.status === 'ACTIVE' ? '#FEF3C7' : item.status === 'CONFIRMED' ? '#D1FAE5' : '#FEE2E2' }}
                                        >
                                            <Ionicons
                                                name={statusConfig.icon}
                                                size={24}
                                                color={item.status === 'ACTIVE' ? '#D97706' : item.status === 'CONFIRMED' ? '#059669' : '#DC2626'}
                                            />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-base font-bold text-neutral-900">
                                                {item.pedido?.numero
                                                    ? `Pedido #${item.pedido.numero}`
                                                    : `Reserva #${item.id.slice(0, 8).toUpperCase()}`}
                                            </Text>
                                            {clientInfo && (
                                                <Text className="text-sm text-neutral-600 mt-0.5" numberOfLines={1}>
                                                    {clientInfo}
                                                </Text>
                                            )}
                                            <Text className="text-xs text-neutral-400 mt-0.5">
                                                {formatDate(item.createdAt)}
                                            </Text>
                                        </View>
                                    </View>
                                    <StatusBadge label={statusConfig.label} variant={statusConfig.variant} size="sm" />
                                </View>

                                <View className="flex-row mt-3 gap-2">
                                    <View className="flex-row items-center bg-neutral-100 px-3 py-1.5 rounded-full">
                                        <Ionicons name="cube-outline" size={14} color="#6B7280" />
                                        <Text className="text-xs font-semibold text-neutral-600 ml-1">
                                            {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
                                        </Text>
                                    </View>
                                    <View className="flex-row items-center bg-neutral-100 px-3 py-1.5 rounded-full">
                                        <Ionicons name="layers-outline" size={14} color="#6B7280" />
                                        <Text className="text-xs font-semibold text-neutral-600 ml-1">
                                            {formatQuantity(totalQty)} unidades
                                        </Text>
                                    </View>
                                </View>

                                {item.items && item.items.length > 0 && (
                                    <View className="mt-3 pt-3 border-t border-neutral-100">
                                        {item.items.slice(0, 2).map((it, idx) => (
                                            <View key={idx} className="flex-row items-center justify-between py-1">
                                                <Text className="text-sm text-neutral-700 flex-1" numberOfLines={1}>
                                                    {getItemName(it)}
                                                </Text>
                                                <Text className="text-sm font-semibold text-neutral-900 ml-2">
                                                    x{formatQuantity(it.quantity)}
                                                </Text>
                                            </View>
                                        ))}
                                        {item.items.length > 2 && (
                                            <Text className="text-xs text-neutral-400 mt-1">
                                                +{item.items.length - 2} más...
                                            </Text>
                                        )}
                                    </View>
                                )}
                            </View>

                        </Pressable>
                    )
                }}
            />

            <FeedbackModal
                visible={detailModal.visible}
                type="info"
                title={
                    detailModal.reservation?.pedido?.numero
                        ? `Pedido #${detailModal.reservation.pedido.numero}`
                        : `Reserva #${detailModal.reservation?.id?.slice(0, 8).toUpperCase() || ''}`
                }
                message={
                    detailModal.reservation?.items?.length
                        ? detailModal.reservation.items
                              .map((item, idx) => `${idx + 1}. ${getItemName(item)} - Cantidad: ${formatQuantity(item.quantity)}`)
                              .join('\n')
                        : 'No hay productos en esta reserva.'
                }
                onClose={() => setDetailModal({ visible: false })}
                confirmText="Cerrar"
            />
        </View>
    )
}

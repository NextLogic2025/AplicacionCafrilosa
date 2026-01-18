import React, { useMemo, useState } from 'react'
import { View, Text, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { Header } from '../../../components/ui/Header'
import { SearchBar } from '../../../components/ui/SearchBar'
import { CategoryFilter } from '../../../components/ui/CategoryFilter'
import { GenericList } from '../../../components/ui/GenericList'
import { FeedbackModal, type FeedbackType } from '../../../components/ui/FeedbackModal'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { ReservationService, type Reservation } from '../../../services/api/ReservationService'
import { getUserFriendlyMessage } from '../../../utils/errorMessages'
import { BRAND_COLORS } from '../../../shared/types'

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

const getStatusConfig = (status: Reservation['status']) => {
    const configs = {
        ACTIVE: { label: 'Pendiente', variant: 'warning' as const, icon: 'time-outline' as const },
        CONFIRMED: { label: 'Confirmada', variant: 'success' as const, icon: 'checkmark-circle-outline' as const },
        CANCELLED: { label: 'Cancelada', variant: 'error' as const, icon: 'close-circle-outline' as const },
    }
    return configs[status] || configs.ACTIVE
}

export function ReservationsList({ title = 'Reservas de Stock', onBack, onCreate, onOpen, refreshToken }: Props) {
    const [search, setSearch] = useState('')
    const [status, setStatus] = useState<string>('ACTIVE')
    const [loading, setLoading] = useState(false)
    const [reservations, setReservations] = useState<Reservation[]>([])
    const [modalState, setModalState] = useState<{ visible: boolean; type: FeedbackType; title: string; message: string }>({
        visible: false,
        type: 'info',
        title: '',
        message: '',
    })
    const [confirmModal, setConfirmModal] = useState<{ visible: boolean; mode: 'confirm' | 'cancel'; id?: string }>({
        visible: false,
        mode: 'confirm',
    })
    const [detailModal, setDetailModal] = useState<{ visible: boolean; reservation?: Reservation }>({
        visible: false,
    })

    const loadData = async () => {
        setLoading(true)
        try {
            const data = await ReservationService.list()
            setReservations(Array.isArray(data) ? data : [])
        } catch (error) {
            setReservations([])
        } finally {
            setLoading(false)
        }
    }

    React.useEffect(() => {
        loadData()
    }, [status, refreshToken])

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
        if (!search) return base
        const term = search.toLowerCase()
        return base.filter((r) => [r.id, r.tempId].filter(Boolean).some((v) => String(v).toLowerCase().includes(term)))
    }, [reservations, search, status])

    const handleCancel = (id: string) => {
        setConfirmModal({ visible: true, mode: 'cancel', id })
    }

    const handleConfirm = (id: string) => {
        setConfirmModal({ visible: true, mode: 'confirm', id })
    }

    const executeAction = async (mode: 'confirm' | 'cancel', id?: string) => {
        if (!id) return
        setConfirmModal((prev) => ({ ...prev, visible: false }))
        setLoading(true)
        try {
            if (mode === 'confirm') {
                await ReservationService.confirm(id)
                setModalState({ visible: true, type: 'success', title: 'Reserva Confirmada', message: 'El picking ha sido generado automaticamente. El bodeguero puede comenzar a preparar el pedido.' })
            } else {
                await ReservationService.cancel(id)
                setModalState({ visible: true, type: 'success', title: 'Reserva Cancelada', message: 'El stock ha sido liberado y esta disponible nuevamente.' })
            }
            await loadData()
        } catch (error) {
            setModalState({
                visible: true,
                type: 'error',
                title: mode === 'confirm' ? 'Error al Confirmar' : 'Error al Cancelar',
                message: getUserFriendlyMessage(error, mode === 'confirm' ? 'UPDATE_ERROR' : 'DELETE_ERROR'),
            })
        } finally {
            setLoading(false)
        }
    }

    const totalItems = (reservation: Reservation) => {
        return reservation.items?.reduce((acc, item) => acc + item.quantity, 0) || 0
    }

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title={title} variant="standard" onBackPress={onBack} />

            <View className="bg-white px-4 pb-4 pt-4 border-b border-neutral-100">
                <SearchBar
                    placeholder="Buscar por ID de reserva..."
                    value={search}
                    onChangeText={setSearch}
                    onClear={() => setSearch('')}
                />
                <View className="-mx-4 mt-3">
                    <CategoryFilter categories={filters} selectedId={status} onSelect={(id) => setStatus(String(id))} />
                </View>
            </View>

            <GenericList
                items={filtered}
                isLoading={loading}
                onRefresh={loadData}
                emptyState={{
                    icon: 'layers-outline',
                    title: status === 'ACTIVE' ? 'Sin Reservas Pendientes' : 'Sin Reservas',
                    message: 'Las reservas se generan automaticamente cuando un cliente o vendedor realiza un pedido.',
                }}
                renderItem={(item) => {
                    const statusConfig = getStatusConfig(item.status)
                    const itemCount = item.items?.length || 0
                    const totalQty = totalItems(item)

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
                                                Reserva #{item.id.slice(0, 8).toUpperCase()}
                                            </Text>
                                            <Text className="text-xs text-neutral-500 mt-0.5">
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
                                            {totalQty} unidades
                                        </Text>
                                    </View>
                                </View>

                                {item.items && item.items.length > 0 && (
                                    <View className="mt-3 pt-3 border-t border-neutral-100">
                                        {item.items.slice(0, 2).map((it, idx) => (
                                            <View key={idx} className="flex-row items-center justify-between py-1">
                                                <Text className="text-sm text-neutral-700 flex-1" numberOfLines={1}>
                                                    {it.sku || `Producto ${idx + 1}`}
                                                </Text>
                                                <Text className="text-sm font-semibold text-neutral-900 ml-2">
                                                    x{it.quantity}
                                                </Text>
                                            </View>
                                        ))}
                                        {item.items.length > 2 && (
                                            <Text className="text-xs text-neutral-400 mt-1">
                                                +{item.items.length - 2} mas...
                                            </Text>
                                        )}
                                    </View>
                                )}
                            </View>

                            {item.status === 'ACTIVE' && (
                                <View className="flex-row border-t border-neutral-100">
                                    <Pressable
                                        className="flex-1 flex-row items-center justify-center py-3 border-r border-neutral-100"
                                        onPress={() => handleCancel(item.id)}
                                    >
                                        <Ionicons name="close-circle-outline" size={18} color="#6B7280" />
                                        <Text className="text-sm font-semibold text-neutral-600 ml-2">Cancelar</Text>
                                    </Pressable>
                                    <Pressable
                                        className="flex-1 flex-row items-center justify-center py-3"
                                        style={{ backgroundColor: '#059669' }}
                                        onPress={() => handleConfirm(item.id)}
                                    >
                                        <Ionicons name="checkmark-circle" size={18} color="#fff" />
                                        <Text className="text-sm font-bold text-white ml-2">Confirmar</Text>
                                    </Pressable>
                                </View>
                            )}
                        </Pressable>
                    )
                }}
            />

            <FeedbackModal
                visible={modalState.visible}
                type={modalState.type}
                title={modalState.title}
                message={modalState.message}
                onClose={() => setModalState((prev) => ({ ...prev, visible: false }))}
            />

            <FeedbackModal
                visible={confirmModal.visible}
                type="warning"
                title={confirmModal.mode === 'confirm' ? 'Confirmar Reserva' : 'Cancelar Reserva'}
                message={
                    confirmModal.mode === 'confirm'
                        ? 'Al confirmar, se generara automaticamente una orden de picking para que el bodeguero prepare los productos.'
                        : 'Al cancelar, el stock reservado sera liberado y estara disponible para otros pedidos.'
                }
                showCancel
                cancelText="Volver"
                confirmText={confirmModal.mode === 'confirm' ? 'Si, Confirmar' : 'Si, Cancelar'}
                onClose={() => setConfirmModal((prev) => ({ ...prev, visible: false }))}
                onConfirm={() => executeAction(confirmModal.mode, confirmModal.id)}
            />

            <FeedbackModal
                visible={detailModal.visible}
                type="info"
                title={`Reserva #${detailModal.reservation?.id?.slice(0, 8).toUpperCase() || ''}`}
                message={
                    detailModal.reservation?.items?.length
                        ? detailModal.reservation.items
                              .map((item, idx) => `${idx + 1}. ${item.sku || 'Producto'} - Cantidad: ${item.quantity}`)
                              .join('\n')
                        : 'No hay productos en esta reserva.'
                }
                onClose={() => setDetailModal({ visible: false })}
                confirmText="Cerrar"
            />
        </View>
    )
}

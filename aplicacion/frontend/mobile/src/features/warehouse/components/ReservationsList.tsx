import React, { useMemo, useState } from 'react'
import { View, Text, Pressable } from 'react-native'

import { Header } from '../../../components/ui/Header'
import { SearchBar } from '../../../components/ui/SearchBar'
import { CategoryFilter } from '../../../components/ui/CategoryFilter'
import { GenericList } from '../../../components/ui/GenericList'
import { FeedbackModal, type FeedbackType } from '../../../components/ui/FeedbackModal'
import { ReservationService, type Reservation } from '../../../services/api/ReservationService'
import { getUserFriendlyMessage } from '../../../utils/errorMessages'

type Props = {
    title?: string
    onBack?: () => void
    onCreate?: () => void
    onOpen?: (reservationId: string) => void
    refreshToken?: number
}

export function ReservationsList({ title = 'Reservas', onBack, onCreate, onOpen, refreshToken }: Props) {
    const [search, setSearch] = useState('')
    const [status, setStatus] = useState<string>('ACTIVE')
    const [loading, setLoading] = useState(false)
    const [reservations, setReservations] = useState<Reservation[]>([])
    const [infoMessage, setInfoMessage] = useState<string>('')
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
    const [detailModal, setDetailModal] = useState<{ visible: boolean; title: string; message: string }>({
        visible: false,
        title: '',
        message: '',
    })

    const loadData = async () => {
        setLoading(true)
        try {
            const data = await ReservationService.list()
            setReservations(Array.isArray(data) ? data : [])
            setInfoMessage('')
        } catch (error) {
            setReservations([])
            setInfoMessage('Las reservas se generan automaticamente al aprobar pedidos.')
        } finally {
            setLoading(false)
        }
    }

    React.useEffect(() => {
        loadData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status, refreshToken])

    const filters = useMemo(
        () => [
            { id: 'ACTIVE', name: 'Activas' },
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
                setModalState({ visible: true, type: 'success', title: 'Reserva confirmada', message: 'Se generara el picking.' })
            } else {
                await ReservationService.cancel(id)
                setModalState({ visible: true, type: 'success', title: 'Reserva cancelada', message: 'Stock liberado.' })
            }
            await loadData()
        } catch (error) {
            setModalState({
                visible: true,
                type: 'error',
                title: mode === 'confirm' ? 'No se pudo confirmar' : 'No se pudo cancelar',
                message: getUserFriendlyMessage(error, mode === 'confirm' ? 'UPDATE_ERROR' : 'DELETE_ERROR'),
            })
        } finally {
            setLoading(false)
        }
    }

    const openDetails = (reservation: Reservation) => {
        if (!reservation.items?.length) {
            setDetailModal({
                visible: true,
                title: 'Detalle de reserva',
                message: 'No hay items vinculados en esta reserva.',
            })
            return
        }

        const message = reservation.items
            .map((item, index) => {
                const label = item.sku || 'Producto'
                const ubic = item.stockUbicacionId ? ` • Ubicación: ${String(item.stockUbicacionId).slice(0, 8)}` : ''
                return `${index + 1}) ${label} • Cantidad: ${item.quantity}${ubic}`
            })
            .join('\n')

        setDetailModal({
            visible: true,
            title: 'Detalle de reserva',
            message,
        })
    }

    const renderStatusBadge = (value: Reservation['status']) => {
        const map = {
            ACTIVE: { text: 'Activo', bg: '#E8FFF3', color: '#16A34A' },
            CONFIRMED: { text: 'Confirmada', bg: '#EEF2FF', color: '#4338CA' },
            CANCELLED: { text: 'Cancelada', bg: '#FEF2F2', color: '#B91C1C' },
        } as const
        const conf = map[value] || map.ACTIVE
        return (
            <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: conf.bg }}>
                <Text className="text-[10px] font-bold uppercase" style={{ color: conf.color }}>
                    {conf.text}
                </Text>
            </View>
        )
    }

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title={title} variant="standard" onBackPress={onBack} />

            <View className="bg-white px-5 pb-4 pt-5 border-b border-neutral-100 shadow-sm shadow-black/5">
                <View className="flex-row items-center gap-3">
                    <SearchBar
                        placeholder="Buscar reserva..."
                        value={search}
                        onChangeText={setSearch}
                        onClear={() => setSearch('')}
                        style={{ flex: 1 }}
                    />
                </View>
                <View className="-mx-5 mt-3">
                    <CategoryFilter categories={filters} selectedId={status} onSelect={(id) => setStatus(String(id))} />
                </View>
            </View>

            <GenericList
                items={filtered}
                isLoading={loading}
                onRefresh={loadData}
                emptyState={{
                    icon: 'cube-outline',
                    title: 'Sin reservas',
                    message: infoMessage || 'Las reservas se generan automaticamente al aprobar pedidos.',
                }}
                renderItem={(item) => {
                    const preview =
                        item.items && item.items.length
                            ? item.items
                                  .slice(0, 2)
                                  .map((it) => `${it.sku || 'Producto'} • ${it.quantity}`)
                                  .join(' · ')
                            : 'Sin items disponibles'

                    return (
                        <View className="bg-white rounded-2xl p-4 border border-neutral-100 shadow-sm mb-3">
                            <View className="flex-row items-start">
                                <View className="w-11 h-11 rounded-xl bg-neutral-50 items-center justify-center mr-3 border border-neutral-100">
                                    <Text className="text-neutral-400 font-black text-lg">R</Text>
                                </View>
                                <View className="flex-1">
                                    <View className="flex-row justify-between items-start">
                                        <Text className="text-base font-bold text-neutral-900">
                                            {`Reserva ${item.id.slice(0, 6)}`}
                                        </Text>
                                        {renderStatusBadge(item.status)}
                                    </View>
                                    <Text className="text-xs text-neutral-500 mt-1" numberOfLines={1}>
                                        {item.tempId ? `Temp: ${item.tempId}` : 'Generada automaticamente'}
                                    </Text>
                                    <Text className="text-sm text-neutral-700 mt-2" numberOfLines={2}>
                                        {preview}
                                    </Text>
                                </View>
                            </View>

                            <View className="flex-row mt-3 justify-end gap-2">
                                <Pressable
                                    className="px-3 py-2 rounded-full bg-neutral-100"
                                    onPress={() => openDetails(item)}
                                >
                                    <Text className="text-xs font-semibold text-neutral-700">Ver detalle</Text>
                                </Pressable>
                                {item.status === 'ACTIVE' ? (
                                    <>
                                        <Pressable
                                            className="px-3 py-2 rounded-full bg-emerald-500"
                                            onPress={() => handleConfirm(item.id)}
                                        >
                                            <Text className="text-xs font-semibold text-white">Confirmar</Text>
                                        </Pressable>
                                        <Pressable
                                            className="px-3 py-2 rounded-full bg-neutral-100 border border-neutral-200"
                                            onPress={() => handleCancel(item.id)}
                                        >
                                            <Text className="text-xs font-semibold text-neutral-700">Cancelar</Text>
                                        </Pressable>
                                    </>
                                ) : null}
                            </View>
                        </View>
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
                title={confirmModal.mode === 'confirm' ? 'Confirmar reserva' : 'Cancelar reserva'}
                message={
                    confirmModal.mode === 'confirm'
                        ? 'Se generara el picking asociado. Deseas continuar?'
                        : 'Se liberara el stock reservado. Deseas continuar?'
                }
                showCancel
                cancelText="No"
                confirmText={confirmModal.mode === 'confirm' ? 'Confirmar' : 'Cancelar'}
                onClose={() => setConfirmModal((prev) => ({ ...prev, visible: false }))}
                onConfirm={() => executeAction(confirmModal.mode, confirmModal.id)}
            />

            <FeedbackModal
                visible={detailModal.visible}
                type="info"
                title={detailModal.title}
                message={detailModal.message}
                onClose={() => setDetailModal({ visible: false, title: '', message: '' })}
                confirmText="Cerrar"
            />
        </View>
    )
}

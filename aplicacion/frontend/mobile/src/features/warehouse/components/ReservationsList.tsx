import React, { useMemo, useState } from 'react'
import { View, Pressable, Alert } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'

import { Header } from '../../../components/ui/Header'
import { SearchBar } from '../../../components/ui/SearchBar'
import { CategoryFilter } from '../../../components/ui/CategoryFilter'
import { GenericList } from '../../../components/ui/GenericList'
import { GenericItemCard } from '../../../components/ui/GenericItemCard'
import { FeedbackModal, type FeedbackType } from '../../../components/ui/FeedbackModal'
import { BRAND_COLORS } from '../../../shared/types'
import { type Reservation } from '../../../services/api/ReservationService'
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
    const [modalState, setModalState] = useState<{ visible: boolean; type: FeedbackType; title: string; message: string }>({
        visible: false,
        type: 'info',
        title: '',
        message: '',
    })

    const loadData = async () => {
        setLoading(true)
        try {
            const data = await ReservationService.list()
            setReservations(Array.isArray(data) ? data : [])
        } catch (error) {
            setModalState({
                visible: true,
                type: 'error',
                title: 'No se pudo cargar',
                message: getUserFriendlyMessage(error, 'LOAD_ERROR'),
            })
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
        Alert.alert('Cancelar reserva', 'Se liberara el stock reservado. Continuar?', [
            { text: 'No', style: 'cancel' },
            {
                text: 'Si, cancelar',
                style: 'destructive',
                onPress: async () => {
                    setLoading(true)
                    try {
                        await ReservationService.cancel(id)
                        setModalState({ visible: true, type: 'success', title: 'Reserva cancelada', message: 'Stock liberado.' })
                        await loadData()
                    } catch (error) {
                        setModalState({
                            visible: true,
                            type: 'error',
                            title: 'No se pudo cancelar',
                            message: getUserFriendlyMessage(error, 'DELETE_ERROR'),
                        })
                    } finally {
                        setLoading(false)
                    }
                },
            },
        ])
    }

    const handleConfirm = (id: string) => {
        Alert.alert('Confirmar reserva', 'Se generara el picking asociado. Continuar?', [
            { text: 'No', style: 'cancel' },
            {
                text: 'Confirmar',
                onPress: async () => {
                    setLoading(true)
                    try {
                        await ReservationService.confirm(id)
                        setModalState({ visible: true, type: 'success', title: 'Reserva confirmada', message: 'Se generara el picking.' })
                        await loadData()
                    } catch (error) {
                        setModalState({
                            visible: true,
                            type: 'error',
                            title: 'No se pudo confirmar',
                            message: getUserFriendlyMessage(error, 'UPDATE_ERROR'),
                        })
                    } finally {
                        setLoading(false)
                    }
                },
            },
        ])
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
                    {onCreate ? (
                        <Pressable
                            onPress={onCreate}
                            className="rounded-2xl shadow-md shadow-black/15"
                            style={{ width: 52, height: 52, overflow: 'hidden' }}
                        >
                            <LinearGradient
                                colors={[BRAND_COLORS.red, (BRAND_COLORS as any).red700 || BRAND_COLORS.red]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                            >
                                <Ionicons name="add" size={26} color="#fff" />
                            </LinearGradient>
                        </Pressable>
                    ) : null}
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
                    message: 'Crea una reserva para bloquear stock.',
                }}
                renderItem={(item) => (
                    <GenericItemCard
                        title={`Reserva ${item.id.slice(0, 6)}`}
                        subtitle={item.tempId ? `Temp: ${item.tempId}` : `Estado: ${item.status}`}
                        subtitleLabel={item.status}
                        isActive={item.status === 'ACTIVE'}
                        placeholderIcon="lock-closed-outline"
                        onPress={() => onOpen?.(item.id)}
                        onDelete={item.status === 'ACTIVE' ? () => handleCancel(item.id) : undefined}
                        style={{ borderColor: '#E2E8F0', borderWidth: 1.2 }}
                    />
                )}
            />

            <FeedbackModal
                visible={modalState.visible}
                type={modalState.type}
                title={modalState.title}
                message={modalState.message}
                onClose={() => setModalState((prev) => ({ ...prev, visible: false }))}
            />
        </View>
    )
}

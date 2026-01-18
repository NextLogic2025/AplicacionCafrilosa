import React, { useMemo, useState } from 'react'
import { View, Pressable } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'

import { Header } from '../../../components/ui/Header'
import { SearchBar } from '../../../components/ui/SearchBar'
import { CategoryFilter } from '../../../components/ui/CategoryFilter'
import { GenericList } from '../../../components/ui/GenericList'
import { GenericItemCard } from '../../../components/ui/GenericItemCard'
import { FeedbackModal, type FeedbackType } from '../../../components/ui/FeedbackModal'
import { PickingService, type Picking } from '../../../services/api/PickingService'
import { getUserFriendlyMessage } from '../../../utils/errorMessages'
import { BRAND_COLORS } from '../../../shared/types'

type Props = {
    title?: string
    mine?: boolean
    onBack?: () => void
    onCreate?: () => void
    onOpen?: (id: string) => void
    refreshToken?: number
}

export function PickingList({ title = 'Pickings', mine = false, onBack, onCreate, onOpen, refreshToken }: Props) {
    const [search, setSearch] = useState('')
    const [estado, setEstado] = useState<string>('all')
    const [loading, setLoading] = useState(false)
    const [items, setItems] = useState<Picking[]>([])
    const [modalState, setModalState] = useState<{ visible: boolean; type: FeedbackType; title: string; message: string }>({
        visible: false,
        type: 'info',
        title: '',
        message: '',
    })

    const loadData = async () => {
        setLoading(true)
        try {
            const data = mine
                ? await PickingService.listMine()
                : await PickingService.list(estado !== 'all' ? estado : undefined)
            setItems(Array.isArray(data) ? data : [])
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
    }, [estado, refreshToken])

    const filters = useMemo(
        () => [
            { id: 'all', name: 'Todos' },
            { id: 'PENDIENTE', name: 'Pendientes' },
            { id: 'EN_PROCESO', name: 'En proceso' },
            { id: 'COMPLETADO', name: 'Completados' },
        ],
        [],
    )

    const filtered = useMemo(() => {
        if (!search) return items
        const term = search.toLowerCase()
        return items.filter((i) =>
            [i.id, i.pedidoId, i.estado]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(term)),
        )
    }, [items, search])

    const estadoLabel = (val?: string) => {
        if (val === 'PENDIENTE') return 'Pendiente'
        if (val === 'EN_PROCESO') return 'En proceso'
        if (val === 'COMPLETADO') return 'Completado'
        return val || 'N/D'
    }

    const estadoColor = (val?: string) => {
        if (val === 'COMPLETADO') return { bg: '#ECFDF3', text: '#16A34A' }
        if (val === 'EN_PROCESO') return { bg: '#FEF3C7', text: '#D97706' }
        return { bg: '#EFF6FF', text: '#2563EB' }
    }

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title={title} variant="standard" onBackPress={onBack} />

            <View className="bg-white px-5 pb-4 pt-5 border-b border-neutral-100 shadow-sm shadow-black/5">
                <View className="flex-row items-center gap-3">
                    <SearchBar
                        placeholder="Buscar picking..."
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
                    <CategoryFilter categories={filters} selectedId={estado} onSelect={(id) => setEstado(String(id))} />
                </View>
            </View>

            <GenericList
                items={filtered}
                isLoading={loading}
                onRefresh={loadData}
                emptyState={{
                    icon: 'cube-outline',
                    title: 'Sin pickings',
                    message: mine ? 'No tienes pickings asignados.' : 'Crea un picking para empezar.',
                }}
                renderItem={(item) => {
                    const colors = estadoColor(item.estado)
                    return (
                        <GenericItemCard
                            title={`Picking #${item.id?.slice(0, 6) || 'N/A'}`}
                            subtitle={item.pedidoId ? `Pedido: ${item.pedidoId}` : 'Sin pedido'}
                            subtitleLabel={estadoLabel(item.estado)}
                            isActive={item.estado !== 'COMPLETADO'}
                            placeholderIcon="clipboard-outline"
                            onPress={() => onOpen?.(item.id)}
                            style={{ borderColor: '#E2E8F0', borderWidth: 1.2 }}
                        />
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
        </View>
    )
}

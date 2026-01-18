import React, { useMemo, useState } from 'react'
import { View, Pressable, Text } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'

import { Header } from '../../../components/ui/Header'
import { SearchBar } from '../../../components/ui/SearchBar'
import { CategoryFilter } from '../../../components/ui/CategoryFilter'
import { GenericList } from '../../../components/ui/GenericList'
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
                    message: mine
                        ? 'No tienes pickings asignados. Se asignan al confirmar una reserva o por un supervisor.'
                        : 'Crea o confirma una reserva para generar pickings.',
                }}
                renderItem={(item) => {
                    const colors = estadoColor(item.estado)
                    const linesText =
                        item.items && item.items.length
                            ? `${item.items.length} ${item.items.length === 1 ? 'linea' : 'lineas'}`
                            : 'Sin lineas'
                    return (
                        <Pressable
                            onPress={() => onOpen?.(item.id)}
                            className="bg-white rounded-2xl p-4 border border-neutral-100 shadow-sm mb-3"
                            style={{ elevation: 2, borderColor: '#E2E8F0' }}
                        >
                            <View className="flex-row items-start">
                                <View className="w-11 h-11 rounded-xl bg-neutral-50 items-center justify-center mr-3 border border-neutral-100">
                                    <Ionicons name="clipboard-outline" size={22} color="#94A3B8" />
                                </View>
                                <View className="flex-1">
                                    <View className="flex-row justify-between items-start">
                                        <View className="flex-1 pr-2">
                                            <Text className="text-base font-bold text-neutral-900">
                                                {`Picking ${item.id?.slice(0, 6) || 'N/D'}`}
                                            </Text>
                                            <Text className="text-xs text-neutral-500 mt-1" numberOfLines={1}>
                                                {item.pedidoId ? `Pedido: ${item.pedidoId}` : 'Sin pedido vinculado'}
                                            </Text>
                                        </View>
                                        <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: colors.bg }}>
                                            <Text className="text-[10px] font-bold uppercase" style={{ color: colors.text }}>
                                                {estadoLabel(item.estado)}
                                            </Text>
                                        </View>
                                    </View>
                                    <View className="flex-row items-center gap-2 mt-2">
                                        <View className="px-2 py-1 rounded-full bg-neutral-100 border border-neutral-200">
                                            <Text className="text-[11px] font-semibold text-neutral-700">{linesText}</Text>
                                        </View>
                                        {item.bodegueroId ? (
                                            <View className="px-2 py-1 rounded-full bg-blue-50 border border-blue-100">
                                                <Text className="text-[11px] font-semibold text-blue-700">
                                                    Asignado
                                                </Text>
                                            </View>
                                        ) : (
                                            <View className="px-2 py-1 rounded-full bg-amber-50 border border-amber-100">
                                                <Text className="text-[11px] font-semibold text-amber-700">
                                                    Sin asignar
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                    {item.items && item.items.length ? (
                                        <Text className="text-sm text-neutral-700 mt-2" numberOfLines={1}>
                                            {(item.items || [])
                                                .slice(0, 2)
                                                .map((it) => `${it.nombreProducto || it.productoId?.slice(0, 6) || 'Producto'} • ${it.cantidadSolicitada}`)
                                                .join(' · ')}
                                        </Text>
                                    ) : null}
                                </View>
                            </View>
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
        </View>
    )
}

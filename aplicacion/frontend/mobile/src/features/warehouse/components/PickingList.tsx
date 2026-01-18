import React, { useMemo, useState } from 'react'
import { View, Text, Pressable } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'

import { Header } from '../../../components/ui/Header'
import { SearchBar } from '../../../components/ui/SearchBar'
import { CategoryFilter } from '../../../components/ui/CategoryFilter'
import { GenericList } from '../../../components/ui/GenericList'
import { FeedbackModal, type FeedbackType } from '../../../components/ui/FeedbackModal'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { PickingService, type Picking } from '../../../services/api/PickingService'
import { getUserFriendlyMessage } from '../../../utils/errorMessages'
import { BRAND_COLORS } from '../../../shared/types'

type Props = {
    title?: string
    mine?: boolean
    showTakeButton?: boolean
    onBack?: () => void
    onCreate?: () => void
    onOpen?: (id: string) => void
    refreshToken?: number
}

const formatDate = (dateStr?: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

const getEstadoConfig = (estado?: string) => {
    const configs: Record<string, { label: string; variant: 'warning' | 'info' | 'success' | 'error'; icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
        PENDIENTE: { label: 'Pendiente', variant: 'warning', icon: 'time-outline', color: '#D97706', bg: '#FEF3C7' },
        ASIGNADO: { label: 'Asignado', variant: 'info', icon: 'person-outline', color: '#2563EB', bg: '#DBEAFE' },
        EN_PROCESO: { label: 'En Proceso', variant: 'info', icon: 'sync-outline', color: '#7C3AED', bg: '#EDE9FE' },
        COMPLETADO: { label: 'Completado', variant: 'success', icon: 'checkmark-circle-outline', color: '#059669', bg: '#D1FAE5' },
    }
    return configs[estado || 'PENDIENTE'] || configs.PENDIENTE
}

export function PickingList({ title = 'Ordenes de Picking', mine = false, showTakeButton = false, onBack, onCreate, onOpen, refreshToken }: Props) {
    const [search, setSearch] = useState('')
    const [estado, setEstado] = useState<string>('all')
    const [loading, setLoading] = useState(false)
    const [items, setItems] = useState<Picking[]>([])
    const [takingId, setTakingId] = useState<string | null>(null)
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
                title: 'Error al cargar',
                message: getUserFriendlyMessage(error, 'LOAD_ERROR'),
            })
        } finally {
            setLoading(false)
        }
    }

    React.useEffect(() => {
        loadData()
    }, [estado, refreshToken])

    const filters = useMemo(
        () => [
            { id: 'all', name: 'Todos' },
            { id: 'PENDIENTE', name: 'Pendientes' },
            { id: 'EN_PROCESO', name: 'En Proceso' },
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

    const handleTake = async (id: string) => {
        setTakingId(id)
        try {
            await PickingService.start(id)
            setModalState({
                visible: true,
                type: 'success',
                title: 'Picking Tomado',
                message: 'La orden ha sido asignada a ti. Puedes comenzar a preparar los productos.',
            })
            await loadData()
        } catch (error) {
            setModalState({
                visible: true,
                type: 'error',
                title: 'No se pudo tomar',
                message: getUserFriendlyMessage(error, 'UPDATE_ERROR'),
            })
        } finally {
            setTakingId(null)
        }
    }

    const getTotalItems = (picking: Picking) => {
        return picking.items?.reduce((acc, item) => acc + (item.cantidadSolicitada || 0), 0) || 0
    }

    const getProgress = (picking: Picking) => {
        if (!picking.items?.length) return 0
        const total = picking.items.reduce((acc, item) => acc + (item.cantidadSolicitada || 0), 0)
        const picked = picking.items.reduce((acc, item) => acc + (item.cantidadPickeada || 0), 0)
        return total > 0 ? Math.round((picked / total) * 100) : 0
    }

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title={title} variant="standard" onBackPress={onBack} />

            <View className="bg-white px-4 pb-4 pt-4 border-b border-neutral-100">
                <View className="flex-row items-center gap-3">
                    <View className="flex-1">
                        <SearchBar
                            placeholder="Buscar picking..."
                            value={search}
                            onChangeText={setSearch}
                            onClear={() => setSearch('')}
                        />
                    </View>
                    {onCreate && (
                        <Pressable
                            onPress={onCreate}
                            className="rounded-2xl overflow-hidden"
                            style={{ width: 48, height: 48 }}
                        >
                            <LinearGradient
                                colors={[BRAND_COLORS.red, '#B91C1C']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                            >
                                <Ionicons name="add" size={26} color="#fff" />
                            </LinearGradient>
                        </Pressable>
                    )}
                </View>
                <View className="-mx-4 mt-3">
                    <CategoryFilter categories={filters} selectedId={estado} onSelect={(id) => setEstado(String(id))} />
                </View>
            </View>

            <GenericList
                items={filtered}
                isLoading={loading}
                onRefresh={loadData}
                emptyState={{
                    icon: 'clipboard-outline',
                    title: mine ? 'Sin Ordenes Asignadas' : 'Sin Ordenes de Picking',
                    message: mine
                        ? 'No tienes ordenes asignadas. Las ordenes aparecen cuando un supervisor confirma una reserva.'
                        : 'Las ordenes de picking se generan al confirmar reservas de stock.',
                }}
                renderItem={(item) => {
                    const estadoConfig = getEstadoConfig(item.estado)
                    const itemCount = item.items?.length || 0
                    const totalQty = getTotalItems(item)
                    const progress = getProgress(item)
                    const canTake = showTakeButton && !item.bodegueroId && item.estado === 'PENDIENTE'

                    return (
                        <Pressable
                            onPress={() => onOpen?.(item.id)}
                            className="bg-white rounded-2xl border border-neutral-100 overflow-hidden mb-3"
                            style={{ elevation: 2 }}
                        >
                            <View className="p-4">
                                <View className="flex-row items-start justify-between">
                                    <View className="flex-row items-center flex-1">
                                        <View
                                            className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                                            style={{ backgroundColor: estadoConfig.bg }}
                                        >
                                            <Ionicons name={estadoConfig.icon} size={24} color={estadoConfig.color} />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-base font-bold text-neutral-900">
                                                Picking #{item.id.slice(0, 8).toUpperCase()}
                                            </Text>
                                            <Text className="text-xs text-neutral-500 mt-0.5">
                                                {formatDate(item.createdAt)}
                                            </Text>
                                        </View>
                                    </View>
                                    <StatusBadge label={estadoConfig.label} variant={estadoConfig.variant} size="sm" />
                                </View>

                                <View className="flex-row flex-wrap mt-3 gap-2">
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
                                    {item.bodegueroId ? (
                                        <View className="flex-row items-center bg-blue-50 px-3 py-1.5 rounded-full">
                                            <Ionicons name="person" size={14} color="#2563EB" />
                                            <Text className="text-xs font-semibold text-blue-700 ml-1">Asignado</Text>
                                        </View>
                                    ) : (
                                        <View className="flex-row items-center bg-amber-50 px-3 py-1.5 rounded-full">
                                            <Ionicons name="alert-circle-outline" size={14} color="#D97706" />
                                            <Text className="text-xs font-semibold text-amber-700 ml-1">Disponible</Text>
                                        </View>
                                    )}
                                </View>

                                {item.estado === 'EN_PROCESO' && (
                                    <View className="mt-3">
                                        <View className="flex-row justify-between mb-1">
                                            <Text className="text-xs text-neutral-500">Progreso</Text>
                                            <Text className="text-xs font-bold text-neutral-700">{progress}%</Text>
                                        </View>
                                        <View className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                                            <View
                                                className="h-full rounded-full"
                                                style={{ width: `${progress}%`, backgroundColor: '#7C3AED' }}
                                            />
                                        </View>
                                    </View>
                                )}

                                {item.items && item.items.length > 0 && (
                                    <View className="mt-3 pt-3 border-t border-neutral-100">
                                        {item.items.slice(0, 2).map((it, idx) => (
                                            <View key={idx} className="flex-row items-center justify-between py-1">
                                                <Text className="text-sm text-neutral-700 flex-1" numberOfLines={1}>
                                                    {it.nombreProducto || `Producto ${idx + 1}`}
                                                </Text>
                                                <Text className="text-sm font-semibold text-neutral-900 ml-2">
                                                    x{it.cantidadSolicitada}
                                                </Text>
                                            </View>
                                        ))}
                                        {item.items.length > 2 && (
                                            <Text className="text-xs text-neutral-400 mt-1">
                                                +{item.items.length - 2} productos mas...
                                            </Text>
                                        )}
                                    </View>
                                )}
                            </View>

                            {canTake && (
                                <Pressable
                                    className="flex-row items-center justify-center py-3 border-t border-neutral-100"
                                    style={{ backgroundColor: '#059669' }}
                                    onPress={() => handleTake(item.id)}
                                    disabled={takingId === item.id}
                                >
                                    <Ionicons name="hand-left" size={18} color="#fff" />
                                    <Text className="text-sm font-bold text-white ml-2">
                                        {takingId === item.id ? 'Tomando...' : 'Tomar Orden'}
                                    </Text>
                                </Pressable>
                            )}

                            {!canTake && (
                                <View className="flex-row items-center justify-center py-3 border-t border-neutral-100 bg-neutral-50">
                                    <Text className="text-sm font-semibold text-neutral-500">Ver Detalle</Text>
                                    <Ionicons name="chevron-forward" size={16} color="#6B7280" style={{ marginLeft: 4 }} />
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
        </View>
    )
}

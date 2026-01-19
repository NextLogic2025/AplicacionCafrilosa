import React, { useMemo, useState, useCallback } from 'react'
import { View, Pressable, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'

import { Header } from '../../../components/ui/Header'
import { SearchBar } from '../../../components/ui/SearchBar'
import { CategoryFilter } from '../../../components/ui/CategoryFilter'
import { GenericList } from '../../../components/ui/GenericList'
import { GenericItemCard } from '../../../components/ui/GenericItemCard'
import { FeedbackModal, type FeedbackType } from '../../../components/ui/FeedbackModal'
import { LoteService, type Lote } from '../../../services/api/LoteService'
import { CatalogService, type Product } from '../../../services/api/CatalogService'
import { getUserFriendlyMessage } from '../../../utils/errorMessages'
import { BRAND_COLORS } from '../../../shared/types'
import { usePolling } from '../../../hooks/useRealtimeSync'

type EnrichedLote = Lote & { productName?: string; isExpired: boolean; isBlocked: boolean }

type Props = {
    title?: string
    onBack?: () => void
    onCreate?: () => void
    onOpen?: (id: string) => void
    onDelete?: (id: string) => void
    allowDelete?: boolean
    refreshToken?: number
}

export function LotesList({
    title = 'Lotes',
    onBack,
    onCreate,
    onOpen,
    onDelete,
    allowDelete = false,
    refreshToken,
}: Props) {
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState<string>('all')
    const [loading, setLoading] = useState(false)
    const [items, setItems] = useState<EnrichedLote[]>([])
    const [modalState, setModalState] = useState<{ visible: boolean; type: FeedbackType; title: string; message: string }>({
        visible: false,
        type: 'info',
        title: '',
        message: '',
    })

    const loadData = useCallback(async () => {
        try {
            const [lotes, products] = await Promise.all([LoteService.list(), CatalogService.getProducts()])
            const productMap = new Map<string, Product>()
            products.forEach((p) => productMap.set(String(p.id), p))

            const mapped: EnrichedLote[] = (lotes || []).map((l) => {
                const prod = productMap.get(String(l.productoId))
                const isExpired = Boolean(l.fechaVencimiento) && new Date(l.fechaVencimiento) < new Date()
                const isBlocked = (l.estadoCalidad || '').toUpperCase() === 'BLOQUEADO'
                return {
                    ...l,
                    productName: prod?.nombre || prod?.codigo_sku,
                    isExpired,
                    isBlocked,
                }
            })
            setItems(mapped)
        } catch (error) {
            console.error('Error loading lotes:', error)
        }
    }, [])

    const loadDataWithLoading = useCallback(async () => {
        setLoading(true)
        try {
            await loadData()
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
    }, [loadData])

    // Polling cada 5 segundos para sincronización en tiempo real
    usePolling(loadData, 5000, true)

    React.useEffect(() => {
        loadDataWithLoading()
    }, [refreshToken, loadDataWithLoading])

    const filters = useMemo(
        () => [
            { id: 'all', name: 'Todos' },
            { id: 'active', name: 'Activos' },
            { id: 'expired', name: 'Vencidos' },
            { id: 'blocked', name: 'Bloqueados' },
        ],
        [],
    )

    const filtered = useMemo(() => {
        let base = items
        if (filter === 'active') base = base.filter((i) => !i.isExpired && !i.isBlocked)
        if (filter === 'expired') base = base.filter((i) => i.isExpired)
        if (filter === 'blocked') base = base.filter((i) => i.isBlocked)

        if (!search) return base
        const term = search.toLowerCase()
        return base.filter((i) =>
            [i.numeroLote, i.productName, i.estadoCalidad]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(term)),
        )
    }, [items, search, filter])

    const handleDelete = (id: string) => {
        if (!allowDelete || !onDelete) return
        Alert.alert('Eliminar lote', 'Esta accion no se puede revertir.', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Eliminar',
                style: 'destructive',
                onPress: async () => {
                    try {
                        setLoading(true)
                        await onDelete(id)
                        setModalState({
                            visible: true,
                            type: 'success',
                            title: 'Lote eliminado',
                            message: 'Se elimino el lote.',
                        })
                        loadData()
                    } catch (error) {
                        setModalState({
                            visible: true,
                            type: 'error',
                            title: 'No se pudo eliminar',
                            message: getUserFriendlyMessage(error, 'DELETE_ERROR'),
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
                        placeholder="Buscar lote..."
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
                    <CategoryFilter categories={filters} selectedId={filter} onSelect={(id) => setFilter(String(id))} />
                </View>
            </View>

            <GenericList
                items={filtered}
                isLoading={loading}
                onRefresh={loadDataWithLoading}
                emptyState={{
                    icon: 'business-outline',
                    title: 'Sin lotes',
                    message: 'Crea un lote nuevo para empezar.',
                }}
                renderItem={(item) => (
                    <GenericItemCard
                        title={`Lote ${item.numeroLote}`}
                        subtitle={
                            item.productName
                                ? `${item.productName} - Vence: ${item.fechaVencimiento?.slice(0, 10)}`
                                : `Vence: ${item.fechaVencimiento?.slice(0, 10)}`
                        }
                        subtitleLabel="Producto"
                        isActive={!item.isExpired && !item.isBlocked}
                        placeholderIcon="cube-outline"
                        onPress={() => onOpen?.(item.id)}
                        onDelete={allowDelete ? () => handleDelete(item.id) : undefined}
                        style={{ borderColor: item.isExpired ? '#FCA5A5' : '#E2E8F0', borderWidth: 1.2 }}
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

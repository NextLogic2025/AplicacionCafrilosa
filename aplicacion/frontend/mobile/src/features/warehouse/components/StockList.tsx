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
import { StockService, type StockItem } from '../../../services/api/StockService'
import { LoteService, type Lote } from '../../../services/api/LoteService'
import { UbicacionService, type Ubicacion } from '../../../services/api/UbicacionService'
import { CatalogService, type Product } from '../../../services/api/CatalogService'
import { getUserFriendlyMessage } from '../../../utils/errorMessages'
import { BRAND_COLORS } from '../../../shared/types'

type EnrichedStock = StockItem & {
    loteNumero?: string
    productoNombre?: string
    ubicacionNombre?: string
    almacenNombre?: string
}

type Props = {
    title?: string
    onBack?: () => void
    onCreate?: () => void
    onOpen?: (item: EnrichedStock) => void
    refreshToken?: number
}

export function StockList({ title = 'Stock', onBack, onCreate, onOpen, refreshToken }: Props) {
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState<string>('all')
    const [loading, setLoading] = useState(false)
    const [items, setItems] = useState<EnrichedStock[]>([])
    const [modalState, setModalState] = useState<{ visible: boolean; type: FeedbackType; title: string; message: string }>({
        visible: false,
        type: 'info',
        title: '',
        message: '',
    })

    const loadData = async () => {
        setLoading(true)
        try {
            const [stock, lotes, ubicaciones, productos] = await Promise.all([
                StockService.list(),
                LoteService.list(),
                UbicacionService.list(),
                CatalogService.getProducts(),
            ])

            const loteMap = new Map<string, Lote>()
            ;(lotes || []).forEach((l) => loteMap.set(String(l.id), l))

            const ubicMap = new Map<string, Ubicacion>()
            ;(ubicaciones || []).forEach((u) => ubicMap.set(String(u.id), u))

            const prodMap = new Map<string, Product>()
            ;(productos || []).forEach((p) => prodMap.set(String(p.id), p))

            const mapped: EnrichedStock[] = (stock || []).map((s) => {
                const lote = loteMap.get(String(s.loteId)) || s.lote
                const ubic = ubicMap.get(String(s.ubicacionId)) || s.ubicacion
                const prod = lote?.productoId ? prodMap.get(String(lote.productoId)) : undefined
                return {
                    ...s,
                    loteNumero: lote?.numeroLote,
                    productoNombre: prod?.nombre || prod?.codigo_sku,
                    ubicacionNombre: ubic?.codigoVisual,
                    almacenNombre: (ubic as any)?.almacen?.nombre,
                }
            })
            setItems(mapped)
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
    }, [refreshToken])

    const filters = useMemo(
        () => [
            { id: 'all', name: 'Todos' },
            { id: 'reserved', name: 'Con reserva' },
            { id: 'low', name: 'Bajo' },
        ],
        [],
    )

    const filtered = useMemo(() => {
        let base = items
        if (filter === 'reserved') base = base.filter((i) => (i.cantidadReservada ?? 0) > 0)
        if (filter === 'low') base = base.filter((i) => Number(i.cantidadFisica) <= Number(i.cantidadReservada ?? 0))

        if (!search) return base
        const term = search.toLowerCase()
        return base.filter((i) =>
            [i.loteNumero, i.productoNombre, i.ubicacionNombre, i.almacenNombre]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(term)),
        )
    }, [items, search, filter])

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title={title} variant="standard" onBackPress={onBack} />

            <View className="bg-white px-5 pb-4 pt-5 border-b border-neutral-100 shadow-sm shadow-black/5">
                <View className="flex-row items-center gap-3">
                    <SearchBar
                        placeholder="Buscar stock..."
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
                onRefresh={loadData}
                emptyState={{
                    icon: 'cube-outline',
                    title: 'Sin stock',
                    message: 'Registra ingresos o ajustes para verlos aqui.',
                }}
                renderItem={(item) => (
                    <GenericItemCard
                        title={item.productoNombre || item.loteNumero || 'Lote'}
                        subtitle={`${item.ubicacionNombre || 'Ubicacion'} - Cant: ${item.cantidadFisica}`}
                        subtitleLabel={item.loteNumero ? `Lote ${item.loteNumero}` : undefined}
                        isActive={Number(item.cantidadFisica) > 0}
                        placeholderIcon="cube-outline"
                        onPress={() => onOpen?.(item)}
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

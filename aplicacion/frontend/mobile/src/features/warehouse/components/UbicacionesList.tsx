import React, { useMemo, useState, useCallback } from 'react'
import { View, Pressable } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'

import { Header } from '../../../components/ui/Header'
import { SearchBar } from '../../../components/ui/SearchBar'
import { CategoryFilter } from '../../../components/ui/CategoryFilter'
import { GenericList } from '../../../components/ui/GenericList'
import { GenericItemCard } from '../../../components/ui/GenericItemCard'
import { FeedbackModal, type FeedbackType } from '../../../components/ui/FeedbackModal'
import { AlmacenService, type Almacen } from '../../../services/api/AlmacenService'
import { UbicacionService, type Ubicacion } from '../../../services/api/UbicacionService'
import { getUserFriendlyMessage } from '../../../utils/errorMessages'
import { BRAND_COLORS } from '../../../shared/types'
import { usePolling } from '../../../hooks/useRealtimeSync'

type Props = {
    title?: string
    initialAlmacenId?: number | null
    onBack?: () => void
    onCreate?: (almacenId?: number | null) => void
    onOpen?: (ubicacionId: string) => void
    refreshToken?: number
}

export function UbicacionesList({
    title = 'Ubicaciones',
    initialAlmacenId = null,
    onBack,
    onCreate,
    onOpen,
    refreshToken,
}: Props) {
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(false)
    const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([])
    const [almacenes, setAlmacenes] = useState<Almacen[]>([])
    const [activeTab, setActiveTab] = useState<string>('all')
    const [modalState, setModalState] = useState<{
        visible: boolean
        type: FeedbackType
        title: string
        message: string
    }>({ visible: false, type: 'info', title: '', message: '' })

    const loadData = useCallback(async () => {
        try {
            const targetAlmacen =
                activeTab !== 'all' && Number.isFinite(Number(activeTab))
                    ? Number(activeTab)
                    : initialAlmacenId || undefined
            const [ubicacionesData, almacenesData] = await Promise.all([
                UbicacionService.list(targetAlmacen),
                AlmacenService.list(),
            ])
            setUbicaciones(Array.isArray(ubicacionesData) ? ubicacionesData : [])
            setAlmacenes(Array.isArray(almacenesData) ? almacenesData : [])
        } catch (error) {
            console.error('Error loading ubicaciones:', error)
        }
    }, [activeTab, initialAlmacenId])

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
    }, [activeTab, refreshToken, loadDataWithLoading])

    const selectedAlmacenId = useMemo(() => {
        if (activeTab !== 'all' && !Number.isNaN(Number(activeTab))) return Number(activeTab)
        if (initialAlmacenId && Number.isFinite(initialAlmacenId)) return initialAlmacenId
        return undefined
    }, [activeTab, initialAlmacenId])

    const filterOptions = useMemo(() => {
        const base = [{ id: 'all', name: 'Todos' }]
        const fromAlmacenes = (almacenes || []).map((a) => ({ id: String(a.id), name: a.nombre || `Almacen ${a.id}` }))
        return base.concat(fromAlmacenes)
    }, [almacenes])

    const filtered = useMemo(() => {
        let base = ubicaciones
        if (activeTab !== 'all') {
            const idNum = Number(activeTab)
            if (!Number.isNaN(idNum)) base = base.filter((u) => u.almacenId === idNum)
        }
        if (!search) return base
        const term = search.toLowerCase()
        return base.filter((u) =>
            [u.codigoVisual, u.tipo, u.almacen?.nombre]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(term)),
        )
    }, [ubicaciones, search, activeTab])

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title={title} variant="standard" onBackPress={onBack} />

            <View className="bg-white px-5 pb-4 pt-5 border-b border-neutral-100 shadow-sm shadow-black/5">
                <View className="flex-row items-center gap-3">
                    <SearchBar
                        placeholder="Buscar ubicacion..."
                        value={search}
                        onChangeText={setSearch}
                        onClear={() => setSearch('')}
                        style={{ flex: 1 }}
                    />
                    {onCreate ? (
                        <Pressable
                            onPress={() => onCreate(selectedAlmacenId)}
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
                    <CategoryFilter
                        categories={filterOptions}
                        selectedId={activeTab}
                        onSelect={(id) => setActiveTab(String(id))}
                    />
                </View>
            </View>

            <GenericList
                items={filtered}
                isLoading={loading}
                onRefresh={loadDataWithLoading}
                emptyState={{
                    icon: 'business-outline',
                    title: 'Sin ubicaciones',
                    message: 'Crea una ubicacion para este almacen.',
                }}
                renderItem={(item) => (
                    <GenericItemCard
                        title={item.codigoVisual}
                        subtitle={item.almacen?.nombre ? `Almacen: ${item.almacen.nombre}` : `Tipo: ${item.tipo || 'N/A'}`}
                        subtitleLabel="Ubicacion"
                        isActive={!item.esCuarentena}
                        placeholderIcon="location-outline"
                        onPress={() => onOpen?.(item.id)}
                        style={{ borderColor: item.esCuarentena ? '#F59E0B' : '#E2E8EB', borderWidth: 1.2 }}
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

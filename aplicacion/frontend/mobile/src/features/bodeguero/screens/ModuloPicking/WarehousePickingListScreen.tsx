import React, { useState, useCallback, useMemo } from 'react'
import { View, Text, Pressable } from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'

import { Header } from '../../../../components/ui/Header'
import { useStableInsets } from '../../../../hooks/useStableInsets'
import { usePolling } from '../../../../hooks/useRealtimeSync'
import { GenericTabs } from '../../../../components/ui/GenericTabs'
import { GenericList } from '../../../../components/ui/GenericList'
import { StatusBadge } from '../../../../components/ui/StatusBadge'
import { DashboardCard } from '../../../../components/ui/DashboardCard'
import { FeedbackModal, type FeedbackType } from '../../../../components/ui/FeedbackModal'
import { PickingService, type Picking } from '../../../../services/api/PickingService'
import { getUserFriendlyMessage } from '../../../../utils/errorMessages'
import { BRAND_COLORS } from '../../../../shared/types'

type TabKey = 'disponibles' | 'mis-pickings'

const TABS = [
    { key: 'disponibles', label: 'Disponibles' },
    { key: 'mis-pickings', label: 'Mis Pickings' },
]

const getEstadoConfig = (estado?: string) => {
    const configs: Record<string, { label: string; variant: 'warning' | 'info' | 'success' | 'error'; icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
        PENDIENTE: { label: 'Pendiente', variant: 'warning', icon: 'time-outline', color: '#D97706', bg: '#FEF3C7' },
        ASIGNADO: { label: 'Asignado', variant: 'info', icon: 'person-outline', color: '#2563EB', bg: '#DBEAFE' },
        EN_PROCESO: { label: 'En Proceso', variant: 'info', icon: 'sync-outline', color: '#7C3AED', bg: '#EDE9FE' },
        COMPLETADO: { label: 'Completado', variant: 'success', icon: 'checkmark-circle-outline', color: '#059669', bg: '#D1FAE5' },
    }
    return configs[estado || 'PENDIENTE'] || configs.PENDIENTE
}

const formatDate = (dateStr?: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function WarehousePickingListScreen() {
    const navigation = useNavigation<any>()
    const insets = useStableInsets()

    const [activeTab, setActiveTab] = useState<TabKey>('disponibles')
    const [loading, setLoading] = useState(false)
    const [disponibles, setDisponibles] = useState<Picking[]>([])
    const [misPickings, setMisPickings] = useState<Picking[]>([])
    const [takingId, setTakingId] = useState<string | null>(null)
    const [modalState, setModalState] = useState<{ visible: boolean; type: FeedbackType; title: string; message: string }>({
        visible: false,
        type: 'info',
        title: '',
        message: '',
    })

    const loadDisponibles = useCallback(async () => {
        try {
            // Pickings pendientes sin asignar (disponibles para cualquier bodeguero)
            const data = await PickingService.list('PENDIENTE', { all: true })
            // Filtrar solo los que no tienen bodeguero asignado
            const sinAsignar = data.filter(p => !p.bodegueroId && !p.bodegueroAsignadoId)
            setDisponibles(sinAsignar)
        } catch (error) {
            console.error('Error loading disponibles:', error)
        }
    }, [])

    const loadMisPickings = useCallback(async () => {
        try {
            // Pickings asignados al bodeguero actual (no completados)
            const data = await PickingService.listMine()
            // Filtrar solo ASIGNADO y EN_PROCESO (no completados)
            const activos = data.filter(p => p.estado === 'ASIGNADO' || p.estado === 'EN_PROCESO')
            setMisPickings(activos)
        } catch (error) {
            console.error('Error loading mis pickings:', error)
        }
    }, [])

    const loadData = useCallback(async () => {
        await Promise.all([loadDisponibles(), loadMisPickings()])
    }, [loadDisponibles, loadMisPickings])

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

    useFocusEffect(
        useCallback(() => {
            loadDataWithLoading()
            return () => { }
        }, [loadDataWithLoading]),
    )

    const currentItems = activeTab === 'disponibles' ? disponibles : misPickings

    const totals = useMemo(() => ({
        disponibles: disponibles.length,
        misPickings: misPickings.length,
        enProceso: misPickings.filter(p => p.estado === 'EN_PROCESO').length,
    }), [disponibles, misPickings])

    const handleTakeOrder = async (pickingId: string) => {
        setTakingId(pickingId)
        try {
            // Usar el método 'take' para tomar la orden (POST /picking/:id/tomar)
            await PickingService.take(pickingId)
            setModalState({
                visible: true,
                type: 'success',
                title: 'Orden Tomada',
                message: 'La orden ha sido asignada a ti. Puedes comenzar el picking.',
            })
            await loadData()
        } catch (error) {
            setModalState({
                visible: true,
                type: 'error',
                title: 'Error',
                message: getUserFriendlyMessage(error, 'UPDATE_ERROR'),
            })
        } finally {
            setTakingId(null)
        }
    }

    const getTotalItems = (picking: Picking) => {
        const items = picking.items || []
        return items.reduce((acc, item) => acc + (item.cantidadSolicitada || 0), 0)
    }

    const getProgress = (picking: Picking) => {
        const items = picking.items || []
        if (!items.length) return 0
        const total = items.reduce((acc, item) => acc + (item.cantidadSolicitada || 0), 0)
        const picked = items.reduce((acc, item) => acc + (item.cantidadPickeada || 0), 0)
        return total > 0 ? Math.round((picked / total) * 100) : 0
    }

    // Helper para obtener el título del picking con info del pedido
    const getPickingTitle = (item: Picking) => {
        if (item.pedido?.numero) {
            return `Pedido #${item.pedido.numero}`
        }
        if (item.pedidoId) {
            return `Pedido #${item.pedidoId.slice(0, 8).toUpperCase()}`
        }
        return `Picking #${item.id.slice(0, 8).toUpperCase()}`
    }

    // Helper para obtener el nombre del cliente
    const getClientName = (item: Picking) => {
        return item.pedido?.clienteNombre || null
    }

    // Helper para mostrar el bodeguero
    const getBodegueroDisplay = (item: Picking) => {
        if (item.bodegueroAsignado?.nombreCompleto) {
            return item.bodegueroAsignado.nombreCompleto
        }
        if (item.bodegueroNombre) {
            return item.bodegueroNombre
        }
        if (item.bodegueroId || item.bodegueroAsignadoId) {
            const id = item.bodegueroId || item.bodegueroAsignadoId || ''
            return `ID: ${id.slice(0, 8)}`
        }
        return null
    }

    const renderPickingCard = (item: Picking) => {
        const estadoConfig = getEstadoConfig(item.estado)
        const itemCount = item.items?.length || 0
        const totalQty = getTotalItems(item)
        const progress = getProgress(item)
        const canTake = activeTab === 'disponibles' && !item.bodegueroId && !item.bodegueroAsignadoId && item.estado === 'PENDIENTE'
        const isEnProceso = item.estado === 'EN_PROCESO'
        const isAsignado = item.estado === 'ASIGNADO' || item.estado === 'EN_PROCESO'
        const bodegueroDisplay = getBodegueroDisplay(item)
        const clientName = getClientName(item)

        return (
            <Pressable
                onPress={() => navigation.navigate('WarehousePickingDetail', { pickingId: item.id })}
                className="bg-white rounded-2xl border border-neutral-100 overflow-hidden mb-3"
                style={{ elevation: 2 }}
            >
                <View className="p-4">
                    {/* Header */}
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
                                    {getPickingTitle(item)}
                                </Text>
                                {clientName && (
                                    <Text className="text-sm text-neutral-600 mt-0.5" numberOfLines={1}>
                                        {clientName}
                                    </Text>
                                )}
                                <Text className="text-xs text-neutral-500 mt-0.5">
                                    {formatDate(item.createdAt)}
                                </Text>
                            </View>
                        </View>
                        <StatusBadge label={estadoConfig.label} variant={estadoConfig.variant} size="sm" />
                    </View>

                    {/* Tags */}
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
                        {/* Mostrar asignación */}
                        {isAsignado && bodegueroDisplay ? (
                            <View className="flex-row items-center bg-blue-50 px-3 py-1.5 rounded-full">
                                <Ionicons name="person" size={14} color="#2563EB" />
                                <Text className="text-xs font-semibold text-blue-700 ml-1" numberOfLines={1}>
                                    {bodegueroDisplay}
                                </Text>
                            </View>
                        ) : !item.bodegueroId && !item.bodegueroAsignadoId ? (
                            <View className="flex-row items-center bg-amber-50 px-3 py-1.5 rounded-full">
                                <Ionicons name="alert-circle-outline" size={14} color="#D97706" />
                                <Text className="text-xs font-semibold text-amber-700 ml-1">Sin asignar</Text>
                            </View>
                        ) : null}
                    </View>

                    {/* Progress bar for EN_PROCESO */}
                    {isEnProceso && (
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

                    {/* Items preview */}
                    {item.items && item.items.length > 0 && (
                        <View className="mt-3 pt-3 border-t border-neutral-100">
                            {item.items.slice(0, 2).map((it, idx) => (
                                <View key={it.id || idx} className="flex-row items-center justify-between py-1">
                                    <Text className="text-sm text-neutral-700 flex-1" numberOfLines={1}>
                                        {it.nombreProducto || it.sku || `Producto ${idx + 1}`}
                                    </Text>
                                    <Text className="text-sm font-semibold text-neutral-900 ml-2">
                                        x{it.cantidadSolicitada}
                                    </Text>
                                </View>
                            ))}
                            {item.items.length > 2 && (
                                <Text className="text-xs text-neutral-400 mt-1">
                                    +{item.items.length - 2} productos más...
                                </Text>
                            )}
                        </View>
                    )}
                </View>

                {/* Action Button */}
                {canTake ? (
                    <Pressable
                        className="flex-row items-center justify-center py-3 border-t border-neutral-100"
                        style={{ backgroundColor: '#059669' }}
                        onPress={() => handleTakeOrder(item.id)}
                        disabled={takingId === item.id}
                    >
                        <Ionicons name="hand-left" size={18} color="#fff" />
                        <Text className="text-sm font-bold text-white ml-2">
                            {takingId === item.id ? 'Tomando...' : 'Tomar Orden'}
                        </Text>
                    </Pressable>
                ) : (
                    <View className="flex-row items-center justify-center py-3 border-t border-neutral-100 bg-neutral-50">
                        <Text className="text-sm font-semibold text-neutral-500">
                            {isEnProceso ? 'Continuar Picking' : 'Ver Detalle'}
                        </Text>
                        <Ionicons name="chevron-forward" size={16} color="#6B7280" style={{ marginLeft: 4 }} />
                    </View>
                )}
            </Pressable>
        )
    }

    const fabBottom = 96 + (insets.bottom || 16)

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Picking" variant="standard" />

            {/* KPIs */}
            <View className="mx-4 mt-4">
                <View className="flex-row justify-between">
                    <DashboardCard
                        label="Disponibles"
                        value={totals.disponibles}
                        icon="list"
                        color="#D97706"
                        columns={3}
                    />
                    <DashboardCard
                        label="Mis Pickings"
                        value={totals.misPickings}
                        icon="person"
                        color="#2563EB"
                        columns={3}
                    />
                    <DashboardCard
                        label="En Proceso"
                        value={totals.enProceso}
                        icon="sync"
                        color="#7C3AED"
                        columns={3}
                    />
                </View>
            </View>

            {/* Tabs */}
            <View className="mt-4">
                <GenericTabs
                    tabs={TABS}
                    activeTab={activeTab}
                    onTabChange={(key) => setActiveTab(key as TabKey)}
                />
            </View>

            {/* List */}
            <GenericList
                items={currentItems}
                isLoading={loading}
                onRefresh={loadDataWithLoading}
                emptyState={{
                    icon: activeTab === 'disponibles' ? 'clipboard-outline' : 'person-outline',
                    title: activeTab === 'disponibles' ? 'Sin Pickings Disponibles' : 'Sin Pickings Asignados',
                    message: activeTab === 'disponibles'
                        ? 'No hay órdenes de picking disponibles para tomar en este momento.'
                        : 'No tienes pickings activos. Toma una orden desde "Disponibles".',
                }}
                renderItem={renderPickingCard}
            />

            {/* FAB - Historial */}
            <View
                className="absolute right-6"
                style={{ bottom: fabBottom }}
                pointerEvents="box-none"
            >
                <Pressable
                    onPress={() => navigation.navigate('WarehousePickingHistory')}
                    accessibilityRole="button"
                    className="w-14 h-14 rounded-full items-center justify-center"
                    style={{
                        backgroundColor: BRAND_COLORS.red,
                        shadowColor: BRAND_COLORS.red,
                        shadowOffset: { width: 0, height: 6 },
                        shadowOpacity: 0.35,
                        shadowRadius: 10,
                        elevation: 10,
                    }}
                >
                    <Ionicons name="time-outline" size={28} color="white" />
                </Pressable>
            </View>

            {/* Feedback Modal */}
            <FeedbackModal
                visible={modalState.visible}
                type={modalState.type}
                title={modalState.title}
                message={modalState.message}
                onClose={() => setModalState(prev => ({ ...prev, visible: false }))}
            />
        </View>
    )
}

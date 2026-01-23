import React, { useState, useCallback, useMemo } from 'react'
import { View, Text, Pressable } from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'

import { Header } from '../../../../components/ui/Header'
import { DashboardCard } from '../../../../components/ui/DashboardCard'
import { GenericList } from '../../../../components/ui/GenericList'
import { FeedbackModal, type FeedbackType } from '../../../../components/ui/FeedbackModal'
import { PickingService, type Picking } from '../../../../services/api/PickingService'
import { getUserFriendlyMessage } from '../../../../utils/errorMessages'
import { BRAND_COLORS } from '../../../../shared/types'

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
    const [loading, setLoading] = useState(false)
    const [pickings, setPickings] = useState<Picking[]>([])
    const [startingId, setStartingId] = useState<string | null>(null)
    const [modalState, setModalState] = useState<{ visible: boolean; type: FeedbackType; title: string; message: string }>({
        visible: false,
        type: 'info',
        title: '',
        message: ''
    })

    const stats = useMemo(() => ({
        total: pickings.length,
        pendientes: pickings.filter(p => p.estado === 'PENDIENTE').length,
        enProceso: pickings.filter(p => p.estado === 'EN_PROCESO').length,
    }), [pickings])

    const loadPickings = useCallback(async () => {
        try {
            const data = await PickingService.listMine()
            setPickings(data)
        } catch (error) {
            console.error('Error loading pickings:', error)
            setPickings([])
        }
    }, [])

    const refreshPickings = useCallback(async () => {
        setLoading(true)
        try {
            await loadPickings()
        } finally {
            setLoading(false)
        }
    }, [loadPickings])

    useFocusEffect(
        useCallback(() => {
            refreshPickings()
        }, [refreshPickings])
    )

    const handleStartPicking = async (id: string) => {
        setStartingId(id)
        try {
            await PickingService.start(id)
            setModalState({
                visible: true,
                type: 'success',
                title: 'Picking iniciado',
                message: 'Puedes continuar con la preparación en la lista de pedidos.'
            })
            await loadPickings()
        } catch (error) {
            console.error('Error iniciando picking:', error)
            setModalState({
                visible: true,
                type: 'error',
                title: 'No se pudo iniciar',
                message: getUserFriendlyMessage(error, 'UPDATE_ERROR')
            })
        } finally {
            setStartingId(null)
        }
    }

    const renderPickingCard = (item: Picking) => {
        const estadoConfig = getEstadoConfig(item.estado)
        const itemCount = item.items?.length || 0
        const totalQty = item.items?.reduce((acc, it) => acc + (it.cantidadSolicitada || 0), 0) || 0
        const canStart = item.estado === 'PENDIENTE'

        return (
            <Pressable
                onPress={() => navigation.navigate('WarehousePickingDetail', { pickingId: item.id })}
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
                                    {item.pedido?.numero ? `Pedido #${item.pedido.numero}` : `Picking #${item.id.slice(0, 8).toUpperCase()}`}
                                </Text>
                                {item.pedido?.clienteNombre && (
                                    <Text className="text-sm text-neutral-600 mt-0.5" numberOfLines={1}>
                                        {item.pedido.clienteNombre}
                                    </Text>
                                )}
                                <Text className="text-xs text-neutral-500 mt-0.5">
                                    {formatDate(item.createdAt)}
                                </Text>
                            </View>
                        </View>
                        <View
                            className="px-3 py-1.5 rounded-full"
                            style={{ backgroundColor: `${estadoConfig.color}20` }}
                        >
                            <Text className="text-xs font-bold uppercase tracking-wide" style={{ color: estadoConfig.color }}>
                                {estadoConfig.label}
                            </Text>
                        </View>
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
                    </View>
                </View>

                {canStart ? (
                    <Pressable
                        className="flex-row items-center justify-center py-3 border-t border-neutral-100"
                        style={{ backgroundColor: '#059669' }}
                        onPress={() => handleStartPicking(item.id)}
                        disabled={startingId === item.id}
                    >
                        <Ionicons name="play" size={18} color="#fff" />
                        <Text className="text-sm font-bold text-white ml-2">
                            {startingId === item.id ? 'Iniciando...' : 'Iniciar Picking'}
                        </Text>
                    </Pressable>
                ) : (
                    <View className="flex-row items-center justify-center py-3 border-t border-neutral-100 bg-neutral-50">
                        <Text className="text-sm font-semibold text-neutral-500">
                            {item.estado === 'EN_PROCESO' ? 'Continuar Picking' : 'Ver detalle'}
                        </Text>
                        <Ionicons name="chevron-forward" size={16} color="#6B7280" style={{ marginLeft: 4 }} />
                    </View>
                )}
            </Pressable>
        )
    }

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Picking" variant="standard" />

            <View className="mx-4 mt-4">
                <View className="flex-row justify-between">
                    <DashboardCard
                        label="Mis Pickings"
                        value={stats.total}
                        icon="layers"
                        color="#525252"
                        columns={3}
                    />
                    <DashboardCard
                        label="Pendientes"
                        value={stats.pendientes}
                        icon="time"
                        color="#D97706"
                        columns={3}
                    />
                    <DashboardCard
                        label="En Proceso"
                        value={stats.enProceso}
                        icon="sync"
                        color="#7C3AED"
                        columns={3}
                    />
                </View>
            </View>

            <GenericList
                items={pickings}
                isLoading={loading}
                onRefresh={refreshPickings}
                emptyState={{
                    icon: 'person-outline',
                    title: 'Sin pickings asignados',
                    message: 'Todavía no tienes pickings en curso.'
                }}
                renderItem={renderPickingCard}
            />

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

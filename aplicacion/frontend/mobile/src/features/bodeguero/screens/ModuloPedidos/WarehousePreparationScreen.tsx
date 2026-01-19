import React, { useMemo, useState, useCallback } from 'react'
import { View, Text, Pressable, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useFocusEffect } from '@react-navigation/native'

import { Header } from '../../../../components/ui/Header'
import { SearchBar } from '../../../../components/ui/SearchBar'
import { CategoryFilter } from '../../../../components/ui/CategoryFilter'
import { GenericList } from '../../../../components/ui/GenericList'
import { StatusBadge } from '../../../../components/ui/StatusBadge'
import { PrimaryButton } from '../../../../components/ui/PrimaryButton'
import { FeedbackModal, type FeedbackType } from '../../../../components/ui/FeedbackModal'
import { KpiCard } from '../../../../components/ui/KpiCard'
import { PickingService, type Picking } from '../../../../services/api/PickingService'
import { OrderService } from '../../../../services/api/OrderService'

// Estados locales para la preparación
type PreparationStatus = 'COMPLETADO' | 'VERIFICADO' | 'EMPACADO'
type FilterId = 'all' | PreparationStatus

const STATUS_FILTERS: { id: FilterId; name: string }[] = [
    { id: 'all', name: 'Todos' },
    { id: 'COMPLETADO', name: 'Por Verificar' },
    { id: 'VERIFICADO', name: 'Verificados' },
]

const STATUS_CONFIG: Record<string, { label: string; variant: 'info' | 'warning' | 'success' | 'error'; icon: string }> = {
    COMPLETADO: { label: 'Por Verificar', variant: 'warning', icon: 'checkmark-circle-outline' },
    VERIFICADO: { label: 'Verificado', variant: 'info', icon: 'shield-checkmark-outline' },
    EMPACADO: { label: 'Empacado', variant: 'success', icon: 'cube-outline' },
}

// Extendemos el tipo Picking localmente para tracking de preparación
type PreparationPicking = Picking & {
    preparationStatus?: PreparationStatus
    verifiedAt?: string
    packedAt?: string
}

export function WarehousePreparationScreen() {
    const navigation = useNavigation<any>()
    const [loading, setLoading] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)
    const [pickings, setPickings] = useState<PreparationPicking[]>([])
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<FilterId>('all')
    const [selectedPicking, setSelectedPicking] = useState<PreparationPicking | null>(null)
    const [actionType, setActionType] = useState<'verify' | 'dispatch' | null>(null)
    const [feedback, setFeedback] = useState<{ visible: boolean; type: FeedbackType; title: string; message: string }>({
        visible: false,
        type: 'info',
        title: '',
        message: '',
    })

    const loadPickings = useCallback(async () => {
        setLoading(true)
        try {
            // Obtener MIS pickings completados (solo los que yo terminé)
            const myPickings = await PickingService.listMine()

            // Filtrar solo los COMPLETADOS
            const completados = myPickings.filter(p => p.estado === 'COMPLETADO')

            // Mapeamos agregando estado de preparación
            const mapped: PreparationPicking[] = completados.map(p => ({
                ...p,
                preparationStatus: 'COMPLETADO' as PreparationStatus,
            }))

            setPickings(mapped)
        } catch (error) {
            console.error('Error loading pickings:', error)
            setPickings([])
            setFeedback({
                visible: true,
                type: 'error',
                title: 'Error al cargar',
                message: 'No se pudieron cargar los pickings completados.',
            })
        } finally {
            setLoading(false)
        }
    }, [])

    useFocusEffect(
        useCallback(() => {
            loadPickings()
            return () => {}
        }, [loadPickings]),
    )

    const filteredPickings = useMemo(() => {
        let base = pickings

        if (statusFilter !== 'all') {
            base = base.filter(p => p.preparationStatus === statusFilter)
        }

        if (!search) return base

        const term = search.toLowerCase()
        return base.filter(picking => {
            const idMatch = picking.id.toLowerCase().includes(term)
            const pedidoMatch = picking.pedidoId?.toLowerCase().includes(term) || false
            return idMatch || pedidoMatch
        })
    }, [pickings, search, statusFilter])

    const totals = useMemo(() => {
        const porVerificar = pickings.filter(p => p.preparationStatus === 'COMPLETADO').length
        const verificados = pickings.filter(p => p.preparationStatus === 'VERIFICADO').length
        return {
            total: pickings.length,
            porVerificar,
            verificados,
        }
    }, [pickings])

    const handleVerify = async () => {
        if (!selectedPicking) return
        setActionLoading(true)
        try {
            // Marcar como verificado (solo frontend por ahora)
            // Cuando el backend lo soporte, aquí se haría la llamada
            setPickings(prev => prev.map(p =>
                p.id === selectedPicking.id
                    ? { ...p, preparationStatus: 'VERIFICADO' as PreparationStatus, verifiedAt: new Date().toISOString() }
                    : p
            ))

            setFeedback({
                visible: true,
                type: 'success',
                title: 'Verificado',
                message: 'El picking ha sido verificado correctamente.',
            })
        } catch (error) {
            setFeedback({
                visible: true,
                type: 'error',
                title: 'Error',
                message: 'No se pudo verificar el picking.',
            })
        } finally {
            setActionLoading(false)
            setSelectedPicking(null)
            setActionType(null)
        }
    }

    const handleSendToDispatch = async () => {
        if (!selectedPicking || !selectedPicking.pedidoId) return
        setActionLoading(true)
        try {
            // Cambiar el estado del pedido a EN_PREPARACION (listo para despacho)
            await OrderService.changeOrderStatus(selectedPicking.pedidoId, 'EN_PREPARACION')

            // Quitar de la lista local
            setPickings(prev => prev.filter(p => p.id !== selectedPicking.id))

            setFeedback({
                visible: true,
                type: 'success',
                title: 'Enviado a Despacho',
                message: 'El pedido está listo para ser despachado.',
            })
        } catch (error) {
            setFeedback({
                visible: true,
                type: 'error',
                title: 'Error',
                message: 'No se pudo enviar a despacho.',
            })
        } finally {
            setActionLoading(false)
            setSelectedPicking(null)
            setActionType(null)
        }
    }

    const formatPickingTitle = (picking: PreparationPicking) => {
        if (picking.pedidoId) {
            return `Pedido #${picking.pedidoId.slice(0, 8).toUpperCase()}`
        }
        return `Picking #${picking.id.slice(0, 8).toUpperCase()}`
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        return date.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    }

    const getItemsInfo = (picking: PreparationPicking) => {
        const items = picking.items || []
        const totalItems = items.length
        const totalUnits = items.reduce((sum, item) => sum + (item.cantidadPickeada || item.cantidadSolicitada), 0)
        return { totalItems, totalUnits }
    }

    const getProgressInfo = (picking: PreparationPicking) => {
        const items = picking.items || []
        const total = items.length
        const picked = items.filter(i => (i.cantidadPickeada ?? 0) > 0).length
        const percentage = total > 0 ? Math.round((picked / total) * 100) : 0
        return { picked, total, percentage }
    }

    return (
        <View className="flex-1 bg-neutral-50">
            <Header
                title="Preparación y Empaque"
                variant="standard"
                onBackPress={() => navigation.goBack()}
            />

            {/* KPIs */}
            <View className="mx-4 mt-4">
                <View className="flex-row justify-between">
                    <KpiCard
                        label="Total"
                        value={totals.total}
                        icon="layers-outline"
                        color="#DC2626"
                        columns={3}
                    />
                    <KpiCard
                        label="Por Verificar"
                        value={totals.porVerificar}
                        icon="alert-circle-outline"
                        color="#D97706"
                        columns={3}
                    />
                    <KpiCard
                        label="Verificados"
                        value={totals.verificados}
                        icon="checkmark-done-outline"
                        color="#059669"
                        columns={3}
                    />
                </View>
            </View>

            {/* Search & Filters */}
            <View className="bg-white px-5 pb-4 pt-4 border-b border-neutral-100 mt-4">
                <SearchBar
                    placeholder="Buscar por ID de picking o pedido..."
                    value={search}
                    onChangeText={setSearch}
                    onClear={() => setSearch('')}
                />
                <View className="-mx-5 mt-3">
                    <CategoryFilter
                        categories={STATUS_FILTERS}
                        selectedId={statusFilter}
                        onSelect={(id) => setStatusFilter(id as FilterId)}
                    />
                </View>
            </View>

            {/* Lista de Pickings */}
            <GenericList
                items={filteredPickings}
                isLoading={loading}
                onRefresh={loadPickings}
                emptyState={{
                    icon: 'cube-outline',
                    title: 'Sin pickings para empacar',
                    message: 'Cuando completes pickings, aparecerán aquí para verificación y empaque.',
                }}
                renderItem={(picking) => {
                    const status = STATUS_CONFIG[picking.preparationStatus || 'COMPLETADO']
                    const { totalItems, totalUnits } = getItemsInfo(picking)
                    const progress = getProgressInfo(picking)
                    const isVerified = picking.preparationStatus === 'VERIFICADO'

                    return (
                        <View
                            className="bg-white rounded-2xl border border-neutral-100 overflow-hidden mb-3"
                            style={{ elevation: 2 }}
                        >
                            {/* Header */}
                            <View className="p-4">
                                <View className="flex-row items-start justify-between">
                                    <View className="flex-row items-center flex-1">
                                        <View
                                            className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                                            style={{ backgroundColor: isVerified ? '#D1FAE5' : '#FEF3C7' }}
                                        >
                                            <Ionicons
                                                name={isVerified ? 'shield-checkmark-outline' : 'cube-outline'}
                                                size={24}
                                                color={isVerified ? '#059669' : '#D97706'}
                                            />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-base font-bold text-neutral-900">
                                                {formatPickingTitle(picking)}
                                            </Text>
                                            <Text className="text-xs text-neutral-500 mt-0.5">
                                                {formatDate(picking.updatedAt || picking.createdAt)}
                                            </Text>
                                        </View>
                                    </View>
                                    <StatusBadge
                                        label={status.label}
                                        variant={status.variant}
                                        size="sm"
                                    />
                                </View>

                                {/* Info */}
                                <View className="mt-3 flex-row items-center justify-between">
                                    <View>
                                        <Text className="text-sm font-semibold text-neutral-800">
                                            {totalItems} {totalItems === 1 ? 'producto' : 'productos'}
                                        </Text>
                                        <Text className="text-xs text-neutral-500 mt-0.5">
                                            {totalUnits} {totalUnits === 1 ? 'unidad' : 'unidades'} recogidas
                                        </Text>
                                    </View>

                                    {/* Progress indicator */}
                                    <View className="items-end">
                                        <Text className="text-xs text-neutral-500 mb-1">Picking completado</Text>
                                        <View className="flex-row items-center">
                                            <View className="w-20 h-2 bg-neutral-200 rounded-full overflow-hidden mr-2">
                                                <View
                                                    className="h-full bg-green-500 rounded-full"
                                                    style={{ width: `${progress.percentage}%` }}
                                                />
                                            </View>
                                            <Text className="text-xs font-semibold text-green-600">
                                                {progress.percentage}%
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Items preview */}
                                {picking.items && picking.items.length > 0 && (
                                    <View className="mt-3 bg-neutral-50 rounded-xl p-3">
                                        <Text className="text-xs font-semibold text-neutral-600 mb-2">
                                            Productos recogidos:
                                        </Text>
                                        {picking.items.slice(0, 3).map((item, idx) => (
                                            <View key={item.id || idx} className="flex-row items-center justify-between py-1">
                                                <Text className="text-xs text-neutral-700 flex-1" numberOfLines={1}>
                                                    {item.nombreProducto || `Producto ${item.productoId.slice(0, 8)}`}
                                                </Text>
                                                <Text className="text-xs font-semibold text-neutral-800 ml-2">
                                                    x{item.cantidadPickeada || item.cantidadSolicitada}
                                                </Text>
                                            </View>
                                        ))}
                                        {picking.items.length > 3 && (
                                            <Text className="text-xs text-neutral-400 mt-1">
                                                +{picking.items.length - 3} más...
                                            </Text>
                                        )}
                                    </View>
                                )}
                            </View>

                            {/* Actions */}
                            <View className="px-4 pb-4">
                                {!isVerified ? (
                                    <View className="flex-row space-x-2">
                                        <View className="flex-1 mr-2">
                                            <Pressable
                                                className="bg-neutral-100 rounded-xl py-3 items-center flex-row justify-center"
                                                onPress={() => navigation.navigate('WarehousePickingDetail', { pickingId: picking.id })}
                                            >
                                                <Ionicons name="eye-outline" size={18} color="#525252" />
                                                <Text className="text-sm font-semibold text-neutral-600 ml-2">
                                                    Ver Detalle
                                                </Text>
                                            </Pressable>
                                        </View>
                                        <View className="flex-1">
                                            <PrimaryButton
                                                title="Verificar"
                                                onPress={() => {
                                                    setSelectedPicking(picking)
                                                    setActionType('verify')
                                                }}
                                            />
                                        </View>
                                    </View>
                                ) : (
                                    <PrimaryButton
                                        title="Enviar a Despacho"
                                        onPress={() => {
                                            setSelectedPicking(picking)
                                            setActionType('dispatch')
                                        }}
                                    />
                                )}
                            </View>
                        </View>
                    )
                }}
            />

            {/* Modal de Verificación */}
            <FeedbackModal
                visible={actionType === 'verify' && selectedPicking !== null}
                type="warning"
                title="Verificar Picking"
                message={`¿Confirmas que has verificado todos los productos del ${formatPickingTitle(selectedPicking!)}? Asegúrate de que las cantidades y productos sean correctos.`}
                showCancel
                cancelText="Cancelar"
                confirmText={actionLoading ? 'Verificando...' : 'Confirmar Verificación'}
                onClose={() => {
                    setSelectedPicking(null)
                    setActionType(null)
                }}
                onConfirm={handleVerify}
            />

            {/* Modal de Enviar a Despacho */}
            <FeedbackModal
                visible={actionType === 'dispatch' && selectedPicking !== null}
                type="info"
                title="Enviar a Despacho"
                message={`El ${formatPickingTitle(selectedPicking!)} será enviado a la zona de despacho para su entrega. ¿Continuar?`}
                showCancel
                cancelText="Cancelar"
                confirmText={actionLoading ? 'Enviando...' : 'Enviar a Despacho'}
                onClose={() => {
                    setSelectedPicking(null)
                    setActionType(null)
                }}
                onConfirm={handleSendToDispatch}
            />

            {/* Feedback Modal */}
            <FeedbackModal
                visible={feedback.visible}
                type={feedback.type}
                title={feedback.title}
                message={feedback.message}
                onClose={() => setFeedback(prev => ({ ...prev, visible: false }))}
            />

            {/* Loading Overlay */}
            {actionLoading && (
                <View className="absolute inset-0 bg-black/20 items-center justify-center">
                    <View className="bg-white rounded-2xl p-6 items-center">
                        <ActivityIndicator size="large" color="#DC2626" />
                        <Text className="text-sm text-neutral-600 mt-3">Procesando...</Text>
                    </View>
                </View>
            )}
        </View>
    )
}

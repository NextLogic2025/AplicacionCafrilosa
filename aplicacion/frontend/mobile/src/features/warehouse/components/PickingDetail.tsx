import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { Header } from '../../../components/ui/Header'
import { PrimaryButton } from '../../../components/ui/PrimaryButton'
import { FeedbackModal, type FeedbackType } from '../../../components/ui/FeedbackModal'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { GenericModal } from '../../../components/ui/GenericModal'
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal'
import {
    PickingService,
    type Picking,
    type PickingItem,
    type AlternativeStock,
    MOTIVOS_DESVIACION,
} from '../../../services/api/PickingService'
import { getUserFriendlyMessage } from '../../../utils/errorMessages'
import { BRAND_COLORS } from '../../../shared/types'

type Props = {
    pickingId: string
    allowStart?: boolean
    allowComplete?: boolean
    allowPick?: boolean
    onBack: () => void
    onUpdated: () => void
}

// Estado del modal de pickeo
type PickModalState = {
    visible: boolean
    item: PickingItem | null
    cantidad: string
    motivoDesviacion: string
    notasBodeguero: string
    loteSeleccionado: { id: string; numeroLote: string; ubicacionId: string; ubicacionLabel: string } | null
}

const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'No disponible'
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const formatQuantity = (qty: number | undefined | null): string => {
    if (qty === undefined || qty === null || !Number.isFinite(Number(qty))) return '0'
    const num = Number(qty)
    return num % 1 === 0 ? num.toFixed(0) : num.toFixed(2)
}

const getItemName = (item: PickingItem): string => {
    return item.nombreProducto || item.sku || `Producto ${item.productoId?.slice(0, 8) || ''}`
}

const getEstadoConfig = (estado?: string) => {
    const configs: Record<string, { label: string; variant: 'warning' | 'info' | 'success' | 'error'; color: string; bg: string }> = {
        PENDIENTE: { label: 'Pendiente', variant: 'warning', color: '#D97706', bg: '#FEF3C7' },
        ASIGNADO: { label: 'Asignado', variant: 'info', color: '#2563EB', bg: '#DBEAFE' },
        EN_PROCESO: { label: 'En Proceso', variant: 'info', color: '#7C3AED', bg: '#EDE9FE' },
        COMPLETADO: { label: 'Completado', variant: 'success', color: '#059669', bg: '#D1FAE5' },
    }
    return configs[estado || 'PENDIENTE'] || configs.PENDIENTE
}

const getItemEstadoConfig = (estado?: string) => {
    const configs: Record<string, { label: string; variant: 'warning' | 'info' | 'success'; color: string }> = {
        PENDIENTE: { label: 'Pendiente', variant: 'warning', color: '#D97706' },
        PARCIAL: { label: 'Parcial', variant: 'info', color: '#2563EB' },
        COMPLETADO: { label: 'Listo', variant: 'success', color: '#059669' },
    }
    return configs[estado || 'PENDIENTE'] || configs.PENDIENTE
}

export function PickingDetail({ pickingId, allowStart = false, allowComplete = false, allowPick = false, onBack, onUpdated }: Props) {
    const [picking, setPicking] = useState<Picking | null>(null)
    const [_loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)

    // Modal de pickeo con campos de desviación
    const [pickModal, setPickModal] = useState<PickModalState>({
        visible: false,
        item: null,
        cantidad: '',
        motivoDesviacion: '',
        notasBodeguero: '',
        loteSeleccionado: null,
    })

    // Modal de lotes alternativos
    const [lotesModal, setLotesModal] = useState<{ visible: boolean; loading: boolean; stocks: AlternativeStock[] }>({
        visible: false,
        loading: false,
        stocks: [],
    })

    // Modal de confirmación para completar con faltantes
    const [confirmIncompleteModal, setConfirmIncompleteModal] = useState(false)

    const [feedback, setFeedback] = useState<{ visible: boolean; type: FeedbackType; title: string; message: string }>({
        visible: false,
        type: 'info',
        title: '',
        message: '',
    })

    const loadData = useCallback(async () => {
        setLoading(true)
        try {
            const data = await PickingService.getById(pickingId)
            setPicking(data)
        } catch (error) {
            setFeedback({
                visible: true,
                type: 'error',
                title: 'Error al cargar',
                message: getUserFriendlyMessage(error, 'LOAD_ERROR'),
            })
            onBack()
        } finally {
            setLoading(false)
        }
    }, [pickingId, onBack])

    useEffect(() => {
        loadData()
    }, [loadData])

    // Abrir modal de pickeo para un item
    const openPickModal = (item: PickingItem) => {
        const remaining = (item.cantidadSolicitada || 0) - (item.cantidadPickeada || 0)
        setPickModal({
            visible: true,
            item,
            cantidad: remaining > 0 ? String(remaining) : '',
            motivoDesviacion: '',
            notasBodeguero: '',
            loteSeleccionado: null,
        })
    }

    // Cerrar modal de pickeo
    const closePickModal = () => {
        setPickModal({
            visible: false,
            item: null,
            cantidad: '',
            motivoDesviacion: '',
            notasBodeguero: '',
            loteSeleccionado: null,
        })
    }

    // Cargar lotes alternativos
    const loadAlternativeStocks = async () => {
        if (!pickModal.item) return
        setLotesModal({ visible: true, loading: true, stocks: [] })
        try {
            const stocks = await PickingService.getAlternativeStocks(pickModal.item.productoId)
            setLotesModal({ visible: true, loading: false, stocks })
        } catch (error) {
            setFeedback({
                visible: true,
                type: 'error',
                title: 'Error',
                message: 'No se pudieron cargar los lotes alternativos',
            })
            setLotesModal({ visible: false, loading: false, stocks: [] })
        }
    }

    // Seleccionar un lote alternativo
    const selectAlternativeLote = (stock: AlternativeStock) => {
        setPickModal(prev => ({
            ...prev,
            loteSeleccionado: {
                id: stock.lote.id,
                numeroLote: stock.lote.numeroLote || stock.lote.id.slice(0, 8),
                ubicacionId: stock.ubicacion.id,
                ubicacionLabel: stock.ubicacion.codigoVisual || stock.ubicacion.id.slice(0, 8),
            },
        }))
        setLotesModal({ visible: false, loading: false, stocks: [] })
    }

    // Confirmar pickeo
    const handleConfirmPick = async () => {
        if (!pickModal.item || !picking) return

        const qty = Number(pickModal.cantidad || 0)
        if (Number.isNaN(qty) || qty < 0) {
            setFeedback({ visible: true, type: 'warning', title: 'Cantidad Invalida', message: 'Ingresa una cantidad valida (0 o mayor).' })
            return
        }

        const solicitada = pickModal.item.cantidadSolicitada || 0
        if (qty > solicitada) {
            setFeedback({ visible: true, type: 'warning', title: 'Cantidad Excedida', message: `No puedes ingresar mas de ${solicitada} unidades.` })
            return
        }

        // Validar motivo si es cantidad menor
        if (qty < solicitada && !pickModal.motivoDesviacion) {
            setFeedback({ visible: true, type: 'warning', title: 'Motivo Requerido', message: 'Debes indicar un motivo de desviacion si la cantidad es menor a la solicitada.' })
            return
        }

        setSaving(true)
        try {
            // Calcular delta (cantidad a agregar)
            const currentPicked = pickModal.item.cantidadPickeada || 0
            const delta = qty - currentPicked

            if (delta === 0 && !pickModal.motivoDesviacion) {
                closePickModal()
                setSaving(false)
                return
            }

            // Resolver lote: usar seleccionado o sugerido
            let loteId: string | undefined
            if (pickModal.loteSeleccionado) {
                loteId = pickModal.loteSeleccionado.id
            } else if (pickModal.item.loteSugerido) {
                loteId = typeof pickModal.item.loteSugerido === 'string'
                    ? pickModal.item.loteSugerido
                    : (pickModal.item.loteSugerido as { id: string }).id
            }

            await PickingService.pickItem(pickingId, pickModal.item.id, delta > 0 ? delta : qty, {
                loteConfirmado: loteId,
                motivoDesviacion: pickModal.motivoDesviacion || undefined,
                notasBodeguero: pickModal.notasBodeguero || undefined,
                ubicacionConfirmada: pickModal.loteSeleccionado?.ubicacionId,
            })

            setFeedback({ visible: true, type: 'success', title: 'Registrado', message: `Se registro el pickeo correctamente.` })
            closePickModal()
            await loadData()
            onUpdated()
        } catch (error) {
            setFeedback({
                visible: true,
                type: 'error',
                title: 'Error',
                message: getUserFriendlyMessage(error, 'UPDATE_ERROR'),
            })
        } finally {
            setSaving(false)
        }
    }

    const handleStart = async () => {
        if (!picking) return
        setSaving(true)
        try {
            await PickingService.start(picking.id)
            setFeedback({ visible: true, type: 'success', title: 'Picking Iniciado', message: 'Ahora puedes comenzar a registrar los productos que vas preparando.' })
            await loadData()
            onUpdated()
        } catch (error) {
            setFeedback({
                visible: true,
                type: 'error',
                title: 'Error',
                message: getUserFriendlyMessage(error, 'UPDATE_ERROR'),
            })
        } finally {
            setSaving(false)
        }
    }

    const handleComplete = async () => {
        if (!picking) return
        setSaving(true)
        try {
            await PickingService.complete(pickingId)
            setFeedback({ visible: true, type: 'success', title: 'Picking Completado', message: 'El stock ha sido descontado y la orden esta lista para entrega.' })
            onUpdated()
            onBack()
        } catch (error) {
            setFeedback({
                visible: true,
                type: 'error',
                title: 'No se pudo completar',
                message: getUserFriendlyMessage(error, 'UPDATE_ERROR'),
            })
        } finally {
            setSaving(false)
            setConfirmIncompleteModal(false)
        }
    }

    const getProgress = () => {
        if (!picking?.items?.length) return 0
        const total = picking.items.reduce((acc, item) => acc + (item.cantidadSolicitada || 0), 0)
        const picked = picking.items.reduce((acc, item) => acc + (item.cantidadPickeada || 0), 0)
        return total > 0 ? Math.round((picked / total) * 100) : 0
    }

    const allItemsComplete = () => {
        if (!picking?.items?.length) return false
        return picking.items.every((item) => (item.cantidadPickeada || 0) >= (item.cantidadSolicitada || 0))
    }

    const hasAnyPicked = () => {
        if (!picking?.items?.length) return false
        return picking.items.some((item) => (item.cantidadPickeada || 0) > 0)
    }

    const getIncompleteCount = () => {
        if (!picking?.items?.length) return 0
        return picking.items.filter((item) => (item.cantidadPickeada || 0) < (item.cantidadSolicitada || 0)).length
    }

    // Verificar si cantidad es menor que solicitada (para mostrar campos de desviación)
    const isDeviationNeeded = () => {
        if (!pickModal.item) return false
        const solicitada = pickModal.item.cantidadSolicitada || 0
        const cantidad = Number(pickModal.cantidad || 0)
        return cantidad < solicitada
    }

    const estadoConfig = getEstadoConfig(picking?.estado)
    const progress = getProgress()

    // Obtener info del lote para mostrar en el modal
    const getLoteInfo = () => {
        if (pickModal.loteSeleccionado) {
            return {
                numero: pickModal.loteSeleccionado.numeroLote,
                ubicacion: pickModal.loteSeleccionado.ubicacionLabel,
                isOverride: true,
            }
        }
        if (pickModal.item?.loteInfo?.numeroLote || pickModal.item?.loteSugerido) {
            const numero = pickModal.item.loteInfo?.numeroLote ||
                (typeof pickModal.item.loteSugerido === 'string'
                    ? pickModal.item.loteSugerido.slice(0, 8)
                    : '')
            const ubicacion = pickModal.item.ubicacionSugerida?.codigoVisual || 'N/A'
            return { numero, ubicacion, isOverride: false }
        }
        return { numero: 'N/A', ubicacion: 'N/A', isOverride: false }
    }

    const loteInfo = getLoteInfo()

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Detalle de Picking" variant="standard" onBackPress={onBack} />

            <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 140 }}>
                {picking && (
                    <>
                        {/* Card de información del picking */}
                        <View className="bg-white rounded-2xl border border-neutral-100 overflow-hidden mb-4" style={{ elevation: 2 }}>
                            <View className="p-4">
                                <View className="flex-row items-start justify-between mb-3">
                                    <View className="flex-1">
                                        <Text className="text-xl font-bold text-neutral-900">
                                            {picking.pedido?.numero
                                                ? `Pedido #${picking.pedido.numero}`
                                                : `Picking #${picking.id.slice(0, 8).toUpperCase()}`}
                                        </Text>
                                        {picking.pedido?.clienteNombre && (
                                            <Text className="text-sm text-neutral-600 mt-0.5" numberOfLines={1}>
                                                {picking.pedido.clienteNombre}
                                            </Text>
                                        )}
                                        <Text className="text-sm text-neutral-400 mt-1">
                                            Creado: {formatDate(picking.createdAt)}
                                        </Text>
                                    </View>
                                    <StatusBadge label={estadoConfig.label} variant={estadoConfig.variant} size="md" />
                                </View>

                                <View className="flex-row flex-wrap gap-2 mb-4">
                                    <View className="flex-row items-center bg-neutral-100 px-3 py-1.5 rounded-full">
                                        <Ionicons name="cube-outline" size={14} color="#6B7280" />
                                        <Text className="text-xs font-semibold text-neutral-600 ml-1">
                                            {picking.items?.length || 0} productos
                                        </Text>
                                    </View>
                                    {picking.bodegueroNombre || picking.bodegueroAsignado?.nombreCompleto ? (
                                        <View className="flex-row items-center bg-blue-50 px-3 py-1.5 rounded-full">
                                            <Ionicons name="person" size={14} color="#2563EB" />
                                            <Text className="text-xs font-semibold text-blue-700 ml-1" numberOfLines={1}>
                                                {picking.bodegueroNombre || picking.bodegueroAsignado?.nombreCompleto}
                                            </Text>
                                        </View>
                                    ) : picking.bodegueroId ? (
                                        <View className="flex-row items-center bg-blue-50 px-3 py-1.5 rounded-full">
                                            <Ionicons name="person" size={14} color="#2563EB" />
                                            <Text className="text-xs font-semibold text-blue-700 ml-1">Asignado</Text>
                                        </View>
                                    ) : (
                                        <View className="flex-row items-center bg-amber-50 px-3 py-1.5 rounded-full">
                                            <Ionicons name="alert-circle-outline" size={14} color="#D97706" />
                                            <Text className="text-xs font-semibold text-amber-700 ml-1">Sin asignar</Text>
                                        </View>
                                    )}
                                </View>

                                {picking.estado === 'EN_PROCESO' && (
                                    <View className="mb-2">
                                        <View className="flex-row justify-between mb-1">
                                            <Text className="text-sm text-neutral-500">Progreso general</Text>
                                            <Text className="text-sm font-bold text-neutral-700">{progress}%</Text>
                                        </View>
                                        <View className="h-3 bg-neutral-100 rounded-full overflow-hidden">
                                            <View
                                                className="h-full rounded-full"
                                                style={{ width: `${progress}%`, backgroundColor: progress === 100 ? '#059669' : '#7C3AED' }}
                                            />
                                        </View>
                                    </View>
                                )}
                            </View>

                            {(picking as any).fecha_inicio && (
                                <View className="px-4 py-3 bg-neutral-50 border-t border-neutral-100">
                                    <View className="flex-row items-center">
                                        <Ionicons name="time-outline" size={16} color="#6B7280" />
                                        <Text className="text-xs text-neutral-600 ml-2">
                                            Iniciado: {formatDate((picking as any).fecha_inicio)}
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>

                        <Text className="text-base font-bold text-neutral-800 mb-3 px-1">
                            Productos a preparar ({picking.items?.length || 0})
                        </Text>

                        {/* Lista de items */}
                        {(picking.items || []).map((item, index) => {
                            const itemEstado = getItemEstadoConfig(item.estadoLinea)
                            const remaining = (item.cantidadSolicitada || 0) - (item.cantidadPickeada || 0)
                            const isComplete = remaining <= 0

                            return (
                                <Pressable
                                    key={item.id}
                                    onPress={() => allowPick && picking.estado === 'EN_PROCESO' && openPickModal(item)}
                                    className="bg-white rounded-2xl border border-neutral-100 overflow-hidden mb-3 active:opacity-90"
                                    style={{ elevation: 2 }}
                                >
                                    <View className="p-4">
                                        <View className="flex-row items-start">
                                            <View
                                                className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                                                style={{ backgroundColor: isComplete ? '#D1FAE5' : '#F3F4F6' }}
                                            >
                                                {isComplete ? (
                                                    <Ionicons name="checkmark-circle" size={22} color="#059669" />
                                                ) : (
                                                    <Text className="text-sm font-bold text-neutral-500">{index + 1}</Text>
                                                )}
                                            </View>
                                            <View className="flex-1">
                                                <Text className="text-base font-bold text-neutral-900" numberOfLines={2}>
                                                    {getItemName(item)}
                                                </Text>
                                                {item.sku && item.nombreProducto && (
                                                    <Text className="text-xs text-neutral-400 mt-0.5">SKU: {item.sku}</Text>
                                                )}
                                                <View className="flex-row items-center mt-2 gap-3">
                                                    <View className="flex-row items-center">
                                                        <Text className="text-xs text-neutral-500">Solicitado:</Text>
                                                        <Text className="text-xs font-bold text-neutral-700 ml-1">{formatQuantity(item.cantidadSolicitada)}</Text>
                                                    </View>
                                                    <View className="flex-row items-center">
                                                        <Text className="text-xs text-neutral-500">Preparado:</Text>
                                                        <Text className="text-xs font-bold text-neutral-700 ml-1">{formatQuantity(item.cantidadPickeada)}</Text>
                                                    </View>
                                                </View>
                                            </View>
                                            <View className="items-end">
                                                <StatusBadge label={itemEstado.label} variant={itemEstado.variant} size="sm" />
                                                {!isComplete && (
                                                    <View className="flex-row items-center mt-2">
                                                        <Text className="text-xs text-neutral-400">Faltan</Text>
                                                        <Text className="text-sm font-bold ml-1" style={{ color: BRAND_COLORS.red }}>{formatQuantity(remaining)}</Text>
                                                    </View>
                                                )}
                                            </View>
                                        </View>

                                        {/* Info de lote y ubicación */}
                                        {(item.loteSugerido || item.loteInfo?.numeroLote || item.ubicacionSugerida?.codigoVisual) && (
                                            <View className="mt-3 pt-3 border-t border-neutral-100">
                                                {(item.loteInfo?.numeroLote || item.loteSugerido) && (
                                                    <View className="flex-row items-center mb-1">
                                                        <Ionicons name="pricetag-outline" size={14} color="#6B7280" />
                                                        <Text className="text-xs text-neutral-500 ml-1">
                                                            Lote: <Text className="font-semibold">{item.loteInfo?.numeroLote || (typeof item.loteSugerido === 'string' ? item.loteSugerido.slice(0, 8) : '')}</Text>
                                                        </Text>
                                                    </View>
                                                )}
                                                {item.ubicacionSugerida?.codigoVisual && (
                                                    <View className="flex-row items-center">
                                                        <Ionicons name="location-outline" size={14} color="#6B7280" />
                                                        <Text className="text-xs text-neutral-500 ml-1">
                                                            Ubicacion: <Text className="font-semibold">{item.ubicacionSugerida.codigoVisual}</Text>
                                                            {item.ubicacionSugerida.nombre && ` - ${item.ubicacionSugerida.nombre}`}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                        )}

                                        {/* Indicador de toque para editar */}
                                        {allowPick && picking.estado === 'EN_PROCESO' && (
                                            <View className="mt-3 pt-3 border-t border-neutral-100 flex-row items-center justify-center">
                                                <Ionicons name="create-outline" size={16} color="#7C3AED" />
                                                <Text className="text-xs font-medium text-purple-600 ml-1">
                                                    Toca para {isComplete ? 'editar' : 'registrar pickeo'}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </Pressable>
                            )
                        })}
                    </>
                )}
            </ScrollView>

            {/* Barra de acciones fija */}
            {picking && (
                <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#e5e7eb', padding: 16, paddingBottom: 32, elevation: 10 }}>
                    {allowStart && (picking.estado === 'PENDIENTE' || picking.estado === 'ASIGNADO') && (
                        <View className="flex-row items-center">
                            <View className="mr-3 bg-purple-100 p-2 rounded-full">
                                <Ionicons name="play-circle-outline" size={24} color="#7C3AED" />
                            </View>
                            <View className="flex-1">
                                <PrimaryButton
                                    title={saving ? 'Iniciando...' : 'Iniciar Picking'}
                                    onPress={handleStart}
                                    loading={saving}
                                    disabled={saving}
                                />
                            </View>
                        </View>
                    )}

                    {allowComplete && picking.estado === 'EN_PROCESO' && allItemsComplete() && (
                        <View className="flex-row items-center">
                            <View className="mr-3 bg-green-100 p-2 rounded-full">
                                <Ionicons name="checkmark-circle-outline" size={24} color="#059669" />
                            </View>
                            <View className="flex-1">
                                <PrimaryButton
                                    title={saving ? 'Completando...' : 'Completar Picking'}
                                    onPress={handleComplete}
                                    loading={saving}
                                    disabled={saving}
                                />
                            </View>
                        </View>
                    )}

                    {/* Botón para completar con faltantes */}
                    {allowComplete && picking.estado === 'EN_PROCESO' && !allItemsComplete() && hasAnyPicked() && (
                        <View>
                            <View className="flex-row items-center justify-center py-2 px-4 bg-amber-50 rounded-xl mb-3">
                                <Ionicons name="alert-circle" size={18} color="#D97706" />
                                <Text className="text-sm text-amber-700 ml-2 font-medium">
                                    {getIncompleteCount()} item(s) con faltantes
                                </Text>
                            </View>
                            <Pressable
                                onPress={() => setConfirmIncompleteModal(true)}
                                disabled={saving}
                                className="flex-row items-center justify-center py-3 px-4 rounded-2xl active:opacity-90"
                                style={{ backgroundColor: '#D97706' }}
                            >
                                <Ionicons name="warning-outline" size={20} color="#fff" />
                                <Text className="text-white font-bold ml-2">
                                    {saving ? 'Procesando...' : 'Completar con Faltantes'}
                                </Text>
                            </Pressable>
                        </View>
                    )}

                    {/* Mensaje si no hay nada pickeado aún */}
                    {allowComplete && picking.estado === 'EN_PROCESO' && !hasAnyPicked() && (
                        <View className="flex-row items-center justify-center py-3 px-4 bg-neutral-100 rounded-xl">
                            <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
                            <Text className="text-sm text-neutral-600 ml-2">
                                Registra al menos un item para completar
                            </Text>
                        </View>
                    )}

                    {picking.estado === 'COMPLETADO' && (
                        <View className="flex-row items-center justify-center py-3 px-4 bg-green-50 rounded-xl">
                            <Ionicons name="checkmark-circle" size={24} color="#059669" />
                            <Text className="text-base text-green-700 ml-2 font-bold">
                                Picking Completado
                            </Text>
                        </View>
                    )}
                </View>
            )}

            {/* Modal de Pickeo con campos de desviación */}
            <GenericModal
                visible={pickModal.visible}
                onClose={closePickModal}
                title={`Registrar: ${pickModal.item ? getItemName(pickModal.item) : ''}`}
                height="75%"
            >
                {pickModal.item && (
                    <View className="pb-6">
                        {/* Resumen de cantidades */}
                        <View className="bg-neutral-50 rounded-2xl p-4 mb-5">
                            <View className="flex-row justify-between">
                                <View className="items-center flex-1">
                                    <Text className="text-xs text-neutral-500 uppercase font-semibold mb-1">Solicitado</Text>
                                    <Text className="text-2xl font-bold text-neutral-900">{formatQuantity(pickModal.item.cantidadSolicitada)}</Text>
                                </View>
                                <View className="items-center flex-1">
                                    <Text className="text-xs text-neutral-500 uppercase font-semibold mb-1">Pickeado</Text>
                                    <Text className="text-2xl font-bold text-blue-600">{formatQuantity(pickModal.item.cantidadPickeada)}</Text>
                                </View>
                                <View className="items-center flex-1">
                                    <Text className="text-xs text-neutral-500 uppercase font-semibold mb-1">Faltan</Text>
                                    <Text className="text-2xl font-bold text-orange-500">
                                        {formatQuantity((pickModal.item.cantidadSolicitada || 0) - (pickModal.item.cantidadPickeada || 0))}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Campo de cantidad */}
                        <View className="mb-4">
                            <Text className="text-sm font-semibold text-neutral-700 mb-2">Cantidad Total Recogida</Text>
                            <View className="flex-row items-center gap-2">
                                <View className="flex-1">
                                    <TextInput
                                        className="bg-white border-2 border-neutral-200 rounded-xl px-4 py-3 text-lg font-bold text-neutral-900"
                                        value={pickModal.cantidad}
                                        onChangeText={(v) => {
                                            if (v === '' || /^\d*\.?\d*$/.test(v)) {
                                                setPickModal(prev => ({ ...prev, cantidad: v }))
                                            }
                                        }}
                                        keyboardType="numeric"
                                        placeholder="0"
                                    />
                                </View>
                                <Pressable
                                    onPress={() => setPickModal(prev => ({ ...prev, cantidad: String(prev.item?.cantidadSolicitada || 0) }))}
                                    className="bg-purple-100 px-4 py-3 rounded-xl active:bg-purple-200"
                                >
                                    <Text className="text-purple-700 font-bold">TODO</Text>
                                </Pressable>
                            </View>
                        </View>

                        {/* Sección de desviación (solo si cantidad < solicitada) */}
                        {isDeviationNeeded() && (
                            <View className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-4">
                                <View className="flex-row items-start mb-3">
                                    <Ionicons name="warning-outline" size={20} color="#D97706" />
                                    <Text className="text-sm font-medium text-orange-800 ml-2 flex-1">
                                        Has indicado una cantidad menor a la solicitada. Por favor indica el motivo.
                                    </Text>
                                </View>

                                {/* Selector de motivo */}
                                <View className="mb-3">
                                    <Text className="text-sm font-semibold text-neutral-700 mb-2">
                                        Motivo de desviacion <Text className="text-red-500">*</Text>
                                    </Text>
                                    <View className="flex-row flex-wrap gap-2">
                                        {MOTIVOS_DESVIACION.map((motivo) => (
                                            <Pressable
                                                key={motivo.value}
                                                onPress={() => setPickModal(prev => ({ ...prev, motivoDesviacion: motivo.value }))}
                                                className={`px-3 py-2 rounded-xl border ${pickModal.motivoDesviacion === motivo.value
                                                        ? 'bg-orange-100 border-orange-400'
                                                        : 'bg-white border-neutral-200'
                                                    }`}
                                            >
                                                <Text className={`text-sm font-medium ${pickModal.motivoDesviacion === motivo.value
                                                        ? 'text-orange-700'
                                                        : 'text-neutral-600'
                                                    }`}>
                                                    {motivo.label}
                                                </Text>
                                            </Pressable>
                                        ))}
                                    </View>
                                </View>

                                {/* Nota para el cliente */}
                                <View>
                                    <Text className="text-sm font-semibold text-neutral-700 mb-2">
                                        Nota para el Cliente (Opcional)
                                    </Text>
                                    <TextInput
                                        className="bg-white border border-neutral-200 rounded-xl px-4 py-3 text-sm text-neutral-900 min-h-[80px]"
                                        value={pickModal.notasBodeguero}
                                        onChangeText={(v) => setPickModal(prev => ({ ...prev, notasBodeguero: v }))}
                                        placeholder="Ej: Solo encontre 5 unidades en buen estado..."
                                        multiline
                                        textAlignVertical="top"
                                    />
                                </View>
                            </View>
                        )}

                        {/* Info del lote y botón cambiar */}
                        <View className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-5">
                            <View className="flex-row items-center justify-between">
                                <View className="flex-1">
                                    <Text className="text-xs text-blue-600 font-bold uppercase mb-1">
                                        Lote {loteInfo.isOverride ? 'Seleccionado' : 'Sugerido'}
                                    </Text>
                                    <Text className="text-base font-bold text-neutral-900">{loteInfo.numero}</Text>
                                    <Text className="text-xs text-neutral-500">Ubicacion: {loteInfo.ubicacion}</Text>
                                </View>
                                <Pressable
                                    onPress={loadAlternativeStocks}
                                    className="bg-blue-100 px-4 py-2 rounded-xl active:bg-blue-200"
                                >
                                    <View className="flex-row items-center">
                                        <Ionicons name="swap-horizontal" size={16} color="#2563EB" />
                                        <Text className="text-blue-700 font-semibold ml-1">Cambiar</Text>
                                    </View>
                                </Pressable>
                            </View>
                        </View>

                        {/* Botones de acción */}
                        <View className="flex-row gap-3">
                            <Pressable
                                onPress={closePickModal}
                                className="flex-1 bg-neutral-100 py-4 rounded-xl active:bg-neutral-200"
                            >
                                <Text className="text-center text-neutral-600 font-semibold">Cancelar</Text>
                            </Pressable>
                            <Pressable
                                onPress={handleConfirmPick}
                                disabled={saving}
                                className="flex-1 py-4 rounded-xl active:opacity-90"
                                style={{ backgroundColor: BRAND_COLORS.red }}
                            >
                                {saving ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text className="text-center text-white font-bold">Confirmar Pickeo</Text>
                                )}
                            </Pressable>
                        </View>
                    </View>
                )}
            </GenericModal>

            {/* Modal de Lotes Alternativos */}
            <GenericModal
                visible={lotesModal.visible}
                onClose={() => setLotesModal({ visible: false, loading: false, stocks: [] })}
                title="Seleccionar Lote Alternativo"
                height="60%"
            >
                {lotesModal.loading ? (
                    <View className="py-10 items-center">
                        <ActivityIndicator size="large" color={BRAND_COLORS.red} />
                        <Text className="text-neutral-500 mt-3">Cargando lotes disponibles...</Text>
                    </View>
                ) : lotesModal.stocks.length === 0 ? (
                    <View className="py-10 items-center">
                        <Ionicons name="cube-outline" size={48} color="#D1D5DB" />
                        <Text className="text-neutral-500 mt-3 text-center">No se encontraron otros lotes disponibles para este producto.</Text>
                    </View>
                ) : (
                    <View className="pb-4">
                        {lotesModal.stocks.map((stock, idx) => (
                            <Pressable
                                key={idx}
                                onPress={() => selectAlternativeLote(stock)}
                                className="bg-white border border-neutral-200 rounded-xl p-4 mb-3 active:bg-neutral-50"
                            >
                                <View className="flex-row items-center justify-between">
                                    <View className="flex-1">
                                        <Text className="text-base font-bold text-neutral-900">
                                            Lote: {stock.lote.numeroLote || stock.lote.id.slice(0, 8)}
                                        </Text>
                                        {stock.lote.fechaVencimiento && (
                                            <Text className="text-xs text-neutral-500 mt-1">
                                                Vence: {new Date(stock.lote.fechaVencimiento).toLocaleDateString('es-EC')}
                                            </Text>
                                        )}
                                    </View>
                                    <View className="items-end">
                                        <View className="bg-neutral-100 px-2 py-1 rounded-lg mb-1">
                                            <Text className="text-xs font-mono font-bold text-neutral-700">
                                                {stock.ubicacion.codigoVisual || stock.ubicacion.id.slice(0, 8)}
                                            </Text>
                                        </View>
                                        <Text className="text-sm font-bold text-green-600">
                                            Disp: {formatQuantity(stock.cantidadDisponible)}
                                        </Text>
                                    </View>
                                </View>
                            </Pressable>
                        ))}
                    </View>
                )}
            </GenericModal>

            {/* Modal de confirmación para completar con faltantes */}
            <ConfirmationModal
                visible={confirmIncompleteModal}
                title="Completar con Faltantes"
                message={`Hay ${getIncompleteCount()} item(s) con cantidad menor a la solicitada. Los items faltantes se marcaran con su motivo de desviacion. ¿Deseas continuar?`}
                confirmText="Si, Completar"
                cancelText="Revisar Items"
                icon="warning-outline"
                iconColor="#D97706"
                onConfirm={handleComplete}
                onCancel={() => setConfirmIncompleteModal(false)}
            />

            <FeedbackModal
                visible={feedback.visible}
                type={feedback.type}
                title={feedback.title}
                message={feedback.message}
                onClose={() => setFeedback((prev) => ({ ...prev, visible: false }))}
            />
        </View>
    )
}

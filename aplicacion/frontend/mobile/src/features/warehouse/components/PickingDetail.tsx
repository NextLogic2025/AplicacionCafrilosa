import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { Header } from '../../../components/ui/Header'
import { TextField } from '../../../components/ui/TextField'
import { PrimaryButton } from '../../../components/ui/PrimaryButton'
import { FeedbackModal, type FeedbackType } from '../../../components/ui/FeedbackModal'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { PickingService, type Picking, type PickingItem } from '../../../services/api/PickingService'
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

const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'No disponible'
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
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
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [cantidadMap, setCantidadMap] = useState<Record<string, string>>({})
    const [expandedItem, setExpandedItem] = useState<string | null>(null)
    const [feedback, setFeedback] = useState<{ visible: boolean; type: FeedbackType; title: string; message: string }>({
        visible: false,
        type: 'info',
        title: '',
        message: '',
    })

    const loadData = async () => {
        setLoading(true)
        try {
            const data = await PickingService.getById(pickingId)
            setPicking(data)
            const defaults: Record<string, string> = {}
            ;(data.items || []).forEach((it) => {
                const remaining = (it.cantidadSolicitada || 0) - (it.cantidadPickeada || 0)
                defaults[it.id] = remaining > 0 ? String(remaining) : ''
            })
            setCantidadMap(defaults)
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
    }

    useEffect(() => {
        loadData()
    }, [pickingId])

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

    const handlePick = async (item: PickingItem) => {
        const amount = cantidadMap[item.id]
        const qty = Number(amount || 0)
        if (Number.isNaN(qty) || qty <= 0) {
            setFeedback({ visible: true, type: 'warning', title: 'Cantidad Invalida', message: 'Ingresa una cantidad mayor a 0.' })
            return
        }
        setSaving(true)
        try {
            await PickingService.pickItem(pickingId, item.id, qty, item.loteSugerido || undefined)
            setFeedback({ visible: true, type: 'success', title: 'Registrado', message: `Se registraron ${qty} unidades correctamente.` })
            await loadData()
            onUpdated()
            setExpandedItem(null)
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

    const estadoConfig = getEstadoConfig(picking?.estado)
    const progress = getProgress()

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Detalle de Picking" variant="standard" onBackPress={onBack} />

            <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
                {picking && (
                    <>
                        <View className="bg-white rounded-2xl border border-neutral-100 overflow-hidden mb-4" style={{ elevation: 2 }}>
                            <View className="p-4">
                                <View className="flex-row items-start justify-between mb-3">
                                    <View className="flex-1">
                                        <Text className="text-xl font-bold text-neutral-900">
                                            Picking #{picking.id.slice(0, 8).toUpperCase()}
                                        </Text>
                                        <Text className="text-sm text-neutral-500 mt-1">
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
                                    {picking.bodegueroId ? (
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

                            {picking.fecha_inicio && (
                                <View className="px-4 py-3 bg-neutral-50 border-t border-neutral-100">
                                    <View className="flex-row items-center">
                                        <Ionicons name="time-outline" size={16} color="#6B7280" />
                                        <Text className="text-xs text-neutral-600 ml-2">
                                            Iniciado: {formatDate(picking.fecha_inicio)}
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>

                        <Text className="text-base font-bold text-neutral-800 mb-3 px-1">
                            Productos a preparar ({picking.items?.length || 0})
                        </Text>

                        {(picking.items || []).map((item, index) => {
                            const itemEstado = getItemEstadoConfig(item.estadoLinea)
                            const remaining = (item.cantidadSolicitada || 0) - (item.cantidadPickeada || 0)
                            const isComplete = remaining <= 0
                            const isExpanded = expandedItem === item.id

                            return (
                                <View
                                    key={item.id}
                                    className="bg-white rounded-2xl border border-neutral-100 overflow-hidden mb-3"
                                    style={{ elevation: 2 }}
                                >
                                    <Pressable
                                        className="p-4"
                                        onPress={() => setExpandedItem(isExpanded ? null : item.id)}
                                    >
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
                                                    {item.nombreProducto || `Producto ${index + 1}`}
                                                </Text>
                                                <View className="flex-row items-center mt-2 gap-3">
                                                    <View className="flex-row items-center">
                                                        <Text className="text-xs text-neutral-500">Solicitado:</Text>
                                                        <Text className="text-xs font-bold text-neutral-700 ml-1">{item.cantidadSolicitada}</Text>
                                                    </View>
                                                    <View className="flex-row items-center">
                                                        <Text className="text-xs text-neutral-500">Preparado:</Text>
                                                        <Text className="text-xs font-bold text-neutral-700 ml-1">{item.cantidadPickeada || 0}</Text>
                                                    </View>
                                                </View>
                                            </View>
                                            <View className="items-end">
                                                <StatusBadge label={itemEstado.label} variant={itemEstado.variant} size="sm" />
                                                {!isComplete && (
                                                    <View className="flex-row items-center mt-2">
                                                        <Text className="text-xs text-neutral-400">Faltan</Text>
                                                        <Text className="text-sm font-bold ml-1" style={{ color: BRAND_COLORS.red }}>{remaining}</Text>
                                                    </View>
                                                )}
                                            </View>
                                        </View>

                                        {item.loteSugerido && (
                                            <View className="flex-row items-center mt-3 pt-3 border-t border-neutral-100">
                                                <Ionicons name="pricetag-outline" size={14} color="#6B7280" />
                                                <Text className="text-xs text-neutral-500 ml-1">
                                                    Lote sugerido: <Text className="font-semibold">{item.loteSugerido.slice(0, 8)}</Text>
                                                </Text>
                                            </View>
                                        )}
                                    </Pressable>

                                    {isExpanded && allowPick && !isComplete && picking.estado === 'EN_PROCESO' && (
                                        <View className="px-4 pb-4 pt-2 border-t border-neutral-100 bg-neutral-50">
                                            <TextField
                                                label="Cantidad a registrar"
                                                value={cantidadMap[item.id] ?? ''}
                                                onChangeText={(v) => setCantidadMap((prev) => ({ ...prev, [item.id]: v }))}
                                                keyboardType="numeric"
                                                placeholder={`Maximo: ${remaining}`}
                                            />
                                            <PrimaryButton
                                                title={saving ? 'Registrando...' : 'Confirmar Cantidad'}
                                                onPress={() => handlePick(item)}
                                                loading={saving}
                                                disabled={saving}
                                                style={{ marginTop: 12 }}
                                            />
                                        </View>
                                    )}
                                </View>
                            )
                        })}
                    </>
                )}
            </ScrollView>

            {picking && (
                <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-neutral-100 px-4 py-4" style={{ elevation: 10 }}>
                    {allowStart && picking.estado === 'PENDIENTE' && (
                        <PrimaryButton
                            title={saving ? 'Iniciando...' : 'Iniciar Picking'}
                            onPress={handleStart}
                            loading={saving}
                            disabled={saving}
                            icon="play-circle-outline"
                        />
                    )}

                    {allowComplete && picking.estado === 'EN_PROCESO' && allItemsComplete() && (
                        <PrimaryButton
                            title={saving ? 'Completando...' : 'Completar Picking'}
                            onPress={handleComplete}
                            loading={saving}
                            disabled={saving}
                            icon="checkmark-circle-outline"
                        />
                    )}

                    {allowComplete && picking.estado === 'EN_PROCESO' && !allItemsComplete() && (
                        <View className="flex-row items-center justify-center py-2 px-4 bg-amber-50 rounded-xl">
                            <Ionicons name="alert-circle" size={20} color="#D97706" />
                            <Text className="text-sm text-amber-700 ml-2 font-medium">
                                Completa todos los items para finalizar
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

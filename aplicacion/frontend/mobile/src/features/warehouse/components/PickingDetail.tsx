import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { Header } from '../../../components/ui/Header'
import { TextField } from '../../../components/ui/TextField'
import { PrimaryButton } from '../../../components/ui/PrimaryButton'
import { FeedbackModal, type FeedbackType } from '../../../components/ui/FeedbackModal'
import { PickingService, type Picking, type PickingItem } from '../../../services/api/PickingService'
import { getUserFriendlyMessage } from '../../../utils/errorMessages'
import { BRAND_COLORS } from '../../../shared/types'

type Props = {
    pickingId: string
    allowStart?: boolean
    allowComplete?: boolean
    onBack: () => void
    onUpdated: () => void
}

export function PickingDetail({ pickingId, allowStart = false, allowComplete = false, onBack, onUpdated }: Props) {
    const [picking, setPicking] = useState<Picking | null>(null)
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [cantidadMap, setCantidadMap] = useState<Record<string, string>>({})
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
                title: 'No se pudo cargar',
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
            setFeedback({ visible: true, type: 'success', title: 'Picking iniciado', message: 'Ya puedes registrar pickeo.' })
            await loadData()
            onUpdated()
        } catch (error) {
            setFeedback({
                visible: true,
                type: 'error',
                title: 'No se pudo iniciar',
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
            setFeedback({ visible: true, type: 'warning', title: 'Cantidad invalida', message: 'Ingresa una cantidad mayor a 0.' })
            return
        }
        setSaving(true)
        try {
            await PickingService.pickItem(pickingId, item.id, qty, item.loteSugerido || undefined)
            setFeedback({ visible: true, type: 'success', title: 'Pick registrado', message: 'La linea fue actualizada.' })
            await loadData()
            onUpdated()
        } catch (error) {
            setFeedback({
                visible: true,
                type: 'error',
                title: 'No se pudo pickear',
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
            setFeedback({ visible: true, type: 'success', title: 'Picking completado', message: 'Se desconto el stock.' })
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

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Detalle picking" variant="standard" onBackPress={onBack} />

            <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
                {picking ? (
                    <View className="bg-white p-4 rounded-3xl border border-neutral-100 shadow-sm">
                        <Text className="text-lg font-extrabold text-neutral-900">Picking #{picking.id?.slice(0, 6)}</Text>
                        <Text className="text-sm text-neutral-600 mt-1">Estado: {picking.estado}</Text>
                        <Text className="text-sm text-neutral-600 mt-1">Pedido: {picking.pedidoId ?? 'N/D'}</Text>
                    </View>
                ) : null}

                <View className="mt-4">
                    {(picking?.items || []).map((item) => (
                        <View key={item.id} className="bg-white p-4 rounded-2xl border border-neutral-100 shadow-sm mb-3">
                            <View className="flex-row justify-between items-start">
                                <View className="flex-1 pr-3">
                                    <Text className="text-base font-bold text-neutral-900" numberOfLines={1}>
                                        {item.nombreProducto || item.productoId}
                                    </Text>
                                    <Text className="text-xs text-neutral-500 mt-1">
                                        Solicitado: {item.cantidadSolicitada} | Pickeado: {item.cantidadPickeada ?? 0}
                                    </Text>
                                    {item.loteSugerido ? (
                                        <Text className="text-xs text-neutral-500 mt-1">Lote sugerido: {item.loteSugerido}</Text>
                                    ) : null}
                                </View>
                            </View>

                            <TextField
                                label="Cantidad a registrar"
                                value={cantidadMap[item.id] ?? ''}
                                onChangeText={(v) => setCantidadMap((prev) => ({ ...prev, [item.id]: v }))}
                                keyboardType="numeric"
                                placeholder="Ej. 5"
                            />

                            <PrimaryButton
                                title="Registrar pick"
                                onPress={() => handlePick(item)}
                                loading={saving}
                                disabled={saving}
                                style={{ marginTop: 12 }}
                            />
                        </View>
                    ))}
                </View>
            </ScrollView>

            {allowStart && picking?.estado === 'PENDIENTE' ? (
                <PrimaryButton
                    title={saving ? 'Iniciando...' : 'Iniciar picking'}
                    onPress={handleStart}
                    loading={saving}
                    disabled={saving}
                    style={{ marginHorizontal: 16, marginBottom: 12 }}
                />
            ) : null}

            {allowComplete && picking?.estado === 'EN_PROCESO' ? (
                <PrimaryButton
                    title={saving ? 'Completando...' : 'Completar picking'}
                    onPress={handleComplete}
                    loading={saving}
                    disabled={saving}
                    style={{ marginHorizontal: 16, marginBottom: 16 }}
                />
            ) : null}

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

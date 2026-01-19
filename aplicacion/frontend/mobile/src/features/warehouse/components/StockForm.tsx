import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { Header } from '../../../components/ui/Header'
import { TextField } from '../../../components/ui/TextField'
import { PrimaryButton } from '../../../components/ui/PrimaryButton'
import { PickerModal, type PickerOption } from '../../../components/ui/PickerModal'
import { FeedbackModal, type FeedbackType } from '../../../components/ui/FeedbackModal'
import { StockService, type StockItem } from '../../../services/api/StockService'
import { UbicacionService } from '../../../services/api/UbicacionService'
import { LoteService } from '../../../services/api/LoteService'
import { CatalogService } from '../../../services/api/CatalogService'
import { getUserFriendlyMessage } from '../../../utils/errorMessages'
import { BRAND_COLORS } from '../../../shared/types'

type Props = {
    stock?: StockItem
    onBack: () => void
    onSaved: () => void
}

export function StockForm({ stock, onBack, onSaved }: Props) {
    const isEdit = Boolean(stock)

    const [ubicacionId, setUbicacionId] = useState<string>(stock?.ubicacionId || '')
    const [loteId, setLoteId] = useState<string>(stock?.loteId || '')
    const [cantidad, setCantidad] = useState('')

    const [ubicOptions, setUbicOptions] = useState<PickerOption[]>([])
    const [loteOptions, setLoteOptions] = useState<PickerOption[]>([])
    const [pickerUbic, setPickerUbic] = useState(false)
    const [pickerLote, setPickerLote] = useState(false)

    const [feedback, setFeedback] = useState<{ visible: boolean; type: FeedbackType; title: string; message: string }>({
        visible: false,
        type: 'info',
        title: '',
        message: '',
    })
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        loadOptions()
    }, [])

    const loadOptions = async () => {
        try {
            setLoading(true)
            const [ubicaciones, lotes, productos] = await Promise.all([
                UbicacionService.list(),
                LoteService.list(),
                CatalogService.getProducts(),
            ])
            setUbicOptions(
                (ubicaciones || []).map((u) => ({
                    id: String(u.id),
                    label: u.codigoVisual || 'Ubicacion',
                    description: (u as any)?.almacen?.nombre,
                    icon: 'location',
                })),
            )
            const prodMap = new Map<string, string>()
            ;(productos || []).forEach((p) => prodMap.set(String(p.id), p.nombre || p.codigo_sku || 'Producto'))
            setLoteOptions(
                (lotes || []).map((l) => ({
                    id: String(l.id),
                    label: l.numeroLote,
                    description: l.productoId ? prodMap.get(String(l.productoId)) : undefined,
                    icon: 'cube',
                })),
            )
        } catch (error) {
            setFeedback({
                visible: true,
                type: 'error',
                title: 'No se pudieron cargar datos',
                message: getUserFriendlyMessage(error, 'LOAD_ERROR'),
            })
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async () => {
        if (!ubicacionId || !loteId) {
            setFeedback({
                visible: true,
                type: 'warning',
                title: 'Faltan datos',
                message: 'Selecciona ubicacion y lote.',
            })
            return
        }
        if (!cantidad.trim()) {
            setFeedback({
                visible: true,
                type: 'warning',
                title: 'Cantidad requerida',
                message: 'Ingresa la cantidad.',
            })
            return
        }

        const value = Number(cantidad)
        if (Number.isNaN(value)) {
            setFeedback({
                visible: true,
                type: 'warning',
                title: 'Numero invalido',
                message: 'Ingresa una cantidad numerica.',
            })
            return
        }

        setSaving(true)
        try {
            if (isEdit && stock) {
                await StockService.ajustar({
                    ubicacionId,
                    loteId,
                    cantidad: value,
                })
                setFeedback({ visible: true, type: 'success', title: 'Ajuste registrado', message: 'El stock se actualizo.' })
            } else {
                await StockService.create({
                    ubicacionId,
                    loteId,
                    cantidadFisica: value,
                })
                setFeedback({ visible: true, type: 'success', title: 'Stock creado', message: 'Ingreso inicial registrado.' })
            }
        } catch (error) {
            const raw = error instanceof Error ? error.message.toLowerCase() : ''
            let custom: string | undefined
            if (raw.includes('missing_user')) {
                custom = 'No se pudo registrar el movimiento. Intenta de nuevo.'
            }
            setFeedback({
                visible: true,
                type: 'error',
                title: 'No se pudo guardar',
                message: custom || getUserFriendlyMessage(error, isEdit ? 'UPDATE_ERROR' : 'CREATE_ERROR'),
            })
        } finally {
            setSaving(false)
        }
    }

    return (
        <KeyboardAvoidingView className="flex-1 bg-neutral-50" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Header title={isEdit ? 'Ajustar stock' : 'Nuevo stock'} variant="standard" onBackPress={onBack} />

            <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 32 }}>
                <View className="bg-white p-5 rounded-3xl border border-neutral-100 shadow-sm gap-4">
                    <Text className="text-lg font-extrabold text-neutral-900">{isEdit ? 'Ajuste de stock' : 'Ingreso inicial'}</Text>

                    <TouchableOpacity
                        className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50 flex-row items-center justify-between"
                        onPress={() => setPickerUbic(true)}
                        activeOpacity={0.7}
                        disabled={saving}
                    >
                        <View>
                            <Text className="text-xs text-neutral-500 font-semibold uppercase">Ubicacion</Text>
                            <Text className="text-base font-bold text-neutral-900 mt-1">
                                {ubicacionId
                                    ? ubicOptions.find((u) => u.id === String(ubicacionId))?.label || `Ubicacion ${ubicacionId}`
                                    : 'Seleccionar'}
                            </Text>
                        </View>
                        <Ionicons name="chevron-down" size={18} color="#6B7280" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50 flex-row items-center justify-between"
                        onPress={() => setPickerLote(true)}
                        activeOpacity={0.7}
                        disabled={saving}
                    >
                        <View>
                            <Text className="text-xs text-neutral-500 font-semibold uppercase">Lote</Text>
                            <Text className="text-base font-bold text-neutral-900 mt-1">
                                {loteId ? loteOptions.find((l) => l.id === String(loteId))?.label || `Lote ${loteId}` : 'Seleccionar'}
                            </Text>
                        </View>
                        <Ionicons name="chevron-down" size={18} color="#6B7280" />
                    </TouchableOpacity>

                    {isEdit ? (
                        <View className="flex-row items-center justify-between px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200">
                            <Text className="text-sm text-neutral-600">Cantidad actual</Text>
                            <Text className="text-lg font-extrabold text-neutral-900">{stock?.cantidadFisica ?? '--'}</Text>
                        </View>
                    ) : null}

                    <TextField
                        label={isEdit ? 'Ajuste (+/-)' : 'Cantidad inicial'}
                        placeholder={isEdit ? 'Ej. 5 o -3' : 'Ej. 100'}
                        value={cantidad}
                        onChangeText={setCantidad}
                        keyboardType="numeric"
                    />
                </View>

                <PrimaryButton
                    title={saving ? 'Guardando...' : isEdit ? 'Registrar ajuste' : 'Crear stock'}
                    onPress={handleSubmit}
                    loading={saving || loading}
                    disabled={saving}
                    style={{ marginTop: 16 }}
                />
            </ScrollView>

            <PickerModal
                visible={pickerUbic}
                title="Selecciona ubicacion"
                options={ubicOptions}
                selectedId={ubicacionId}
                onSelect={(id) => {
                    setUbicacionId(String(id))
                    setPickerUbic(false)
                }}
                onClose={() => setPickerUbic(false)}
                infoIcon="location-outline"
                infoColor={BRAND_COLORS.red}
            />

            <PickerModal
                visible={pickerLote}
                title="Selecciona lote"
                options={loteOptions}
                selectedId={loteId}
                onSelect={(id) => {
                    setLoteId(String(id))
                    setPickerLote(false)
                }}
                onClose={() => setPickerLote(false)}
                infoIcon="cube-outline"
                infoColor={BRAND_COLORS.red}
            />

            <FeedbackModal
                visible={feedback.visible}
                type={feedback.type}
                title={feedback.title}
                message={feedback.message}
                onClose={() => {
                    setFeedback((prev) => ({ ...prev, visible: false }))
                    if (feedback.type === 'success') onSaved()
                }}
            />
        </KeyboardAvoidingView>
    )
}

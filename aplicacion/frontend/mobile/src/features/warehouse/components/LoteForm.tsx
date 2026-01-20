import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, TextInput } from 'react-native'
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { Ionicons } from '@expo/vector-icons'

import { Header } from '../../../components/ui/Header'
import { PrimaryButton } from '../../../components/ui/PrimaryButton'
import { PickerModal, type PickerOption } from '../../../components/ui/PickerModal'
import { FeedbackModal, type FeedbackType } from '../../../components/ui/FeedbackModal'
import { CatalogService } from '../../../services/api/CatalogService'
import { LoteService, type LotePayload } from '../../../services/api/LoteService'
import { getUserFriendlyMessage } from '../../../utils/errorMessages'
import { BRAND_COLORS } from '../../../shared/types'

const LOTE_PREFIX = 'LOTE-'

// Opciones de estado de calidad
const ESTADOS_CALIDAD: PickerOption[] = [
    { id: 'LIBERADO', label: 'Liberado', description: 'Producto aprobado para venta', icon: 'checkmark-circle' },
    { id: 'RETENIDO', label: 'Retenido', description: 'En espera de revisión', icon: 'pause-circle' },
    { id: 'RECHAZADO', label: 'Rechazado', description: 'No apto para venta', icon: 'close-circle' },
    { id: 'EN_CUARENTENA', label: 'En Cuarentena', description: 'Aislado para análisis', icon: 'warning' },
]

type Props = {
    loteId?: string
    onBack: () => void
    onSaved: () => void
    allowDelete?: boolean
}

export function LoteForm({ loteId, onBack, onSaved, allowDelete = false }: Props) {
    const isEdit = Boolean(loteId)

    const [productoId, setProductoId] = useState<string>('')
    const [numeroLoteSuffix, setNumeroLoteSuffix] = useState('')
    const [fechaFab, setFechaFab] = useState('')
    const [fechaVen, setFechaVen] = useState('')
    const [estadoCalidad, setEstadoCalidad] = useState('LIBERADO')

    const [productOptions, setProductOptions] = useState<PickerOption[]>([])
    const [pickerVisible, setPickerVisible] = useState(false)
    const [estadoPickerVisible, setEstadoPickerVisible] = useState(false)
    const [showFabPicker, setShowFabPicker] = useState(false)
    const [showVenPicker, setShowVenPicker] = useState(false)

    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [feedback, setFeedback] = useState<{ visible: boolean; type: FeedbackType; title: string; message: string }>({
        visible: false,
        type: 'info',
        title: '',
        message: '',
    })

    // El número de lote completo es LOTE_PREFIX + numeroLoteSuffix
    const getFullLoteNumber = () => `${LOTE_PREFIX}${numeroLoteSuffix}`

    useEffect(() => {
        loadProducts()
        if (isEdit && loteId) loadLote(loteId)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loteId])

    const loadProducts = async () => {
        try {
            const products = await CatalogService.getProducts()
            setProductOptions(
                (products || []).map((p) => ({
                    id: String(p.id),
                    label: p.nombre || p.codigo_sku || 'Producto',
                    description: p.codigo_sku ? `SKU: ${p.codigo_sku}` : undefined,
                    icon: 'cube',
                })),
            )
        } catch (error) {
            setFeedback({
                visible: true,
                type: 'error',
                title: 'No se pudieron cargar productos',
                message: getUserFriendlyMessage(error, 'LOAD_ERROR'),
            })
        }
    }

    const loadLote = async (id: string) => {
        setLoading(true)
        try {
            const lote = await LoteService.getById(id)
            setProductoId(String(lote.productoId))
            // Si el lote tiene prefijo LOTE-, extraemos solo el sufijo
            const rawNumero = lote.numeroLote || ''
            if (rawNumero.startsWith(LOTE_PREFIX)) {
                setNumeroLoteSuffix(rawNumero.replace(LOTE_PREFIX, ''))
            } else {
                setNumeroLoteSuffix(rawNumero)
            }
            setFechaFab(lote.fechaFabricacion?.slice(0, 10) || '')
            setFechaVen(lote.fechaVencimiento?.slice(0, 10) || '')
            setEstadoCalidad(lote.estadoCalidad || 'LIBERADO')
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

    const formatDate = (date: Date) => {
        const y = date.getFullYear()
        const m = String(date.getMonth() + 1).padStart(2, '0')
        const d = String(date.getDate()).padStart(2, '0')
        return `${y}-${m}-${d}`
    }

    const handleDateChange = (event: DateTimePickerEvent, date: Date | undefined, type: 'fab' | 'ven') => {
        if (event.type !== 'set' || !date) {
            type === 'fab' ? setShowFabPicker(false) : setShowVenPicker(false)
            return
        }
        const formatted = formatDate(date)
        if (type === 'fab') {
            setFechaFab(formatted)
            setShowFabPicker(false)
        } else {
            setFechaVen(formatted)
            setShowVenPicker(false)
        }
    }

    const handleSubmit = async () => {
        if (!productoId) {
            setFeedback({ visible: true, type: 'warning', title: 'Selecciona un producto', message: 'Elige el producto del lote.' })
            return
        }
        if (!numeroLoteSuffix.trim()) {
            setFeedback({ visible: true, type: 'warning', title: 'Numero requerido', message: 'Ingresa el numero de lote (ej: 001).' })
            return
        }
        if (!fechaFab || !fechaVen) {
            setFeedback({
                visible: true,
                type: 'warning',
                title: 'Faltan fechas',
                message: 'Selecciona la fecha de fabricacion y vencimiento.',
            })
            return
        }

        const fullLoteNumber = getFullLoteNumber()

        setSaving(true)
        try {
            if (isEdit && loteId) {
                const payload: Partial<LotePayload> = {
                    fechaVencimiento: fechaVen,
                    estadoCalidad: estadoCalidad || undefined,
                }
                await LoteService.update(loteId, payload)
                setFeedback({ visible: true, type: 'success', title: 'Lote actualizado', message: 'Los cambios se guardaron.' })
            } else {
                const payload: LotePayload = {
                    productoId,
                    numeroLote: fullLoteNumber,
                    fechaFabricacion: fechaFab,
                    fechaVencimiento: fechaVen,
                    estadoCalidad: estadoCalidad || undefined,
                }
                await LoteService.create(payload)
                setFeedback({ visible: true, type: 'success', title: 'Lote creado', message: 'El lote fue registrado.' })
            }
        } catch (error) {
            const raw = error instanceof Error ? error.message.toLowerCase() : ''
            let custom: string | undefined
            if (raw.includes('numero_lote') || raw.includes('ya existe') || raw.includes('lote') || raw.includes('duplicad')) {
                custom = `Ya existe un lote con el código ${fullLoteNumber}. Usa otro número.`
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

    const handleDelete = async () => {
        if (!allowDelete || !loteId) return
        Alert.alert('Eliminar lote', 'Esta accion no se puede revertir. Deseas continuar?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Eliminar',
                style: 'destructive',
                onPress: async () => {
                    try {
                        setSaving(true)
                        await LoteService.remove(loteId)
                        setFeedback({ visible: true, type: 'success', title: 'Lote eliminado', message: 'Se elimino el lote.' })
                    } catch (error) {
                        setFeedback({
                            visible: true,
                            type: 'error',
                            title: 'No se pudo eliminar',
                            message: getUserFriendlyMessage(error, 'DELETE_ERROR'),
                        })
                    } finally {
                        setSaving(false)
                    }
                },
            },
        ])
    }

    const selectedEstado = ESTADOS_CALIDAD.find(e => e.id === estadoCalidad)

    return (
        <KeyboardAvoidingView className="flex-1 bg-neutral-50" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Header title={isEdit ? 'Editar lote' : 'Nuevo lote'} variant="standard" onBackPress={onBack} />

            <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 32 }}>
                <View className="bg-white p-5 rounded-3xl border border-neutral-100 shadow-sm gap-4">
                    <Text className="text-lg font-extrabold text-neutral-900">Datos del lote</Text>

                    <TouchableOpacity
                        className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50 flex-row items-center justify-between"
                        onPress={() => (!isEdit ? setPickerVisible(true) : null)}
                        activeOpacity={0.7}
                    >
                        <View>
                            <Text className="text-xs text-neutral-500 font-semibold uppercase">Producto</Text>
                            <Text className="text-base font-bold text-neutral-900 mt-1">
                                {productoId
                                    ? productOptions.find((p) => p.id === String(productoId))?.label || `Producto ${productoId}`
                                    : 'Seleccionar'}
                            </Text>
                        </View>
                        <Ionicons name="chevron-down" size={18} color="#6B7280" />
                    </TouchableOpacity>

                    {/* Campo de número de lote con prefijo quemado */}
                    <View>
                        <Text className="text-xs text-neutral-500 font-semibold uppercase mb-2">Número de lote</Text>
                        <View className="flex-row items-center bg-neutral-50 border border-neutral-200 rounded-2xl overflow-hidden">
                            <View className="bg-neutral-200 px-4 py-4">
                                <Text className="text-base font-bold text-neutral-700">{LOTE_PREFIX}</Text>
                            </View>
                            <TextInput
                                className="flex-1 px-4 py-4 text-base font-bold text-neutral-900"
                                placeholder="001"
                                value={numeroLoteSuffix}
                                onChangeText={setNumeroLoteSuffix}
                                editable={!isEdit}
                                autoCapitalize="characters"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>
                        {numeroLoteSuffix ? (
                            <Text className="text-xs text-neutral-400 mt-1 ml-1">
                                Código completo: {getFullLoteNumber()}
                            </Text>
                        ) : null}
                    </View>

                    <TouchableOpacity
                        className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50"
                        onPress={() => !isEdit && setShowFabPicker(true)}
                        activeOpacity={0.7}
                        disabled={isEdit}
                    >
                        <Text className="text-xs text-neutral-500 font-semibold uppercase">Fecha fabricacion</Text>
                        <Text className="text-base font-bold text-neutral-900 mt-1">{fechaFab || 'Seleccionar'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50"
                        onPress={() => setShowVenPicker(true)}
                        activeOpacity={0.7}
                    >
                        <Text className="text-xs text-neutral-500 font-semibold uppercase">Fecha vencimiento</Text>
                        <Text className="text-base font-bold text-neutral-900 mt-1">{fechaVen || 'Seleccionar'}</Text>
                    </TouchableOpacity>

                    {/* Selector de estado de calidad */}
                    <TouchableOpacity
                        className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50 flex-row items-center justify-between"
                        onPress={() => setEstadoPickerVisible(true)}
                        activeOpacity={0.7}
                    >
                        <View>
                            <Text className="text-xs text-neutral-500 font-semibold uppercase">Estado de calidad</Text>
                            <Text className="text-base font-bold text-neutral-900 mt-1">
                                {selectedEstado?.label || 'Seleccionar'}
                            </Text>
                        </View>
                        <Ionicons name="chevron-down" size={18} color="#6B7280" />
                    </TouchableOpacity>
                </View>

                <PrimaryButton
                    title={saving ? 'Guardando...' : isEdit ? 'Actualizar lote' : 'Crear lote'}
                    onPress={handleSubmit}
                    loading={saving || loading}
                    disabled={saving}
                    style={{ marginTop: 16 }}
                />

                {allowDelete && isEdit ? (
                    <TouchableOpacity
                        onPress={handleDelete}
                        className="mt-3 py-3 rounded-2xl border border-red-200 bg-red-50 items-center"
                        disabled={saving}
                    >
                        <Text className="text-red-600 font-bold">Eliminar lote</Text>
                    </TouchableOpacity>
                ) : null}
            </ScrollView>

            <PickerModal
                visible={pickerVisible}
                title="Selecciona producto"
                options={productOptions}
                selectedId={productoId}
                onSelect={(id) => {
                    setProductoId(String(id))
                    setPickerVisible(false)
                }}
                onClose={() => setPickerVisible(false)}
                infoText="Se muestran productos activos."
                infoIcon="cube-outline"
                infoColor={BRAND_COLORS.red}
            />

            <PickerModal
                visible={estadoPickerVisible}
                title="Selecciona estado de calidad"
                options={ESTADOS_CALIDAD}
                selectedId={estadoCalidad}
                onSelect={(id) => {
                    setEstadoCalidad(String(id))
                    setEstadoPickerVisible(false)
                }}
                onClose={() => setEstadoPickerVisible(false)}
                infoText="Define el estado del lote."
                infoIcon="shield-checkmark-outline"
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

            {showFabPicker ? (
                <DateTimePicker
                    value={fechaFab ? new Date(fechaFab) : new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, date) => handleDateChange(event, date, 'fab')}
                />
            ) : null}
            {showVenPicker ? (
                <DateTimePicker
                    value={fechaVen ? new Date(fechaVen) : new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, date) => handleDateChange(event, date, 'ven')}
                />
            ) : null}
        </KeyboardAvoidingView>
    )
}

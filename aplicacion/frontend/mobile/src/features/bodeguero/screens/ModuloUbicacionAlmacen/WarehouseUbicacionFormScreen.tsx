import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, TextInput } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'

import { Header } from '../../../../components/ui/Header'
import { TextField } from '../../../../components/ui/TextField'
import { ToggleSwitch } from '../../../../components/ui/ToggleSwitch'
import { PrimaryButton } from '../../../../components/ui/PrimaryButton'
import { PickerModal, type PickerOption } from '../../../../components/ui/PickerModal'
import { AlmacenService } from '../../../../services/api/AlmacenService'
import { UbicacionService, type UbicacionPayload } from '../../../../services/api/UbicacionService'
import { getUserFriendlyMessage } from '../../../../utils/errorMessages'
import { FeedbackModal, type FeedbackType } from '../../../../components/ui/FeedbackModal'
import { BRAND_COLORS } from '../../../../shared/types'

const UBI_PREFIX = 'UBI-'

// Opciones de tipo de ubicación
const TIPOS_UBICACION: PickerOption[] = [
    { id: 'RACK', label: 'Rack', description: 'Estantería metálica multinivel', icon: 'grid' },
    { id: 'PISO', label: 'Piso', description: 'Almacenamiento a nivel de suelo', icon: 'layers' },
    { id: 'CAMARA_FRIA', label: 'Cámara Fría', description: 'Espacio refrigerado', icon: 'snow' },
    { id: 'CONGELADOR', label: 'Congelador', description: 'Espacio de congelación', icon: 'thermometer' },
    { id: 'ESTANTE', label: 'Estante', description: 'Estante para productos pequeños', icon: 'albums' },
    { id: 'PALLET', label: 'Pallet', description: 'Zona de pallets', icon: 'cube' },
    { id: 'OTRO', label: 'Otro', description: 'Especificar manualmente', icon: 'ellipsis-horizontal' },
]

type RouteParams = {
    ubicacionId?: string
    almacenId?: number
}

export function WarehouseUbicacionFormScreen() {
    const navigation = useNavigation<any>()
    const route = useRoute()
    const { ubicacionId, almacenId: initialAlmacen } = (route.params as RouteParams) ?? {}
    const isEdit = Boolean(ubicacionId)

    const [almacenId, setAlmacenId] = useState<number | null>(initialAlmacen ?? null)
    const [codigoVisualSuffix, setCodigoVisualSuffix] = useState('')
    const [tipo, setTipo] = useState('RACK')
    const [tipoCustom, setTipoCustom] = useState('')
    const [capacidad, setCapacidad] = useState('')
    const [esCuarentena, setEsCuarentena] = useState(false)

    const [almacenPickerVisible, setAlmacenPickerVisible] = useState(false)
    const [tipoPickerVisible, setTipoPickerVisible] = useState(false)
    const [almacenOptions, setAlmacenOptions] = useState<PickerOption[]>([])

    // El código completo es UBI_PREFIX + codigoVisualSuffix
    const getFullCodigoVisual = () => `${UBI_PREFIX}${codigoVisualSuffix}`

    // El tipo final (si es OTRO usa el custom)
    const getTipoFinal = () => tipo === 'OTRO' && tipoCustom.trim() ? tipoCustom.trim() : tipo

    const [saving, setSaving] = useState(false)
    const [loading, setLoading] = useState(false)
    const [feedback, setFeedback] = useState<{ visible: boolean; type: FeedbackType; title: string; message: string }>({
        visible: false,
        type: 'success',
        title: '',
        message: '',
    })

    useEffect(() => {
        loadAlmacenes()
        if (isEdit && ubicacionId) {
            loadUbicacion(ubicacionId)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ubicacionId])

    const loadAlmacenes = async () => {
        try {
            const data = await AlmacenService.list()
            setAlmacenOptions(
                (data || []).map((a) => ({
                    id: String(a.id),
                    label: a.nombre,
                    description: a.codigoRef ? `Cod: ${a.codigoRef}` : undefined,
                    icon: 'business',
                })),
            )
        } catch (error) {
            setFeedback({
                visible: true,
                type: 'error',
                title: 'No se pudieron cargar almacenes',
                message: getUserFriendlyMessage(error, 'LOAD_ERROR'),
            })
        }
    }

    const loadUbicacion = async (id: string) => {
        setLoading(true)
        try {
            const data = await UbicacionService.getById(id)
            setAlmacenId(data.almacenId)
            // Si el código tiene prefijo UBI-, extraemos solo el sufijo
            const rawCodigo = data.codigoVisual || ''
            if (rawCodigo.startsWith(UBI_PREFIX)) {
                setCodigoVisualSuffix(rawCodigo.replace(UBI_PREFIX, ''))
            } else {
                setCodigoVisualSuffix(rawCodigo)
            }
            // Si el tipo no está en las opciones predefinidas, es custom
            const rawTipo = data.tipo || 'RACK'
            const tipoEncontrado = TIPOS_UBICACION.find(t => t.id === rawTipo)
            if (tipoEncontrado) {
                setTipo(rawTipo)
            } else {
                setTipo('OTRO')
                setTipoCustom(rawTipo)
            }
            setCapacidad(data.capacidadMaxKg ? String(data.capacidadMaxKg) : '')
            setEsCuarentena(Boolean(data.esCuarentena))
        } catch (error) {
            setFeedback({
                visible: true,
                type: 'error',
                title: 'No se pudo cargar',
                message: getUserFriendlyMessage(error, 'LOAD_ERROR'),
            })
            navigation.goBack()
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async () => {
        if (!almacenId) {
            setFeedback({
                visible: true,
                type: 'warning',
                title: 'Selecciona un almacen',
                message: 'Elige el almacen al que pertenece la ubicacion.',
            })
            return
        }
        if (!codigoVisualSuffix.trim()) {
            setFeedback({
                visible: true,
                type: 'warning',
                title: 'Falta codigo',
                message: 'Ingresa el codigo visual de la ubicacion (ej: A1-01).',
            })
            return
        }
        if (tipo === 'OTRO' && !tipoCustom.trim()) {
            setFeedback({
                visible: true,
                type: 'warning',
                title: 'Falta tipo',
                message: 'Ingresa el tipo personalizado de ubicación.',
            })
            return
        }

        const fullCodigoVisual = getFullCodigoVisual()
        const tipoFinal = getTipoFinal()

        const basePayload: UbicacionPayload = {
            almacenId,
            codigoVisual: fullCodigoVisual,
            tipo: tipoFinal,
            esCuarentena,
        }
        if (capacidad) basePayload.capacidadMaxKg = Number(capacidad)

        setSaving(true)
        try {
            if (isEdit && ubicacionId) {
                const updatePayload: Partial<UbicacionPayload> = {
                    codigoVisual: fullCodigoVisual,
                    tipo: tipoFinal,
                    esCuarentena: basePayload.esCuarentena,
                    ...(capacidad ? { capacidadMaxKg: Number(capacidad) } : { capacidadMaxKg: undefined }),
                }
                await UbicacionService.update(ubicacionId, updatePayload)
                setFeedback({ visible: true, type: 'success', title: 'Ubicacion actualizada', message: 'Se guardaron los cambios.' })
            } else {
                await UbicacionService.create(basePayload)
                setFeedback({ visible: true, type: 'success', title: 'Ubicacion creada', message: 'La ubicacion fue registrada.' })
            }
        } catch (error) {
            const rawMessage = error instanceof Error ? error.message.toLowerCase() : ''
            let customMessage: string | undefined
            if (rawMessage.includes('codigo') || rawMessage.includes('codigo_visual') || rawMessage.includes('duplicad')) {
                customMessage = `Ya existe una ubicación con el código ${fullCodigoVisual}. Usa otro código.`
            } else if (rawMessage.includes('nombre') && rawMessage.includes('existe')) {
                customMessage = 'Ya existe una ubicacion con ese nombre.'
            }
            setFeedback({
                visible: true,
                type: 'error',
                title: 'No se pudo guardar',
                message: customMessage || getUserFriendlyMessage(error, isEdit ? 'UPDATE_ERROR' : 'CREATE_ERROR'),
            })
        } finally {
            setSaving(false)
        }
    }

    const selectedTipo = TIPOS_UBICACION.find(t => t.id === tipo)

    return (
        <KeyboardAvoidingView className="flex-1 bg-neutral-50" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Header title={isEdit ? 'Editar ubicacion' : 'Nueva ubicacion'} variant="standard" onBackPress={() => navigation.goBack()} />

            <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
                <View className="bg-white p-5 rounded-3xl border border-neutral-100 shadow-sm gap-4">
                    <Text className="text-lg font-extrabold text-neutral-900">Datos de ubicacion</Text>

                    <TouchableOpacity
                        className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50 flex-row items-center justify-between"
                        onPress={() => setAlmacenPickerVisible(true)}
                        activeOpacity={0.7}
                    >
                        <View>
                            <Text className="text-xs text-neutral-500 font-semibold uppercase">Almacen</Text>
                            <Text className="text-base font-bold text-neutral-900 mt-1">
                                {almacenId
                                    ? almacenOptions.find((a) => a.id === String(almacenId))?.label || `Almacen ${almacenId}`
                                    : 'Seleccionar'}
                            </Text>
                        </View>
                        <Ionicons name="chevron-down" size={18} color="#6B7280" />
                    </TouchableOpacity>

                    <View>
                        <Text className="text-xs text-neutral-500 font-semibold uppercase mb-2">Codigo visual</Text>
                        <View className="flex-row items-center bg-neutral-50 border border-neutral-200 rounded-2xl overflow-hidden">
                            <View className="bg-neutral-200 px-4 py-4">
                                <Text className="text-base font-bold text-neutral-700">{UBI_PREFIX}</Text>
                            </View>
                            <TextInput
                                className="flex-1 px-4 py-4 text-base font-bold text-neutral-900"
                                placeholder="A1-01-01"
                                value={codigoVisualSuffix}
                                onChangeText={setCodigoVisualSuffix}
                                autoCapitalize="characters"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>
                        {codigoVisualSuffix ? (
                            <Text className="text-xs text-neutral-400 mt-1 ml-1">
                                Código completo: {getFullCodigoVisual()}
                            </Text>
                        ) : null}
                    </View>

                    <TouchableOpacity
                        className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50 flex-row items-center justify-between"
                        onPress={() => setTipoPickerVisible(true)}
                        activeOpacity={0.7}
                    >
                        <View>
                            <Text className="text-xs text-neutral-500 font-semibold uppercase">Tipo de ubicación</Text>
                            <Text className="text-base font-bold text-neutral-900 mt-1">
                                {tipo === 'OTRO' && tipoCustom ? tipoCustom : selectedTipo?.label || 'Seleccionar'}
                            </Text>
                        </View>
                        <Ionicons name="chevron-down" size={18} color="#6B7280" />
                    </TouchableOpacity>

                    {tipo === 'OTRO' ? (
                        <TextField
                            label="Tipo personalizado"
                            placeholder="Ingresa el tipo que deseas"
                            value={tipoCustom}
                            onChangeText={setTipoCustom}
                            autoCapitalize="characters"
                        />
                    ) : null}

                    <TextField label="Capacidad max. (kg)" placeholder="Ej. 1500" value={capacidad} onChangeText={setCapacidad} />

                    <View className="flex-row items-center justify-between bg-neutral-50 border border-neutral-200 rounded-2xl px-4 py-3">
                        <View>
                            <Text className="text-sm font-bold text-neutral-800">Es cuarentena</Text>
                            <Text className="text-xs text-neutral-500 mt-1">Marca si es zona especial.</Text>
                        </View>
                        <ToggleSwitch
                            checked={esCuarentena}
                            onToggle={() => setEsCuarentena((v) => !v)}
                            colorOn={BRAND_COLORS.red}
                            colorOff="#E5E7EB"
                            size="md"
                        />
                    </View>
                </View>

                <PrimaryButton
                    title={saving ? 'Guardando...' : isEdit ? 'Actualizar ubicacion' : 'Crear ubicacion'}
                    onPress={handleSubmit}
                    loading={saving || loading}
                    disabled={saving}
                    style={{ marginTop: 16 }}
                />
            </ScrollView>

            <PickerModal
                visible={almacenPickerVisible}
                title="Selecciona un almacen"
                options={almacenOptions}
                selectedId={almacenId ? String(almacenId) : undefined}
                onSelect={(id) => {
                    setAlmacenId(Number(id))
                    setAlmacenPickerVisible(false)
                }}
                onClose={() => setAlmacenPickerVisible(false)}
                infoText="Solo puedes crear ubicaciones en almacenes activos."
                infoIcon="business-outline"
                infoColor={BRAND_COLORS.red}
            />

            <PickerModal
                visible={tipoPickerVisible}
                title="Selecciona tipo de ubicación"
                options={TIPOS_UBICACION}
                selectedId={tipo}
                onSelect={(id) => {
                    setTipo(String(id))
                    if (id !== 'OTRO') {
                        setTipoCustom('')
                    }
                    setTipoPickerVisible(false)
                }}
                onClose={() => setTipoPickerVisible(false)}
                infoText="Selecciona el tipo o elige 'Otro' para personalizar."
                infoIcon="grid-outline"
                infoColor={BRAND_COLORS.red}
            />

            <FeedbackModal
                visible={feedback.visible}
                type={feedback.type}
                title={feedback.title}
                message={feedback.message}
                onClose={() => {
                    setFeedback((prev) => ({ ...prev, visible: false }))
                    if (feedback.type === 'success') navigation.goBack()
                }}
            />
        </KeyboardAvoidingView>
    )
}

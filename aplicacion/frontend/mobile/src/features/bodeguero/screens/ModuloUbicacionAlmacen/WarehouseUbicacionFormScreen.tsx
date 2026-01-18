import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native'
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
    const [codigoVisual, setCodigoVisual] = useState('')
    const [tipo, setTipo] = useState('RACK')
    const [capacidad, setCapacidad] = useState('')
    const [esCuarentena, setEsCuarentena] = useState(false)

    const [almacenPickerVisible, setAlmacenPickerVisible] = useState(false)
    const [almacenOptions, setAlmacenOptions] = useState<PickerOption[]>([])

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
            setCodigoVisual(data.codigoVisual || '')
            setTipo(data.tipo || 'RACK')
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
        if (!codigoVisual.trim()) {
            setFeedback({
                visible: true,
                type: 'warning',
                title: 'Falta codigo',
                message: 'Ingresa el codigo visual de la ubicacion.',
            })
            return
        }

        const basePayload: UbicacionPayload = {
            almacenId,
            codigoVisual: codigoVisual.trim(),
            tipo: tipo.trim() || 'RACK',
            esCuarentena,
        }
        if (capacidad) basePayload.capacidadMaxKg = Number(capacidad)

        setSaving(true)
        try {
            if (isEdit && ubicacionId) {
                const updatePayload: Partial<UbicacionPayload> = {
                    codigoVisual: basePayload.codigoVisual,
                    tipo: basePayload.tipo,
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
            if (rawMessage.includes('codigo') || rawMessage.includes('codigo_visual')) {
                customMessage = 'Ya existe una ubicacion con ese codigo en este almacen.'
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

                    <TextField
                        label="Codigo visual"
                        placeholder="Ej. A1-01-01"
                        value={codigoVisual}
                        onChangeText={setCodigoVisual}
                        autoCapitalize="characters"
                    />

                    <TextField label="Tipo" placeholder="RACK, PISO..." value={tipo} onChangeText={setTipo} />

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

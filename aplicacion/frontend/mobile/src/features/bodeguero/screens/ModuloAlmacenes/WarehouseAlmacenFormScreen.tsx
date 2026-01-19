import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Header } from '../../../../components/ui/Header'
import { TextField } from '../../../../components/ui/TextField'
import { ToggleSwitch } from '../../../../components/ui/ToggleSwitch'
import { PrimaryButton } from '../../../../components/ui/PrimaryButton'
import { BRAND_COLORS } from '../../../../shared/types'
import { AlmacenService, type AlmacenPayload } from '../../../../services/api/AlmacenService'
import { getUserFriendlyMessage } from '../../../../utils/errorMessages'
import { FeedbackModal, type FeedbackType } from '../../../../components/ui/FeedbackModal'

type RouteParams = {
    almacenId?: number
}

export function WarehouseAlmacenFormScreen() {
    const navigation = useNavigation()
    const route = useRoute()
    const { almacenId } = (route.params as RouteParams) ?? {}

    const isEdit = typeof almacenId === 'number'

    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [nombre, setNombre] = useState('')
    const [codigoRef, setCodigoRef] = useState('')
    const [requiereFrio, setRequiereFrio] = useState(false)
    const [direccionFisica, setDireccionFisica] = useState('')
    const [activo, setActivo] = useState(true)
    const [feedbackVisible, setFeedbackVisible] = useState(false)
    const [feedbackConfig, setFeedbackConfig] = useState<{ type: FeedbackType; title: string; message: string; onConfirm?: () => void }>({
        type: 'success',
        title: '',
        message: ''
    })

    useEffect(() => {
        if (isEdit) {
            loadAlmacen()
        }
    }, [isEdit])

    const loadAlmacen = async () => {
        setLoading(true)
        try {
            const data = await AlmacenService.getById(almacenId as number)
            setNombre(data.nombre || '')
            setCodigoRef(data.codigoRef || '')
            setRequiereFrio(Boolean(data.requiereFrio))
            setDireccionFisica(data.direccionFisica || '')
            setActivo(Boolean(data.activo))
        } catch (error) {
            setFeedbackConfig({
                type: 'error',
                title: 'No se pudo cargar',
                message: getUserFriendlyMessage(error, 'LOAD_ERROR'),
                onConfirm: () => {
                    setFeedbackVisible(false)
                    navigation.goBack()
                }
            })
            setFeedbackVisible(true)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async () => {
        if (!nombre.trim()) {
            setFeedbackConfig({
                type: 'warning',
                title: 'Faltan datos',
                message: 'Ingresa un nombre para el almacen.',
            })
            setFeedbackVisible(true)
            return
        }

        const payload: AlmacenPayload = {
            nombre: nombre.trim(),
            codigoRef: codigoRef.trim() || undefined,
            direccionFisica: direccionFisica.trim() || undefined,
            requiereFrio,
            ...(isEdit ? { activo } : {})
        }

        setSaving(true)
        try {
            if (isEdit) {
                await AlmacenService.update(almacenId as number, payload)
                setFeedbackConfig({
                    type: 'success',
                    title: 'Almacén actualizado',
                    message: 'Los datos se guardaron correctamente.',
                    onConfirm: () => navigation.goBack()
                })
            } else {
                await AlmacenService.create(payload)
                setFeedbackConfig({
                    type: 'success',
                    title: 'Almacén creado',
                    message: 'El nuevo almacén ya está disponible.',
                    onConfirm: () => navigation.goBack()
                })
            }
            setFeedbackVisible(true)
        } catch (error) {
            const rawMessage = error instanceof Error ? error.message.toLowerCase() : ''
            let customMessage: string | undefined
            if (rawMessage.includes('codigo') || rawMessage.includes('codigo_ref')) {
                customMessage = 'Ya existe un almacen con ese codigo de referencia.'
            } else if (rawMessage.includes('nombre') && rawMessage.includes('existe')) {
                customMessage = 'Ya existe un almacen con ese nombre.'
            }
            setFeedbackConfig({
                type: 'error',
                title: 'No se pudo guardar',
                message: customMessage || getUserFriendlyMessage(error, isEdit ? 'UPDATE_ERROR' : 'CREATE_ERROR'),
            })
            setFeedbackVisible(true)
        } finally {
            setSaving(false)
        }
    }

    return (
        <KeyboardAvoidingView
            className="flex-1 bg-neutral-50"
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <Header
                title={isEdit ? 'Editar almacén' : 'Nuevo almacén'}
                variant="standard"
                onBackPress={() => navigation.goBack()}
            />

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
                keyboardShouldPersistTaps="handled"
            >
                <View className="bg-white rounded-3xl p-5 border border-neutral-100 shadow-sm mb-4">
                    <View className="flex-row justify-between items-center mb-3">
                        <View>
                            <Text className="text-neutral-800 font-extrabold text-xl">
                                {isEdit ? 'Ficha del almacén' : 'Datos del almacén'}
                            </Text>
                            <Text className="text-neutral-500 text-sm mt-1">
                                Mantén actualizada la información clave.
                            </Text>
                        </View>
                        {isEdit ? (
                            <View className="items-end">
                                <Text className="text-xs text-neutral-500 mb-1 font-semibold">Estado</Text>
                                <View className="flex-row items-center gap-2">
                                    <Text className="text-sm text-neutral-700">{activo ? 'Activo' : 'Inactivo'}</Text>
                                    <ToggleSwitch
                                        checked={activo}
                                        onToggle={() => setActivo((prev) => !prev)}
                                        colorOn="#22C55E"
                                        colorOff="#E5E7EB"
                                        size="md"
                                    />
                                </View>
                            </View>
                        ) : null}
                    </View>

                    <View className="gap-4">
                        <TextField
                            label="Nombre"
                            placeholder="Ej. Bodega Central"
                            value={nombre}
                            onChangeText={setNombre}
                        />

                        <TextField
                            label="Código de referencia"
                            placeholder="Ej. BOD-01"
                            value={codigoRef}
                            onChangeText={setCodigoRef}
                            autoCapitalize="characters"
                        />

                        <TextField
                            label="Dirección física"
                            placeholder="Calle, número, referencia"
                            value={direccionFisica}
                            onChangeText={setDireccionFisica}
                        />

                        <View className="flex-row items-center justify-between bg-neutral-50 border border-neutral-200 rounded-2xl px-4 py-3">
                            <View>
                                <Text className="text-sm font-bold text-neutral-800">Requiere cadena de frío</Text>
                                <Text className="text-xs text-neutral-500 mt-1">
                                    Úsalo para productos sensibles.
                                </Text>
                            </View>
                            <ToggleSwitch
                                checked={requiereFrio}
                                onToggle={() => setRequiereFrio((prev) => !prev)}
                                colorOn={BRAND_COLORS.red}
                                colorOff="#E5E7EB"
                                size="md"
                            />
                        </View>
                    </View>
                </View>

                <PrimaryButton
                    title={saving ? 'Guardando...' : isEdit ? 'Actualizar almacén' : 'Crear almacén'}
                    onPress={handleSubmit}
                    loading={saving || loading}
                    disabled={saving}
                />
            </ScrollView>

            <FeedbackModal
                visible={feedbackVisible}
                type={feedbackConfig.type}
                title={feedbackConfig.title}
                message={feedbackConfig.message}
                onClose={() => {
                    const cb = feedbackConfig.onConfirm
                    setFeedbackVisible(false)
                    if (cb) cb()
                }}
                onConfirm={() => {
                    const cb = feedbackConfig.onConfirm
                    setFeedbackVisible(false)
                    if (cb) cb()
                }}
            />
        </KeyboardAvoidingView>
    )
}

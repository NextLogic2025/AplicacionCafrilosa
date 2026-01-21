import React, { useState, useEffect } from 'react'
import { View, Text, TextInput, ScrollView, Pressable, Switch, ActivityIndicator } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'

import { Header } from '../../../../components/ui/Header'
import { PickerModal, type PickerOption } from '../../../../components/ui/PickerModal'
import { FeedbackModal, type FeedbackType } from '../../../../components/ui/FeedbackModal'
import { useStableInsets } from '../../../../hooks/useStableInsets'
import { ConductorService, type CreateConductorDto, type Conductor } from '../../../../services/api/ConductorService'
import { getUserFriendlyMessage } from '../../../../utils/errorMessages'
import { BRAND_COLORS } from '../../../../shared/types'

const TIPOS_LICENCIA: PickerOption[] = [
    { id: 'A', label: 'Tipo A', description: 'Ciclomotores, motocicletas', icon: 'bicycle' },
    { id: 'B', label: 'Tipo B', description: 'Automóviles, camionetas', icon: 'car' },
    { id: 'C', label: 'Tipo C', description: 'Taxis, convencionales', icon: 'car-sport' },
    { id: 'D', label: 'Tipo D', description: 'Servicio público, pasajeros', icon: 'bus' },
    { id: 'E', label: 'Tipo E', description: 'Camiones pesados, trailers', icon: 'cube' },
    { id: 'F', label: 'Tipo F', description: 'Automotores especiales', icon: 'construct' },
    { id: 'G', label: 'Tipo G', description: 'Maquinaria agrícola/pesada', icon: 'hardware-chip' },
]

interface RouteParams {
    conductorId?: string
}

export function SupervisorConductorFormScreen() {
    const navigation = useNavigation<any>()
    const route = useRoute<any>()
    const insets = useStableInsets()
    const params = route.params as RouteParams

    const isEditing = !!params?.conductorId
    const [loading, setLoading] = useState(false)
    const [loadingData, setLoadingData] = useState(isEditing)
    const [conductor, setConductor] = useState<Conductor | null>(null)

    // Form state
    const [nombreCompleto, setNombreCompleto] = useState('')
    const [cedula, setCedula] = useState('')
    const [telefono, setTelefono] = useState('')
    const [tipoLicencia, setTipoLicencia] = useState('')
    const [numeroLicencia, setNumeroLicencia] = useState('')
    const [activo, setActivo] = useState(true)

    const [showLicenciaPicker, setShowLicenciaPicker] = useState(false)

    // Validation errors
    const [errors, setErrors] = useState<Record<string, string>>({})

    const [feedbackModal, setFeedbackModal] = useState<{
        visible: boolean
        type: FeedbackType
        title: string
        message: string
    }>({
        visible: false,
        type: 'info',
        title: '',
        message: '',
    })

    // Cargar conductor si está editando
    useEffect(() => {
        if (isEditing && params?.conductorId) {
            loadConductor(params.conductorId)
        }
    }, [params?.conductorId])

    const loadConductor = async (id: string) => {
        setLoadingData(true)
        try {
            const data = await ConductorService.getById(id)
            setConductor(data)
            setNombreCompleto(data.nombre_completo)
            setCedula(data.cedula)
            setTelefono(data.telefono || '')
            // Parse licencia like "B-LIC123" => tipo: B, numero: LIC123
            if (data.licencia) {
                const parts = data.licencia.split('-')
                if (parts.length === 2) {
                    setTipoLicencia(parts[0])
                    setNumeroLicencia(parts[1])
                } else {
                    setNumeroLicencia(data.licencia)
                }
            }
            setActivo(data.activo)
        } catch (error) {
            setFeedbackModal({
                visible: true,
                type: 'error',
                title: 'Error al Cargar',
                message: getUserFriendlyMessage(error, 'LOAD_ERROR'),
            })
        } finally {
            setLoadingData(false)
        }
    }

    // Validar formulario
    const validate = (): boolean => {
        const newErrors: Record<string, string> = {}

        if (!nombreCompleto.trim()) {
            newErrors.nombreCompleto = 'El nombre completo es requerido'
        } else if (nombreCompleto.trim().length < 3) {
            newErrors.nombreCompleto = 'El nombre debe tener al menos 3 caracteres'
        }

        if (!cedula.trim()) {
            newErrors.cedula = 'La cédula es requerida'
        } else if (cedula.trim().length < 10) {
            newErrors.cedula = 'La cédula debe tener al menos 10 dígitos'
        }

        if (telefono && telefono.length < 7) {
            newErrors.telefono = 'El teléfono debe tener al menos 7 dígitos'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    // Guardar conductor
    const handleSave = async () => {
        if (!validate()) {
            setFeedbackModal({
                visible: true,
                type: 'error',
                title: 'Formulario Incompleto',
                message: 'Por favor completa todos los campos requeridos correctamente.',
            })
            return
        }

        const formData: CreateConductorDto = {
            nombre_completo: nombreCompleto.trim(),
            cedula: cedula.trim(),
            telefono: telefono.trim() || undefined,
            licencia: tipoLicencia && numeroLicencia ? `${tipoLicencia}-${numeroLicencia.trim()}` : numeroLicencia.trim() || undefined,
            activo,
        }

        setLoading(true)
        try {
            if (isEditing && params.conductorId) {
                await ConductorService.update(params.conductorId, formData)
                setFeedbackModal({
                    visible: true,
                    type: 'success',
                    title: 'Conductor Actualizado',
                    message: `${nombreCompleto} ha sido actualizado exitosamente.`,
                })
            } else {
                await ConductorService.create(formData)
                setFeedbackModal({
                    visible: true,
                    type: 'success',
                    title: 'Conductor Creado',
                    message: `${nombreCompleto} ha sido registrado exitosamente.`,
                })
            }

            // Volver a la lista después de 1.5 segundos
            setTimeout(() => {
                navigation.goBack()
            }, 1500)
        } catch (error) {
            setFeedbackModal({
                visible: true,
                type: 'error',
                title: isEditing ? 'Error al Actualizar' : 'Error al Crear',
                message: getUserFriendlyMessage(error, isEditing ? 'UPDATE_ERROR' : 'CREATE_ERROR'),
            })
        } finally {
            setLoading(false)
        }
    }

    if (loadingData) {
        return (
            <View className="flex-1 bg-neutral-50">
                <Header title={isEditing ? 'Editar Conductor' : 'Nuevo Conductor'} variant="standard" onBackPress={() => navigation.goBack()} />
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={BRAND_COLORS.red} />
                    <Text className="text-neutral-600 mt-4">Cargando datos...</Text>
                </View>
            </View>
        )
    }

    return (
        <View className="flex-1 bg-neutral-50">
            <Header
                title={isEditing ? 'Editar Conductor' : 'Nuevo Conductor'}
                variant="standard"
                onBackPress={() => navigation.goBack()}
            />        <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
            >
                <View className="mx-4 mt-4">
                    {/* Información Personal */}
                    <View className="bg-white rounded-2xl p-4 mb-4" style={{ elevation: 2 }}>
                        <View className="flex-row items-center mb-4">
                            <Ionicons name="person-outline" size={20} color={BRAND_COLORS.red} />
                            <Text className="text-base font-bold text-neutral-900 ml-2">
                                Información Personal
                            </Text>
                        </View>

                        {/* Nombre Completo */}
                        <View className="mb-4">
                            <Text className="text-neutral-500 text-xs font-bold mb-1 uppercase">Nombre Completo *</Text>
                            <TextInput
                                className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 text-neutral-900"
                                value={nombreCompleto}
                                onChangeText={(text) => {
                                    setNombreCompleto(text)
                                    if (errors.nombreCompleto) {
                                        setErrors(prev => ({ ...prev, nombreCompleto: '' }))
                                    }
                                }}
                                placeholder="Ej: Juan Pérez García"
                                editable={!loading}
                            />
                            {errors.nombreCompleto ? <Text className="text-red-600 text-xs mt-1">{errors.nombreCompleto}</Text> : null}
                        </View>

                        {/* Cédula */}
                        <View className="mb-4">
                            <Text className="text-neutral-500 text-xs font-bold mb-1 uppercase">Cédula *</Text>
                            <TextInput
                                className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 text-neutral-900"
                                value={cedula}
                                onChangeText={(text) => {
                                    setCedula(text)
                                    if (errors.cedula) {
                                        setErrors(prev => ({ ...prev, cedula: '' }))
                                    }
                                }}
                                placeholder="Ej: 1234567890"
                                keyboardType="numeric"
                                editable={!loading}
                            />
                            {errors.cedula ? <Text className="text-red-600 text-xs mt-1">{errors.cedula}</Text> : null}
                        </View>
                    </View>

                    {/* Información de Contacto */}
                    <View className="bg-white rounded-2xl p-4 mb-4" style={{ elevation: 2 }}>
                        <View className="flex-row items-center mb-4">
                            <Ionicons name="call-outline" size={20} color={BRAND_COLORS.red} />
                            <Text className="text-base font-bold text-neutral-900 ml-2">
                                Información de Contacto
                            </Text>
                        </View>

                        {/* Teléfono */}
                        <View className="mb-4">
                            <Text className="text-neutral-500 text-xs font-bold mb-1 uppercase">Teléfono</Text>
                            <TextInput
                                className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 text-neutral-900"
                                value={telefono}
                                onChangeText={(text) => {
                                    setTelefono(text)
                                    if (errors.telefono) {
                                        setErrors(prev => ({ ...prev, telefono: '' }))
                                    }
                                }}
                                placeholder="Ej: 0999888777"
                                keyboardType="phone-pad"
                                editable={!loading}
                            />
                            {errors.telefono ? <Text className="text-red-600 text-xs mt-1">{errors.telefono}</Text> : null}
                        </View>

                        {/* Licencia */}
                        <View>
                            <Text className="text-neutral-500 text-xs font-bold mb-1 uppercase">Tipo de Licencia</Text>
                            <Pressable
                                onPress={() => setShowLicenciaPicker(true)}
                                className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 mb-3 flex-row items-center justify-between"
                            >
                                <View className="flex-1">
                                    {tipoLicencia ? (
                                        <>
                                            <Text className="font-bold text-neutral-900">
                                                {TIPOS_LICENCIA.find(t => t.id === tipoLicencia)?.label}
                                            </Text>
                                            <Text className="text-xs text-neutral-500 mt-0.5">
                                                {TIPOS_LICENCIA.find(t => t.id === tipoLicencia)?.description}
                                            </Text>
                                        </>
                                    ) : (
                                        <Text className="text-neutral-400">Seleccionar tipo...</Text>
                                    )}
                                </View>
                                <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                            </Pressable>

                            <Text className="text-neutral-500 text-xs font-bold mb-1 uppercase">Número de Licencia</Text>
                            <TextInput
                                className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 text-neutral-900"
                                value={numeroLicencia}
                                onChangeText={setNumeroLicencia}
                                placeholder="Ej: LIC-12345"
                                editable={!loading}
                            />
                        </View>
                    </View>

                    {/* Estado */}
                    <View className="bg-white rounded-2xl p-4 mb-4" style={{ elevation: 2 }}>
                        <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center flex-1">
                                <Ionicons
                                    name={activo ? 'checkmark-circle' : 'close-circle'}
                                    size={20}
                                    color={activo ? '#10B981' : '#6B7280'}
                                />
                                <Text className="text-base font-semibold text-neutral-900 ml-2">
                                    Conductor Activo
                                </Text>
                            </View>
                            <Switch
                                value={activo}
                                onValueChange={setActivo}
                                trackColor={{ false: '#D1D5DB', true: `${BRAND_COLORS.red} 50` }}
                                thumbColor={activo ? BRAND_COLORS.red : '#9CA3AF'}
                                disabled={loading}
                            />
                        </View>
                        <Text className="text-sm text-neutral-500 mt-2">
                            {activo
                                ? 'El conductor puede ser asignado a despachos'
                                : 'El conductor no estará disponible para asignaciones'
                            }
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* Botones de acción */}
            <View
                className="border-t border-neutral-200 bg-white px-4 py-3"
                style={{ paddingBottom: insets.bottom + 12 }}
            >
                <View className="flex-row gap-3">
                    {/* Cancelar */}
                    <Pressable
                        onPress={() => navigation.goBack()}
                        disabled={loading}
                        className="flex-1 py-3 rounded-xl border-2 border-neutral-300 items-center justify-center active:bg-neutral-50"
                    >
                        <Text className="text-base font-semibold text-neutral-700">
                            Cancelar
                        </Text>
                    </Pressable>

                    {/* Guardar */}
                    <Pressable
                        onPress={handleSave}
                        disabled={loading}
                        className="flex-1 py-3 rounded-xl items-center justify-center active:opacity-80"
                        style={{ backgroundColor: loading ? '#9CA3AF' : BRAND_COLORS.red }}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <Text className="text-base font-bold text-white">
                                {isEditing ? 'Actualizar' : 'Crear Conductor'}
                            </Text>
                        )}
                    </Pressable>
                </View>
            </View>


            {/* Feedback Modal */}
            <FeedbackModal
                visible={feedbackModal.visible}
                type={feedbackModal.type}
                title={feedbackModal.title}
                message={feedbackModal.message}
                onClose={() => setFeedbackModal(prev => ({ ...prev, visible: false }))}
            />

            {/* License Type Picker */}
            <PickerModal
                visible={showLicenciaPicker}
                title="Selecciona el tipo de licencia"
                options={TIPOS_LICENCIA}
                selectedId={tipoLicencia}
                onSelect={(id) => {
                    setTipoLicencia(String(id))
                    setShowLicenciaPicker(false)
                }}
                onClose={() => setShowLicenciaPicker(false)}
                infoText="Selecciona el tipo de licencia de conducir del conductor."
                infoIcon="car-outline"
                infoColor={BRAND_COLORS.red}
            />
        </View>
    )
}

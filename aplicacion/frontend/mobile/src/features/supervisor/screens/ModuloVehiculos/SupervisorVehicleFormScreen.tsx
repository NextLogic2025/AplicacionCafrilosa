import React, { useState, useEffect } from 'react'
import { View, Text, TextInput, ScrollView, Pressable, ActivityIndicator } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'

import { Header } from '../../../../components/ui/Header'
import { FeedbackModal, type FeedbackType } from '../../../../components/ui/FeedbackModal'
import { useStableInsets } from '../../../../hooks/useStableInsets'
import { VehicleService, type CreateVehicleDto, type Vehicle, type VehicleEstado, VEHICLE_ESTADO_LABELS } from '../../../../services/api/VehicleService'
import { getUserFriendlyMessage } from '../../../../utils/errorMessages'
import { BRAND_COLORS } from '../../../../shared/types'

const ESTADOS: { value: VehicleEstado; label: string }[] = [
    { value: 'DISPONIBLE', label: 'Disponible' },
    { value: 'EN_RUTA', label: 'En Ruta' },
    { value: 'MANTENIMIENTO', label: 'Mantenimiento' },
    { value: 'INACTIVO', label: 'Inactivo' },
]

export function SupervisorVehicleFormScreen() {
    const navigation = useNavigation<any>()
    const route = useRoute<any>()
    const insets = useStableInsets()

    const vehicleId = route.params?.vehicleId
    const isEditing = !!vehicleId

    const [placa, setPlaca] = useState('')
    const [marca, setMarca] = useState('')
    const [modelo, setModelo] = useState('')
    const [anio, setAnio] = useState('')
    const [capacidadKg, setCapacidadKg] = useState('')
    const [estado, setEstado] = useState<VehicleEstado>('DISPONIBLE')

    const [loading, setLoading] = useState(false)
    const [loadingData, setLoadingData] = useState(false)

    const [errors, setErrors] = useState<{
        placa: string
        capacidad: string
    }>({
        placa: '',
        capacidad: '',
    })

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

    useEffect(() => {
        if (isEditing) {
            loadVehicleData()
        }
    }, [vehicleId])

    const loadVehicleData = async () => {
        if (!vehicleId) return

        setLoadingData(true)
        try {
            const vehicle = await VehicleService.getById(vehicleId)
            setPlaca(vehicle.placa)
            setMarca(vehicle.marca || '')
            setModelo(vehicle.modelo || '')
            setAnio(vehicle.anio ? vehicle.anio.toString() : '')
            setCapacidadKg(vehicle.capacidad_kg || '')
            setEstado(vehicle.estado)
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

    const validate = (): boolean => {
        const newErrors = { placa: '', capacidad: '' }

        if (!placa.trim()) {
            newErrors.placa = 'La placa es obligatoria'
        } else if (placa.length < 3) {
            newErrors.placa = 'La placa debe tener al menos 3 caracteres'
        }

        if (capacidadKg && isNaN(parseFloat(capacidadKg))) {
            newErrors.capacidad = 'La capacidad debe ser un número válido'
        }

        setErrors(newErrors)
        return !newErrors.placa && !newErrors.capacidad
    }

    const handleSave = async () => {
        if (!validate()) return

        setLoading(true)
        try {
            const data: CreateVehicleDto = {
                placa: placa.trim().toUpperCase(),
                marca: marca.trim() || undefined,
                modelo: modelo.trim() || undefined,
                anio: anio ? parseInt(anio) : undefined,
                capacidad_kg: capacidadKg.trim() || undefined,
                estado,
            }

            if (isEditing) {
                await VehicleService.update(vehicleId, data)
                setFeedbackModal({
                    visible: true,
                    type: 'success',
                    title: 'Vehículo Actualizado',
                    message: `El vehículo ${placa.toUpperCase()} ha sido actualizado exitosamente.`,
                })
            } else {
                await VehicleService.create(data)
                setFeedbackModal({
                    visible: true,
                    type: 'success',
                    title: 'Vehículo Creado',
                    message: `El vehículo ${placa.toUpperCase()} ha sido registrado exitosamente.`,
                })
            }

            setTimeout(() => navigation.goBack(), 1500)
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
            <View className="flex-1 items-center justify-center bg-neutral-50">
                <ActivityIndicator size="large" color={BRAND_COLORS.red} />
                <Text className="text-neutral-600 mt-4">Cargando datos...</Text>
            </View>
        )
    }

    return (
        <View className="flex-1 bg-neutral-50">
            <Header
                title={isEditing ? 'Editar Vehículo' : 'Nuevo Vehículo'}
                variant="standard"
                onBackPress={() => navigation.goBack()}
            />

            <ScrollView
                className="flex-1 px-4 pt-4"
                contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
            >
                <View className="bg-white rounded-2xl p-4 mb-4 border border-neutral-100" style={{ elevation: 2 }}>
                    <View className="flex-row items-center mb-4">
                        <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: BRAND_COLORS.red }}>
                            <Ionicons name="car-sport" size={20} color="white" />
                        </View>
                        <Text className="text-lg font-bold text-neutral-900">Información del Vehículo</Text>
                    </View>

                    <Text className="text-neutral-500 text-xs font-bold mb-1 uppercase">Placa *</Text>
                    <TextInput
                        className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 mb-1 text-neutral-900"
                        value={placa}
                        onChangeText={(text) => {
                            setPlaca(text.toUpperCase())
                            if (errors.placa) setErrors(prev => ({ ...prev, placa: '' }))
                        }}
                        placeholder="Ej: ABC-1234"
                        autoCapitalize="characters"
                        editable={!loading}
                    />
                    {errors.placa ? <Text className="text-red-600 text-xs mt-1 mb-3">{errors.placa}</Text> : <View className="mb-3" />}

                    <Text className="text-neutral-500 text-xs font-bold mb-1 uppercase">Marca</Text>
                    <TextInput
                        className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 mb-4 text-neutral-900"
                        value={marca}
                        onChangeText={setMarca}
                        placeholder="Ej: Toyota, Chevrolet"
                        editable={!loading}
                    />

                    <Text className="text-neutral-500 text-xs font-bold mb-1 uppercase">Modelo</Text>
                    <TextInput
                        className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 mb-4 text-neutral-900"
                        value={modelo}
                        onChangeText={setModelo}
                        placeholder="Ej: Hilux, N300"
                        editable={!loading}
                    />

                    <Text className="text-neutral-500 text-xs font-bold mb-1 uppercase">Año</Text>
                    <TextInput
                        className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 mb-4 text-neutral-900"
                        value={anio}
                        onChangeText={setAnio}
                        placeholder="Ej: 2023"
                        keyboardType="numeric"
                        editable={!loading}
                    />

                    <Text className="text-neutral-500 text-xs font-bold mb-1 uppercase">Capacidad (kg)</Text>
                    <TextInput
                        className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 mb-1 text-neutral-900"
                        value={capacidadKg}
                        onChangeText={(text) => {
                            setCapacidadKg(text)
                            if (errors.capacidad) setErrors(prev => ({ ...prev, capacidad: '' }))
                        }}
                        placeholder="Ej: 1000"
                        keyboardType="numeric"
                        editable={!loading}
                    />
                    {errors.capacidad ? <Text className="text-red-600 text-xs mt-1">{errors.capacidad}</Text> : null}
                </View>

                <View className="bg-white rounded-2xl p-4 mb-4 border border-neutral-100" style={{ elevation: 2 }}>
                    <View className="flex-row items-center mb-4">
                        <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: '#3B82F615' }}>
                            <Ionicons name="settings-outline" size={20} color="#3B82F6" />
                        </View>
                        <Text className="text-lg font-bold text-neutral-900">Estado del Vehículo</Text>
                    </View>

                    {ESTADOS.map((est) => (
                        <Pressable
                            key={est.value}
                            onPress={() => setEstado(est.value)}
                            className={`p-4 rounded-xl mb-2 border flex-row items-center justify-between ${estado === est.value ? 'bg-red-50 border-red-200' : 'bg-neutral-50 border-neutral-200'
                                }`}
                        >
                            <Text className={`font-semibold ${estado === est.value ? 'text-neutral-900' : 'text-neutral-600'}`}>
                                {est.label}
                            </Text>
                            {estado === est.value && <Ionicons name="checkmark-circle" size={22} color={BRAND_COLORS.red} />}
                        </Pressable>
                    ))}
                </View>
            </ScrollView>

            <View className="p-5 bg-white border-t border-neutral-100" style={{ paddingBottom: insets.bottom + 20 }}>
                <Pressable
                    className="w-full py-4 rounded-xl items-center shadow-lg"
                    style={{ backgroundColor: BRAND_COLORS.red }}
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-bold text-lg">
                            {isEditing ? 'Actualizar Vehículo' : 'Crear Vehículo'}
                        </Text>
                    )}
                </Pressable>
            </View>

            <FeedbackModal
                visible={feedbackModal.visible}
                type={feedbackModal.type}
                title={feedbackModal.title}
                message={feedbackModal.message}
                onClose={() => setFeedbackModal((prev) => ({ ...prev, visible: false }))}
            />
        </View>
    )
}

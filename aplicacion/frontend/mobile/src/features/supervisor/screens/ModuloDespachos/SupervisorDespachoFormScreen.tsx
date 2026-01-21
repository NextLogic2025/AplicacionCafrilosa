import React, { useState, useEffect } from 'react'
import { View, Text, TextInput, ScrollView, Pressable, ActivityIndicator, TouchableOpacity, Platform } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker'

import { Header } from '../../../../components/ui/Header'
import { GenericModal } from '../../../../components/ui/GenericModal'
import { GenericList } from '../../../../components/ui/GenericList'
import { FeedbackModal, type FeedbackType } from '../../../../components/ui/FeedbackModal'
import { useStableInsets } from '../../../../hooks/useStableInsets'
import { DespachosService, type CreateDespachoDto, type DespachoEstadoViaje, DESPACHO_ESTADO_LABELS } from '../../../../services/api/DespachosService'
import { VehicleService, type Vehicle } from '../../../../services/api/VehicleService'
import { ConductorService, type Conductor } from '../../../../services/api/ConductorService'
import { getUserFriendlyMessage } from '../../../../utils/errorMessages'
import { BRAND_COLORS } from '../../../../shared/types'

const ESTADOS: { value: DespachoEstadoViaje; label: string }[] = [
    { value: 'PLANIFICACION', label: 'Planificación' },
    { value: 'CONFIRMADO', label: 'Confirmado' },
    { value: 'EN_RUTA', label: 'En Ruta' },
    { value: 'COMPLETADO', label: 'Completado' },
    { value: 'CANCELADO', label: 'Cancelado' },
]

export function SupervisorDespachoFormScreen() {
    const navigation = useNavigation<any>()
    const route = useRoute<any>()
    const insets = useStableInsets()

    const despachoId = route.params?.despachoId
    const isEditing = !!despachoId

    const [fechaProgramada, setFechaProgramada] = useState('')
    const [observaciones, setObservaciones] = useState('')
    const [selectedVehiculo, setSelectedVehiculo] = useState<Vehicle | null>(null)
    const [selectedConductor, setSelectedConductor] = useState<Conductor | null>(null)
    const [estado, setEstado] = useState<DespachoEstadoViaje>('PLANIFICACION')

    const [vehiculos, setVehiculos] = useState<Vehicle[]>([])
    const [conductores, setConductores] = useState<Conductor[]>([])
    const [showVehiculoModal, setShowVehiculoModal] = useState(false)
    const [showConductorModal, setShowConductorModal] = useState(false)
    const [showDatePicker, setShowDatePicker] = useState(false)

    const [loading, setLoading] = useState(false)
    const [loadingData, setLoadingData] = useState(false)

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
        loadInitialData()
    }, [])

    useEffect(() => {
        if (isEditing) {
            loadDespachoData()
        }
    }, [despachoId])

    const loadInitialData = async () => {
        try {
            const [vehiculosData, conductoresData] = await Promise.all([
                VehicleService.list(),
                ConductorService.list(),
            ])
            setVehiculos(vehiculosData.filter(v => v.estado === 'DISPONIBLE'))
            setConductores(conductoresData.filter(c => c.activo))
        } catch (error) {
            console.error('Error loading initial data:', error)
        }
    }

    const loadDespachoData = async () => {
        if (!despachoId) return

        setLoadingData(true)
        try {
            const despacho = await DespachosService.getById(despachoId)
            setFechaProgramada(despacho.fecha_programada || '')
            setObservaciones(despacho.observaciones_ruta || '')
            setEstado(despacho.estado_viaje)

            if (despacho.vehiculo_id && vehiculos.length > 0) {
                const vehiculo = vehiculos.find(v => v.id === despacho.vehiculo_id)
                if (vehiculo) setSelectedVehiculo(vehiculo)
            }

            if (despacho.conductor_id && conductores.length > 0) {
                const conductor = conductores.find(c => c.id === despacho.conductor_id)
                if (conductor) setSelectedConductor(conductor)
            }
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

    const formatDate = (date: Date) => {
        const y = date.getFullYear()
        const m = String(date.getMonth() + 1).padStart(2, '0')
        const d = String(date.getDate()).padStart(2, '0')
        return `${y}-${m}-${d}`
    }

    const handleDateChange = (event: DateTimePickerEvent, date: Date | undefined) => {
        if (event.type !== 'set' || !date) {
            setShowDatePicker(false)
            return
        }
        setFechaProgramada(formatDate(date))
        setShowDatePicker(false)
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            const data: CreateDespachoDto = {
                fecha_programada: fechaProgramada || undefined,
                vehiculo_id: selectedVehiculo?.id,
                conductor_id: selectedConductor?.id,
                observaciones_ruta: observaciones.trim() || undefined,
                estado_viaje: estado,
            }

            if (isEditing) {
                await DespachosService.update(despachoId, data)
                setFeedbackModal({
                    visible: true,
                    type: 'success',
                    title: 'Despacho Actualizado',
                    message: 'El despacho ha sido actualizado exitosamente.',
                })
            } else {
                await DespachosService.create(data)
                setFeedbackModal({
                    visible: true,
                    type: 'success',
                    title: 'Despacho Creado',
                    message: 'El despacho ha sido creado exitosamente.',
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
                title={isEditing ? 'Editar Despacho' : 'Nuevo Despacho'}
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
                            <Ionicons name="document-text" size={20} color="white" />
                        </View>
                        <Text className="text-lg font-bold text-neutral-900">Información del Despacho</Text>
                    </View>

                    <Text className="text-neutral-500 text-xs font-bold mb-1 uppercase">Fecha Programada</Text>
                    <TouchableOpacity
                        className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 mb-4"
                        onPress={() => setShowDatePicker(true)}
                        activeOpacity={0.7}
                    >
                        <Text className={fechaProgramada ? "text-neutral-900 font-semibold" : "text-neutral-400"}>
                            {fechaProgramada || 'Seleccionar fecha...'}
                        </Text>
                    </TouchableOpacity>

                    <Text className="text-neutral-500 text-xs font-bold mb-1 uppercase">Vehículo</Text>
                    <Pressable
                        onPress={() => setShowVehiculoModal(true)}
                        className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 mb-4 flex-row items-center justify-between"
                    >
                        <Text className={selectedVehiculo ? "text-neutral-900" : "text-neutral-400"}>
                            {selectedVehiculo ? `${selectedVehiculo.placa} - ${selectedVehiculo.marca || ''} ${selectedVehiculo.modelo || ''}` : 'Seleccionar vehículo...'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                    </Pressable>

                    <Text className="text-neutral-500 text-xs font-bold mb-1 uppercase">Conductor</Text>
                    <Pressable
                        onPress={() => setShowConductorModal(true)}
                        className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 mb-4 flex-row items-center justify-between"
                    >
                        <Text className={selectedConductor ? "text-neutral-900" : "text-neutral-400"}>
                            {selectedConductor ? selectedConductor.nombre_completo : 'Seleccionar conductor...'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                    </Pressable>

                    <Text className="text-neutral-500 text-xs font-bold mb-1 uppercase">Observaciones</Text>
                    <TextInput
                        className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 text-neutral-900"
                        value={observaciones}
                        onChangeText={setObservaciones}
                        placeholder="Notas sobre la ruta..."
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                        editable={!loading}
                    />
                </View>

                <View className="bg-white rounded-2xl p-4 mb-4 border border-neutral-100" style={{ elevation: 2 }}>
                    <Text className="text-lg font-bold text-neutral-900 mb-4">Estado del Despacho</Text>

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
                    className="w-full py-4 rounded-xl items-center"
                    style={{ backgroundColor: BRAND_COLORS.red }}
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-bold text-lg">
                            {isEditing ? 'Actualizar Despacho' : 'Crear Despacho'}
                        </Text>
                    )}
                </Pressable>
            </View>

            <GenericModal visible={showVehiculoModal} title="Seleccionar Vehículo" onClose={() => setShowVehiculoModal(false)}>
                <View className="h-96">
                    <GenericList
                        items={vehiculos}
                        renderItem={(vehiculo: Vehicle) => (
                            <Pressable
                                className={`p-4 mb-2 rounded-xl border ${selectedVehiculo?.id === vehiculo.id ? 'bg-red-50 border-red-200' : 'bg-white border-neutral-100'}`}
                                onPress={() => {
                                    setSelectedVehiculo(vehiculo)
                                    setShowVehiculoModal(false)
                                }}
                            >
                                <Text className="font-semibold text-neutral-900">{vehiculo.placa}</Text>
                                <Text className="text-sm text-neutral-600">{vehiculo.marca} {vehiculo.modelo}</Text>
                            </Pressable>
                        )}
                        isLoading={false}
                        onRefresh={() => { }}
                        emptyState={{ icon: 'car', title: 'Sin vehículos', message: 'No hay vehículos disponibles' }}
                    />
                </View>
            </GenericModal>

            <GenericModal visible={showConductorModal} title="Seleccionar Conductor" onClose={() => setShowConductorModal(false)}>
                <View className="h-96">
                    <GenericList
                        items={conductores}
                        renderItem={(conductor: Conductor) => (
                            <Pressable
                                className={`p-4 mb-2 rounded-xl border ${selectedConductor?.id === conductor.id ? 'bg-red-50 border-red-200' : 'bg-white border-neutral-100'}`}
                                onPress={() => {
                                    setSelectedConductor(conductor)
                                    setShowConductorModal(false)
                                }}
                            >
                                <Text className="font-semibold text-neutral-900">{conductor.nombre_completo}</Text>
                                <Text className="text-sm text-neutral-600">Cédula: {conductor.cedula}</Text>
                            </Pressable>
                        )}
                        isLoading={false}
                        onRefresh={() => { }}
                        emptyState={{ icon: 'person', title: 'Sin conductores', message: 'No hay conductores activos' }}
                    />
                </View>
            </GenericModal>

            <FeedbackModal
                visible={feedbackModal.visible}
                type={feedbackModal.type}
                title={feedbackModal.title}
                message={feedbackModal.message}
                onClose={() => setFeedbackModal((prev) => ({ ...prev, visible: false }))}
            />

            {showDatePicker && (
                <DateTimePicker
                    value={fechaProgramada ? new Date(fechaProgramada) : new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                />
            )}
        </View>
    )
}

import React, { useState, useMemo, useCallback } from 'react'
import { 
    View, 
    Text, 
    ScrollView, 
    TouchableOpacity, 
    TextInput, 
    ActivityIndicator,
    Modal,
    SafeAreaView
} from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps'
import { Header } from '../../../../components/ui/Header'
import { FeedbackModal, FeedbackType } from '../../../../components/ui/FeedbackModal'
import { StatusBadge } from '../../../../components/ui/StatusBadge'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { Zone } from '../../../../services/api/ZoneService'
import { RouteService, RoutePlan } from '../../../../services/api/RouteService'
import { RouteDestination } from './SupervisorRouteCreateScreen'

// ============ CONSTANTES ============
const DAYS = [
    { id: 1, label: 'Lunes', short: 'L' },
    { id: 2, label: 'Martes', short: 'M' },
    { id: 3, label: 'Miércoles', short: 'Mi' },
    { id: 4, label: 'Jueves', short: 'J' },
    { id: 5, label: 'Viernes', short: 'V' },
] as const

const FREQUENCIES = [
    { id: 'SEMANAL', label: 'Semanal', icon: 'calendar' as const },
    { id: 'QUINCENAL', label: 'Quincenal', icon: 'calendar-outline' as const },
    { id: 'MENSUAL', label: 'Mensual', icon: 'calendar-clear-outline' as const },
] as const

const PRIORITIES = [
    { id: 'ALTA', label: 'Alta', color: '#EF4444', icon: 'alert-circle' as const },
    { id: 'MEDIA', label: 'Media', color: '#F59E0B', icon: 'time' as const },
    { id: 'BAJA', label: 'Baja', color: '#22C55E', icon: 'checkmark-circle' as const },
] as const

const DEFAULT_REGION: Region = {
    latitude: -3.99313,
    longitude: -79.20422,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05
}

type FrequencyType = 'SEMANAL' | 'QUINCENAL' | 'MENSUAL'
type PriorityType = 'ALTA' | 'MEDIA' | 'BAJA'

type RouteParams = {
    SupervisorRouteCreatePaso2: {
        zone: Zone
        destinations: RouteDestination[]
        existingRoutes: RoutePlan[]
    }
}

// ============ PASO 2: CONFIGURACIÓN DE LA RUTA ============
export function SupervisorRouteCreateScreenPaso2() {
    const navigation = useNavigation<any>()
    const route = useRoute<RouteProp<RouteParams, 'SupervisorRouteCreatePaso2'>>()
    
    const { zone, destinations, existingRoutes } = route.params
    
    // Form State
    const [selectedDays, setSelectedDays] = useState<number[]>([])
    const [frequency, setFrequency] = useState<FrequencyType>('SEMANAL')
    const [priority, setPriority] = useState<PriorityType>('MEDIA')
    const [timeEstimate, setTimeEstimate] = useState('')
    
    // UI State
    const [loading, setLoading] = useState(false)
    const [showFullscreenMap, setShowFullscreenMap] = useState(false)
    
    // Feedback
    const [feedbackModal, setFeedbackModal] = useState<{
        visible: boolean
        type: FeedbackType
        title: string
        message: string
        onConfirm?: () => void
    }>({ visible: false, type: 'info', title: '', message: '' })

    // ============ COMPUTED ============
    const priorityInfo = PRIORITIES.find(p => p.id === priority)
    const priorityColor = priorityInfo?.color || BRAND_COLORS.red

    const destinationsWithLocation = useMemo(() => {
        return destinations.filter(d => d.location != null)
    }, [destinations])

    const mapRegion = useMemo<Region>(() => {
        if (destinationsWithLocation.length === 0) return DEFAULT_REGION
        
        if (destinationsWithLocation.length === 1) {
            return {
                latitude: destinationsWithLocation[0].location!.latitude,
                longitude: destinationsWithLocation[0].location!.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01
            }
        }

        const lats = destinationsWithLocation.map(d => d.location!.latitude)
        const lngs = destinationsWithLocation.map(d => d.location!.longitude)
        return {
            latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
            longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
            latitudeDelta: Math.max(0.01, (Math.max(...lats) - Math.min(...lats)) * 1.5),
            longitudeDelta: Math.max(0.01, (Math.max(...lngs) - Math.min(...lngs)) * 1.5)
        }
    }, [destinationsWithLocation])

    const totalRoutes = destinations.length * selectedDays.length

    // Verificar conflictos
    const isDestinationInRoute = useCallback((clientId: string, dayId: number) => {
        return existingRoutes.some(r => 
            r.cliente_id === clientId && 
            r.dia_semana === dayId &&
            r.activo
        )
    }, [existingRoutes])

    // ============ ACTIONS ============
    const toggleDay = useCallback((dayId: number) => {
        setSelectedDays(prev => 
            prev.includes(dayId) 
                ? prev.filter(d => d !== dayId)
                : [...prev, dayId]
        )
    }, [])

    const handleSave = async () => {
        if (selectedDays.length === 0) {
            setFeedbackModal({
                visible: true,
                type: 'warning',
                title: 'Selecciona días',
                message: 'Debes seleccionar al menos un día de visita.'
            })
            return
        }

        // Verificar conflictos
        const conflicts: string[] = []
        destinations.forEach(dest => {
            selectedDays.forEach(day => {
                if (isDestinationInRoute(dest.clientId, day)) {
                    const dayLabel = DAYS.find(d => d.id === day)?.label || ''
                    conflicts.push(`${dest.name} - ${dayLabel}`)
                }
            })
        })

        if (conflicts.length > 0) {
            setFeedbackModal({
                visible: true,
                type: 'warning',
                title: 'Ya existen rutas',
                message: `Los siguientes destinos ya tienen ruta:\n${conflicts.slice(0, 3).join('\n')}${conflicts.length > 3 ? `\n... y ${conflicts.length - 3} más` : ''}`
            })
            return
        }

        setLoading(true)
        try {
            const promises: Promise<any>[] = []
            
            destinations.forEach((dest, index) => {
                selectedDays.forEach(day => {
                    const payload: Partial<RoutePlan> = {
                        cliente_id: dest.clientId,
                        zona_id: dest.zoneId,
                        dia_semana: day,
                        frecuencia: frequency,
                        prioridad_visita: priority,
                        orden_sugerido: index + 1,
                        activo: true,
                        hora_estimada_arribo: timeEstimate || undefined
                    }
                    promises.push(RouteService.create(payload))
                })
            })

            await Promise.all(promises)
            
            setFeedbackModal({
                visible: true,
                type: 'success',
                title: '¡Rutas Creadas!',
                message: `Se crearon ${totalRoutes} ruta(s) para ${destinations.length} destino(s).`,
                onConfirm: () => {
                    // Volver a la pantalla de rutas
                    navigation.navigate('SupervisorRoutes')
                }
            })
        } catch (error: any) {
            console.error('Error creating routes:', error)
            setFeedbackModal({
                visible: true,
                type: 'error',
                title: 'Error',
                message: error.message || 'No se pudieron crear las rutas'
            })
        } finally {
            setLoading(false)
        }
    }

    // ============ RENDER ============
    return (
        <View className="flex-1 bg-neutral-50">
            <Header 
                title="Nueva Ruta (2/2)" 
                variant="standard" 
                onBackPress={() => navigation.goBack()} 
            />

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="p-5">
                    
                    {/* Indicador de pasos */}
                    <View className="flex-row items-center justify-center mb-6">
                        <View className="flex-row items-center">
                            <View className="w-8 h-8 rounded-full bg-green-500 items-center justify-center">
                                <Ionicons name="checkmark" size={18} color="white" />
                            </View>
                            <View className="w-16 h-1 bg-red-500 mx-2" />
                            <View className="w-8 h-8 rounded-full bg-red-500 items-center justify-center">
                                <Text className="text-white font-bold">2</Text>
                            </View>
                        </View>
                    </View>

                    {/* Resumen de selección del paso 1 */}
                    <View className="bg-white p-4 rounded-2xl border border-neutral-200 mb-6">
                        <Text className="text-neutral-500 text-xs uppercase font-medium mb-2">Resumen Paso 1</Text>
                        <View className="flex-row items-center mb-2">
                            <Ionicons name="map" size={16} color="#4F46E5" />
                            <Text className="text-neutral-900 font-medium ml-2">Zona: {zone.nombre}</Text>
                        </View>
                        <View className="flex-row items-center">
                            <Ionicons name="business" size={16} color="#3B82F6" />
                            <Text className="text-neutral-900 font-medium ml-2">{destinations.length} destino(s) seleccionado(s)</Text>
                        </View>
                        {/* Chips de destinos */}
                        <View className="flex-row flex-wrap mt-3">
                            {destinations.slice(0, 3).map(dest => (
                                <View key={dest.id} className="bg-blue-50 px-2 py-1 rounded-full mr-2 mb-1">
                                    <Text className="text-blue-700 text-xs">{dest.name.substring(0, 15)}{dest.name.length > 15 ? '...' : ''}</Text>
                                </View>
                            ))}
                            {destinations.length > 3 && (
                                <View className="bg-neutral-100 px-2 py-1 rounded-full mb-1">
                                    <Text className="text-neutral-600 text-xs">+{destinations.length - 3} más</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* ============ DÍAS DE VISITA ============ */}
                    <View className="mb-6">
                        <Text className="text-lg font-bold text-neutral-900 mb-3">
                            <Text className="text-red-500">📅</Text> Días de Visita
                        </Text>
                        <View className="flex-row justify-between">
                            {DAYS.map(day => {
                                const isSelected = selectedDays.includes(day.id)
                                
                                return (
                                    <TouchableOpacity
                                        key={day.id}
                                        onPress={() => toggleDay(day.id)}
                                        className={`flex-1 mx-1 py-4 rounded-2xl items-center border-2 ${
                                            isSelected 
                                                ? 'bg-red-500 border-red-500' 
                                                : 'bg-white border-neutral-200'
                                        }`}
                                    >
                                        <Text className={`text-xs font-medium ${isSelected ? 'text-red-100' : 'text-neutral-400'}`}>
                                            {day.short}
                                        </Text>
                                        <Text className={`font-bold text-sm mt-1 ${isSelected ? 'text-white' : 'text-neutral-700'}`}>
                                            {day.label.substring(0, 3)}
                                        </Text>
                                        {isSelected && (
                                            <Ionicons name="checkmark-circle" size={16} color="white" style={{ marginTop: 4 }} />
                                        )}
                                    </TouchableOpacity>
                                )
                            })}
                        </View>
                        {selectedDays.length > 0 && (
                            <Text className="text-green-600 text-xs mt-2 text-center font-medium">
                                ✓ {selectedDays.length} día(s) • {totalRoutes} ruta(s) a crear
                            </Text>
                        )}
                    </View>

                    {/* ============ FRECUENCIA ============ */}
                    <View className="mb-6">
                        <Text className="text-lg font-bold text-neutral-900 mb-3">
                            <Text className="text-red-500">🔄</Text> Frecuencia
                        </Text>
                        <View className="flex-row gap-3">
                            {FREQUENCIES.map(freq => (
                                <TouchableOpacity
                                    key={freq.id}
                                    onPress={() => setFrequency(freq.id as FrequencyType)}
                                    className={`flex-1 p-4 rounded-2xl border-2 items-center ${
                                        frequency === freq.id 
                                            ? 'bg-red-50 border-red-400' 
                                            : 'bg-white border-neutral-200'
                                    }`}
                                >
                                    <Ionicons 
                                        name={freq.icon} 
                                        size={24} 
                                        color={frequency === freq.id ? BRAND_COLORS.red : '#9CA3AF'} 
                                    />
                                    <Text className={`font-semibold text-sm mt-2 ${
                                        frequency === freq.id ? 'text-red-600' : 'text-neutral-600'
                                    }`}>
                                        {freq.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* ============ PRIORIDAD ============ */}
                    <View className="mb-6">
                        <Text className="text-lg font-bold text-neutral-900 mb-3">
                            <Text className="text-red-500">⚡</Text> Prioridad
                        </Text>
                        <View className="flex-row gap-3">
                            {PRIORITIES.map(prio => (
                                <TouchableOpacity
                                    key={prio.id}
                                    onPress={() => setPriority(prio.id as PriorityType)}
                                    className={`flex-1 p-4 rounded-2xl border-2 items-center ${
                                        priority === prio.id ? '' : 'bg-white border-neutral-200'
                                    }`}
                                    style={priority === prio.id ? { 
                                        borderColor: prio.color, 
                                        backgroundColor: prio.color + '15' 
                                    } : {}}
                                >
                                    <View 
                                        className="w-8 h-8 rounded-full items-center justify-center" 
                                        style={{ backgroundColor: prio.color }}
                                    >
                                        <Ionicons name={prio.icon} size={18} color="white" />
                                    </View>
                                    <Text className="font-semibold text-sm mt-2" style={
                                        priority === prio.id ? { color: prio.color } : { color: '#525252' }
                                    }>
                                        {prio.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* ============ HORA ESTIMADA ============ */}
                    <View className="mb-6">
                        <Text className="text-lg font-bold text-neutral-900 mb-3">
                            <Text className="text-red-500">🕐</Text> Hora Estimada 
                            <Text className="text-neutral-400 font-normal text-sm"> (Opcional)</Text>
                        </Text>
                        <View className="bg-white p-4 rounded-2xl border border-neutral-200 flex-row items-center">
                            <View className="w-12 h-12 rounded-xl bg-green-100 items-center justify-center mr-4">
                                <Ionicons name="time" size={24} color="#22C55E" />
                            </View>
                            <TextInput
                                className="flex-1 text-neutral-900 font-medium text-base"
                                placeholder="Ej: 09:30"
                                value={timeEstimate}
                                onChangeText={setTimeEstimate}
                                keyboardType="numbers-and-punctuation"
                            />
                        </View>
                    </View>

                    {/* ============ MAPA PREVIEW ============ */}
                    {destinationsWithLocation.length > 0 && (
                        <View className="mb-6">
                            <View className="flex-row items-center justify-between mb-3">
                                <Text className="text-lg font-bold text-neutral-900">
                                    <Text className="text-red-500">🗺️</Text> Vista de Ruta
                                </Text>
                                <TouchableOpacity 
                                    onPress={() => setShowFullscreenMap(true)}
                                    className="flex-row items-center bg-neutral-100 px-3 py-2 rounded-xl"
                                >
                                    <Ionicons name="expand" size={16} color="#525252" />
                                    <Text className="text-neutral-700 font-medium text-xs ml-1">Ampliar</Text>
                                </TouchableOpacity>
                            </View>
                            
                            <TouchableOpacity 
                                onPress={() => setShowFullscreenMap(true)}
                                className="h-44 rounded-2xl overflow-hidden border border-neutral-200"
                            >
                                <MapView
                                    provider={PROVIDER_GOOGLE}
                                    style={{ flex: 1 }}
                                    region={mapRegion}
                                    scrollEnabled={false}
                                    zoomEnabled={false}
                                >
                                    {destinationsWithLocation.map((dest, index) => (
                                        <Marker key={dest.id} coordinate={dest.location!} title={dest.name}>
                                            <View className="items-center">
                                                <View 
                                                    className="w-8 h-8 rounded-full items-center justify-center"
                                                    style={{ backgroundColor: priorityColor }}
                                                >
                                                    <Text className="text-white font-bold text-sm">{index + 1}</Text>
                                                </View>
                                            </View>
                                        </Marker>
                                    ))}
                                </MapView>
                                <View className="absolute bottom-3 left-3 bg-white/90 px-3 py-2 rounded-lg flex-row items-center">
                                    <View className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: priorityColor }} />
                                    <Text className="text-neutral-700 text-xs font-medium">Prioridad {priority}</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* ============ RESUMEN FINAL ============ */}
                    {selectedDays.length > 0 && (
                        <View className="bg-neutral-900 p-5 rounded-2xl mb-6">
                            <Text className="text-white font-bold text-lg mb-3">📋 Resumen Final</Text>
                            <View className="space-y-2">
                                <View className="flex-row mt-1">
                                    <Text className="text-neutral-400 w-24">Zona:</Text>
                                    <Text className="text-white font-medium flex-1">{zone.nombre}</Text>
                                </View>
                                <View className="flex-row mt-1">
                                    <Text className="text-neutral-400 w-24">Destinos:</Text>
                                    <Text className="text-white font-medium flex-1">{destinations.length}</Text>
                                </View>
                                <View className="flex-row mt-1">
                                    <Text className="text-neutral-400 w-24">Días:</Text>
                                    <Text className="text-white font-medium flex-1">
                                        {selectedDays.map(d => DAYS.find(day => day.id === d)?.label).join(', ')}
                                    </Text>
                                </View>
                                <View className="flex-row mt-1">
                                    <Text className="text-neutral-400 w-24">Frecuencia:</Text>
                                    <Text className="text-white font-medium flex-1">{frequency}</Text>
                                </View>
                                <View className="flex-row mt-1">
                                    <Text className="text-neutral-400 w-24">Prioridad:</Text>
                                    <Text className="font-medium flex-1" style={{ color: priorityColor }}>{priority}</Text>
                                </View>
                                <View className="border-t border-neutral-700 pt-3 mt-3">
                                    <Text className="text-white font-bold text-center">
                                        Total: {totalRoutes} ruta(s) a crear
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* ============ BOTONES ============ */}
                    <View className="flex-row gap-3">
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            className="flex-1 py-5 rounded-2xl items-center border-2 border-neutral-300 bg-white"
                        >
                            <View className="flex-row items-center">
                                <Ionicons name="arrow-back" size={18} color="#525252" />
                                <Text className="text-neutral-700 font-bold text-base ml-2">Atrás</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleSave}
                            disabled={loading || selectedDays.length === 0}
                            className={`flex-2 py-5 rounded-2xl items-center shadow-lg px-8 ${
                                selectedDays.length > 0 && !loading
                                    ? 'bg-red-500' 
                                    : 'bg-neutral-300'
                            }`}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <View className="flex-row items-center">
                                    <Ionicons name="save" size={18} color="white" />
                                    <Text className="text-white font-bold text-base ml-2">Guardar</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View className="h-6" />
                </View>
            </ScrollView>

            {/* ============ MODAL: MAPA FULLSCREEN ============ */}
            <Modal visible={showFullscreenMap} animationType="slide" onRequestClose={() => setShowFullscreenMap(false)}>
                <SafeAreaView className="flex-1 bg-white">
                    <View className="flex-row items-center justify-between px-4 py-3 border-b border-neutral-200">
                        <TouchableOpacity onPress={() => setShowFullscreenMap(false)}>
                            <Ionicons name="close" size={28} color="#525252" />
                        </TouchableOpacity>
                        <Text className="text-lg font-bold">Mapa de Ruta</Text>
                        <StatusBadge label={priority} variant={priority === 'ALTA' ? 'error' : priority === 'MEDIA' ? 'warning' : 'success'} />
                    </View>

                    <MapView
                        provider={PROVIDER_GOOGLE}
                        style={{ flex: 1 }}
                        initialRegion={mapRegion}
                        showsUserLocation
                        showsMyLocationButton
                    >
                        {destinationsWithLocation.map((dest, index) => (
                            <Marker key={dest.id} coordinate={dest.location!} title={`${index + 1}. ${dest.name}`} description={dest.address}>
                                <View className="items-center">
                                    <View 
                                        className="w-12 h-12 rounded-full items-center justify-center border-2 border-white"
                                        style={{ backgroundColor: priorityColor }}
                                    >
                                        <Text className="text-white font-bold text-lg">{index + 1}</Text>
                                    </View>
                                </View>
                            </Marker>
                        ))}
                    </MapView>

                    {/* Lista de destinos */}
                    <View className="max-h-44 bg-white border-t border-neutral-200">
                        <View className="px-4 py-2 bg-neutral-50 flex-row items-center justify-between">
                            <Text className="text-neutral-700 font-bold text-sm">Destinos ({destinationsWithLocation.length})</Text>
                            <View className="flex-row items-center">
                                <View className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: priorityColor }} />
                                <Text className="text-neutral-600 text-xs">Prioridad {priority}</Text>
                            </View>
                        </View>
                        <ScrollView className="px-4">
                            {destinationsWithLocation.map((dest, index) => (
                                <View key={dest.id} className="flex-row items-center py-3 border-b border-neutral-100">
                                    <View 
                                        className="w-8 h-8 rounded-full items-center justify-center mr-3"
                                        style={{ backgroundColor: priorityColor }}
                                    >
                                        <Text className="text-white font-bold text-sm">{index + 1}</Text>
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-neutral-900 font-medium" numberOfLines={1}>{dest.name}</Text>
                                        <Text className="text-neutral-500 text-xs">
                                            {dest.type === 'branch' ? `Sucursal de ${dest.clientName}` : 'Sede principal'}
                                        </Text>
                                    </View>
                                    <Ionicons 
                                        name={dest.type === 'branch' ? 'storefront' : 'business'} 
                                        size={20} 
                                        color="#9CA3AF" 
                                    />
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                </SafeAreaView>
            </Modal>

            <FeedbackModal
                visible={feedbackModal.visible}
                type={feedbackModal.type}
                title={feedbackModal.title}
                message={feedbackModal.message}
                onClose={() => setFeedbackModal(prev => ({ ...prev, visible: false }))}
                onConfirm={feedbackModal.onConfirm}
            />
        </View>
    )
}

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { 
    View, 
    Text, 
    ScrollView, 
    TouchableOpacity, 
    ActivityIndicator,
    Modal,
    SafeAreaView,
    TextInput,
    Alert
} from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import MapView, { Marker, Polygon, PROVIDER_GOOGLE, Region } from 'react-native-maps'
import { Header } from '../../../../components/ui/Header'
import { FeedbackModal, FeedbackType } from '../../../../components/ui/FeedbackModal'
import { StatusBadge } from '../../../../components/ui/StatusBadge'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { ZoneService, Zone, ZoneHelpers, LatLng } from '../../../../services/api/ZoneService'
import { RouteService, RoutePlan } from '../../../../services/api/RouteService'
import { ClientService, Client, ClientBranch } from '../../../../services/api/ClientService'

// ============ TYPES ============
type RouteDetailParams = {
    RouteDetail: {
        routeId: string
        mode: 'view' | 'edit'
    }
}

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
    latitudeDelta: 0.1,
    longitudeDelta: 0.1
}

// ============ COMPONENT ============
export function SupervisorRouteDetailScreen() {
    const navigation = useNavigation<any>()
    const route = useRoute<RouteProp<RouteDetailParams, 'RouteDetail'>>()
    const { routeId, mode: initialMode } = route.params

    const mapRef = useRef<MapView>(null)

    // Data State
    const [routeData, setRouteData] = useState<RoutePlan | null>(null)
    const [client, setClient] = useState<Client | null>(null)
    const [branch, setBranch] = useState<ClientBranch | null>(null)
    const [zone, setZone] = useState<Zone | null>(null)
    const [zonePolygon, setZonePolygon] = useState<LatLng[]>([])

    // Edit State
    const [isEditMode, setIsEditMode] = useState(initialMode === 'edit')
    const [selectedDay, setSelectedDay] = useState<number>(1)
    const [frequency, setFrequency] = useState<'SEMANAL' | 'QUINCENAL' | 'MENSUAL'>('SEMANAL')
    const [priority, setPriority] = useState<'ALTA' | 'MEDIA' | 'BAJA'>('MEDIA')
    const [timeEstimate, setTimeEstimate] = useState<string>('')
    const [order, setOrder] = useState<string>('1')

    // UI State
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [showFullscreenMap, setShowFullscreenMap] = useState(false)

    // Feedback State
    const [feedbackModal, setFeedbackModal] = useState<{
        visible: boolean
        type: FeedbackType
        title: string
        message: string
    }>({ visible: false, type: 'info', title: '', message: '' })

    // ============ LOAD DATA ============
    useEffect(() => {
        loadRouteData()
    }, [routeId])

    const loadRouteData = async () => {
        setLoading(true)
        try {
            // Obtener la ruta
            const allRoutes = await RouteService.getAll()
            const foundRoute = allRoutes.find(r => r.id === routeId)
            
            if (!foundRoute) {
                setFeedbackModal({
                    visible: true,
                    type: 'error',
                    title: 'Error',
                    message: 'No se encontró la ruta'
                })
                navigation.goBack()
                return
            }

            setRouteData(foundRoute)

            // Establecer valores para edición
            setSelectedDay(foundRoute.dia_semana)
            setFrequency(foundRoute.frecuencia as 'SEMANAL' | 'QUINCENAL' | 'MENSUAL')
            setPriority(foundRoute.prioridad_visita as 'ALTA' | 'MEDIA' | 'BAJA')
            setTimeEstimate(foundRoute.hora_estimada_arribo || '')
            setOrder(String(foundRoute.orden_sugerido || 1))

            // Cargar cliente
            const clients = await ClientService.getClients()
            const foundClient = clients.find(c => c.id === foundRoute.cliente_id)
            setClient(foundClient || null)

            // Si tiene sucursal, cargarla
            if (foundRoute.sucursal_id) {
                try {
                    const branches = await ClientService.getClientBranches(foundRoute.cliente_id)
                    const foundBranch = branches.find(b => b.id === foundRoute.sucursal_id)
                    setBranch(foundBranch || null)
                } catch (e) {
                    console.log('Error loading branch:', e)
                }
            }

            // Cargar zona con polígono
            if (foundRoute.zona_id) {
                try {
                    const zones = await ZoneService.getZones()
                    const foundZone = zones.find(z => z.id === foundRoute.zona_id)
                    console.log('[RouteDetail] Zona encontrada:', foundZone?.nombre, '- Tiene polígono:', !!foundZone?.poligono_geografico)
                    if (foundZone) {
                        setZone(foundZone)
                        // Parsear polígono si existe
                        if (foundZone.poligono_geografico) {
                            console.log('[RouteDetail] Polígono raw:', JSON.stringify(foundZone.poligono_geografico).substring(0, 300))
                            const polygon = ZoneHelpers.parsePolygon(foundZone.poligono_geografico)
                            console.log('[RouteDetail] Polígono parseado:', polygon.length, 'puntos')
                            setZonePolygon(polygon)
                        } else {
                            console.log('[RouteDetail] La zona no tiene polígono definido')
                        }
                    }
                } catch (e) {
                    console.log('Error loading zone:', e)
                }
            }

        } catch (error) {
            console.error('Error loading route data:', error)
            setFeedbackModal({
                visible: true,
                type: 'error',
                title: 'Error',
                message: 'No se pudo cargar la información de la ruta'
            })
        } finally {
            setLoading(false)
        }
    }

    // ============ COMPUTED ============
    const destinationLocation = useCallback(() => {
        // Priorizar ubicación de sucursal, sino ubicación del cliente
        if (branch?.ubicacion_gps?.coordinates) {
            return {
                latitude: branch.ubicacion_gps.coordinates[1],
                longitude: branch.ubicacion_gps.coordinates[0]
            }
        }
        if (client?.ubicacion_gps?.coordinates) {
            return {
                latitude: client.ubicacion_gps.coordinates[1],
                longitude: client.ubicacion_gps.coordinates[0]
            }
        }
        return null
    }, [branch, client])

    const mapRegion = useCallback((): Region => {
        const loc = destinationLocation()
        if (loc) {
            return {
                ...loc,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02
            }
        }
        // Si hay polígono, centrar en él
        if (zonePolygon.length > 0) {
            const lats = zonePolygon.map(p => p.latitude)
            const lngs = zonePolygon.map(p => p.longitude)
            const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2
            const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2
            return {
                latitude: centerLat,
                longitude: centerLng,
                latitudeDelta: Math.max(...lats) - Math.min(...lats) + 0.02,
                longitudeDelta: Math.max(...lngs) - Math.min(...lngs) + 0.02
            }
        }
        return DEFAULT_REGION
    }, [destinationLocation, zonePolygon])

    const getPriorityInfo = (priorityId: string) => {
        return PRIORITIES.find(p => p.id === priorityId) || PRIORITIES[1]
    }

    const getFrequencyLabel = (freq: string) => {
        return FREQUENCIES.find(f => f.id === freq)?.label || freq
    }

    const getDayLabel = (dayId: number) => {
        return DAYS.find(d => d.id === dayId)?.label || ''
    }

    // ============ HANDLERS ============
    const handleSave = async () => {
        if (!routeData) return

        setSaving(true)
        try {
            const updatedRoute: Partial<RoutePlan> = {
                dia_semana: selectedDay,
                frecuencia: frequency,
                prioridad_visita: priority,
                orden_sugerido: parseInt(order) || 1,
                hora_estimada_arribo: timeEstimate || undefined
            }

            await RouteService.update(routeData.id, updatedRoute)

            setFeedbackModal({
                visible: true,
                type: 'success',
                title: '¡Guardado!',
                message: 'La ruta ha sido actualizada correctamente'
            })

            setIsEditMode(false)
            // Recargar datos
            await loadRouteData()

        } catch (error) {
            console.error('Error saving route:', error)
            setFeedbackModal({
                visible: true,
                type: 'error',
                title: 'Error',
                message: 'No se pudo guardar los cambios'
            })
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = () => {
        Alert.alert(
            'Eliminar Ruta',
            '¿Estás seguro de eliminar esta ruta? Esta acción no se puede deshacer.',
            [
                { text: 'Cancelar', style: 'cancel' },
                { 
                    text: 'Eliminar', 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await RouteService.delete(routeId)
                            setFeedbackModal({
                                visible: true,
                                type: 'success',
                                title: 'Eliminado',
                                message: 'La ruta ha sido eliminada'
                            })
                            setTimeout(() => navigation.goBack(), 1500)
                        } catch (error) {
                            setFeedbackModal({
                                visible: true,
                                type: 'error',
                                title: 'Error',
                                message: 'No se pudo eliminar la ruta'
                            })
                        }
                    }
                }
            ]
        )
    }

    // ============ RENDER ============
    if (loading) {
        return (
            <View className="flex-1 bg-neutral-50">
                <Header 
                    title="Detalle de Ruta" 
                    variant="standard" 
                    onBackPress={() => navigation.goBack()} 
                />
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={BRAND_COLORS.red} />
                    <Text className="text-neutral-500 mt-4">Cargando...</Text>
                </View>
            </View>
        )
    }

    if (!routeData || !client) {
        return (
            <View className="flex-1 bg-neutral-50">
                <Header 
                    title="Detalle de Ruta" 
                    variant="standard" 
                    onBackPress={() => navigation.goBack()} 
                />
                <View className="flex-1 items-center justify-center px-8">
                    <Ionicons name="alert-circle" size={64} color="#EF4444" />
                    <Text className="text-neutral-900 font-bold text-xl mt-4">Ruta no encontrada</Text>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="mt-6 bg-red-500 px-6 py-3 rounded-xl"
                    >
                        <Text className="text-white font-bold">Volver</Text>
                    </TouchableOpacity>
                </View>
            </View>
        )
    }

    const priorityInfo = getPriorityInfo(isEditMode ? priority : routeData.prioridad_visita)
    const location = destinationLocation()

    return (
        <View className="flex-1 bg-neutral-50">
            <Header 
                title={isEditMode ? "Editar Ruta" : "Detalle de Ruta"}
                variant="standard" 
                onBackPress={() => {
                    if (isEditMode) {
                        setIsEditMode(false)
                        loadRouteData() // Reset values
                    } else {
                        navigation.goBack()
                    }
                }} 
            />

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="p-5">

                    {/* ============ HEADER INFO ============ */}
                    <View className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden mb-5">
                        {/* Mapa miniatura */}
                        <TouchableOpacity 
                            onPress={() => setShowFullscreenMap(true)}
                            className="h-48 bg-neutral-200"
                        >
                            <MapView
                                provider={PROVIDER_GOOGLE}
                                style={{ flex: 1 }}
                                region={mapRegion()}
                                scrollEnabled={false}
                                zoomEnabled={false}
                                pitchEnabled={false}
                                rotateEnabled={false}
                            >
                                {/* Polígono de zona */}
                                {zonePolygon.length >= 3 && (
                                    <Polygon
                                        coordinates={zonePolygon}
                                        fillColor="rgba(79, 70, 229, 0.2)"
                                        strokeColor="#4F46E5"
                                        strokeWidth={3}
                                    />
                                )}

                                {/* Marcador de destino */}
                                {location && (
                                    <Marker
                                        coordinate={location}
                                        title={branch ? branch.nombre_sucursal : client.nombre_comercial || client.razon_social}
                                    >
                                        <View className="items-center">
                                            <View className={`w-12 h-12 rounded-full items-center justify-center shadow-lg border-2 border-white ${branch ? 'bg-orange-500' : 'bg-green-500'}`}>
                                                <Ionicons name={branch ? 'storefront' : 'business'} size={24} color="white" />
                                            </View>
                                        </View>
                                    </Marker>
                                )}
                            </MapView>

                            {/* Overlay con información de zona */}
                            <View className="absolute top-2 left-2 right-2 flex-row justify-between">
                                {/* Indicador de zona */}
                                {zone && (
                                    <View className="bg-indigo-600/90 px-3 py-1.5 rounded-full flex-row items-center">
                                        <Ionicons name="map" size={12} color="white" />
                                        <Text className="text-white text-xs font-medium ml-1">{zone.nombre}</Text>
                                    </View>
                                )}
                                {/* Estado del polígono */}
                                <View className={`px-3 py-1.5 rounded-full flex-row items-center ${zonePolygon.length >= 3 ? 'bg-green-600/90' : 'bg-amber-500/90'}`}>
                                    <Ionicons name={zonePolygon.length >= 3 ? 'checkmark-circle' : 'warning'} size={12} color="white" />
                                    <Text className="text-white text-xs font-medium ml-1">
                                        {zonePolygon.length >= 3 ? 'Área visible' : 'Sin área definida'}
                                    </Text>
                                </View>
                            </View>

                            {/* Overlay para expandir */}
                            <View className="absolute bottom-2 right-2 bg-white/95 px-4 py-2 rounded-full flex-row items-center shadow">
                                <Ionicons name="expand" size={16} color="#4F46E5" />
                                <Text className="text-indigo-600 text-sm font-bold ml-1.5">Ver mapa</Text>
                            </View>
                        </TouchableOpacity>

                        {/* Info del cliente */}
                        <View className="p-4">
                            <View className="flex-row items-start justify-between">
                                <View className="flex-1">
                                    <View className="flex-row items-center mb-1">
                                        <View className={`w-8 h-8 rounded-full items-center justify-center mr-2 ${branch ? 'bg-orange-100' : 'bg-green-100'}`}>
                                            <Ionicons name={branch ? 'storefront' : 'business'} size={16} color={branch ? '#F59E0B' : '#22C55E'} />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-neutral-900 font-bold text-lg" numberOfLines={1}>
                                                {branch ? branch.nombre_sucursal : (client.nombre_comercial || client.razon_social)}
                                            </Text>
                                            {branch && (
                                                <Text className="text-neutral-500 text-xs">
                                                    Sucursal de: {client.nombre_comercial || client.razon_social}
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                    <Text className="text-neutral-500 text-sm mt-1">
                                        {client.identificacion}
                                    </Text>
                                </View>
                                <StatusBadge label={priorityInfo.label} variant={
                                    priorityInfo.id === 'ALTA' ? 'error' : 
                                    priorityInfo.id === 'MEDIA' ? 'warning' : 'success'
                                } />
                            </View>

                            {/* Dirección */}
                            <View className="flex-row items-start mt-3 pt-3 border-t border-neutral-100">
                                <Ionicons name="location" size={18} color="#6B7280" />
                                <Text className="text-neutral-600 text-sm ml-2 flex-1">
                                    {branch?.direccion_entrega || client.direccion_texto || 'Sin dirección registrada'}
                                </Text>
                            </View>

                            {/* Zona */}
                            {zone && (
                                <View className="flex-row items-center mt-2">
                                    <Ionicons name="map" size={16} color="#4F46E5" />
                                    <Text className="text-indigo-600 text-sm font-medium ml-2">
                                        Zona: {zone.nombre} ({zone.codigo})
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* ============ DETALLES DE LA RUTA ============ */}
                    <View className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-4 mb-5">
                        <Text className="text-lg font-bold text-neutral-900 mb-4">
                            <Text className="text-red-500">📋</Text> Detalles de Visita
                        </Text>

                        {/* Día de visita */}
                        <View className="mb-4">
                            <Text className="text-neutral-500 text-sm font-medium mb-2">Día de visita</Text>
                            {isEditMode ? (
                                <View className="flex-row justify-between">
                                    {DAYS.map(day => (
                                        <TouchableOpacity
                                            key={day.id}
                                            onPress={() => setSelectedDay(day.id)}
                                            className={`flex-1 mx-1 py-3 rounded-xl items-center ${
                                                selectedDay === day.id ? 'bg-red-500' : 'bg-neutral-100'
                                            }`}
                                        >
                                            <Text className={`text-xs font-bold ${
                                                selectedDay === day.id ? 'text-white' : 'text-neutral-600'
                                            }`}>
                                                {day.short}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            ) : (
                                <View className="flex-row items-center">
                                    <View className="bg-red-100 px-4 py-2 rounded-xl">
                                        <Text className="text-red-700 font-bold">{getDayLabel(routeData.dia_semana)}</Text>
                                    </View>
                                </View>
                            )}
                        </View>

                        {/* Frecuencia */}
                        <View className="mb-4">
                            <Text className="text-neutral-500 text-sm font-medium mb-2">Frecuencia</Text>
                            {isEditMode ? (
                                <View className="flex-row">
                                    {FREQUENCIES.map(freq => (
                                        <TouchableOpacity
                                            key={freq.id}
                                            onPress={() => setFrequency(freq.id)}
                                            className={`flex-1 mx-1 py-3 rounded-xl items-center flex-row justify-center ${
                                                frequency === freq.id ? 'bg-blue-500' : 'bg-neutral-100'
                                            }`}
                                        >
                                            <Ionicons 
                                                name={freq.icon} 
                                                size={16} 
                                                color={frequency === freq.id ? 'white' : '#6B7280'} 
                                            />
                                            <Text className={`text-xs font-medium ml-1 ${
                                                frequency === freq.id ? 'text-white' : 'text-neutral-600'
                                            }`}>
                                                {freq.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            ) : (
                                <View className="flex-row items-center">
                                    <View className="bg-blue-100 px-4 py-2 rounded-xl flex-row items-center">
                                        <Ionicons name="repeat" size={16} color="#3B82F6" />
                                        <Text className="text-blue-700 font-medium ml-2">{getFrequencyLabel(routeData.frecuencia)}</Text>
                                    </View>
                                </View>
                            )}
                        </View>

                        {/* Prioridad */}
                        <View className="mb-4">
                            <Text className="text-neutral-500 text-sm font-medium mb-2">Prioridad</Text>
                            {isEditMode ? (
                                <View className="flex-row">
                                    {PRIORITIES.map(prio => (
                                        <TouchableOpacity
                                            key={prio.id}
                                            onPress={() => setPriority(prio.id)}
                                            className={`flex-1 mx-1 py-3 rounded-xl items-center border-2 ${
                                                priority === prio.id 
                                                    ? `border-[${prio.color}]` 
                                                    : 'border-transparent bg-neutral-100'
                                            }`}
                                            style={priority === prio.id ? { backgroundColor: prio.color + '20', borderColor: prio.color } : {}}
                                        >
                                            <Ionicons name={prio.icon} size={20} color={prio.color} />
                                            <Text className="text-xs font-medium mt-1" style={{ color: prio.color }}>
                                                {prio.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            ) : (
                                <View className="flex-row items-center">
                                    <View 
                                        className="px-4 py-2 rounded-xl flex-row items-center"
                                        style={{ backgroundColor: priorityInfo.color + '20' }}
                                    >
                                        <Ionicons name={priorityInfo.icon} size={16} color={priorityInfo.color} />
                                        <Text className="font-medium ml-2" style={{ color: priorityInfo.color }}>
                                            {priorityInfo.label}
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>

                        {/* Hora estimada */}
                        <View className="mb-4">
                            <Text className="text-neutral-500 text-sm font-medium mb-2">Hora estimada de arribo</Text>
                            {isEditMode ? (
                                <TextInput
                                    value={timeEstimate}
                                    onChangeText={setTimeEstimate}
                                    placeholder="Ej: 09:00"
                                    className="bg-neutral-100 rounded-xl px-4 py-3 text-neutral-900"
                                    placeholderTextColor="#9CA3AF"
                                />
                            ) : (
                                <View className="flex-row items-center">
                                    <View className="bg-green-100 px-4 py-2 rounded-xl flex-row items-center">
                                        <Ionicons name="time" size={16} color="#22C55E" />
                                        <Text className="text-green-700 font-medium ml-2">
                                            {routeData.hora_estimada_arribo || 'No especificada'}
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>

                        {/* Orden sugerido */}
                        <View>
                            <Text className="text-neutral-500 text-sm font-medium mb-2">Orden en la ruta</Text>
                            {isEditMode ? (
                                <TextInput
                                    value={order}
                                    onChangeText={setOrder}
                                    placeholder="1"
                                    keyboardType="numeric"
                                    className="bg-neutral-100 rounded-xl px-4 py-3 text-neutral-900 w-24"
                                    placeholderTextColor="#9CA3AF"
                                />
                            ) : (
                                <View className="flex-row items-center">
                                    <View className="w-10 h-10 rounded-full bg-red-500 items-center justify-center">
                                        <Text className="text-white font-bold text-lg">{routeData.orden_sugerido || '?'}</Text>
                                    </View>
                                    <Text className="text-neutral-500 text-sm ml-3">Posición en el recorrido del día</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* ============ ACCIONES ============ */}
                    {isEditMode ? (
                        <View className="flex-row gap-3 mb-8">
                            <TouchableOpacity
                                onPress={() => {
                                    setIsEditMode(false)
                                    loadRouteData()
                                }}
                                className="flex-1 bg-neutral-200 py-4 rounded-2xl items-center"
                            >
                                <Text className="text-neutral-700 font-bold">Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleSave}
                                disabled={saving}
                                className="flex-1 bg-red-500 py-4 rounded-2xl items-center flex-row justify-center"
                            >
                                {saving ? (
                                    <ActivityIndicator color="white" size="small" />
                                ) : (
                                    <>
                                        <Ionicons name="checkmark" size={20} color="white" />
                                        <Text className="text-white font-bold ml-2">Guardar</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View className="gap-3 mb-8">
                            <TouchableOpacity
                                onPress={() => setIsEditMode(true)}
                                className="bg-blue-500 py-4 rounded-2xl items-center flex-row justify-center"
                            >
                                <Ionicons name="pencil" size={20} color="white" />
                                <Text className="text-white font-bold ml-2">Editar Ruta</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleDelete}
                                className="bg-red-100 py-4 rounded-2xl items-center flex-row justify-center"
                            >
                                <Ionicons name="trash" size={20} color="#EF4444" />
                                <Text className="text-red-500 font-bold ml-2">Eliminar Ruta</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* ============ MODAL: MAPA FULLSCREEN ============ */}
            <Modal visible={showFullscreenMap} animationType="slide" onRequestClose={() => setShowFullscreenMap(false)}>
                <SafeAreaView className="flex-1 bg-white">
                    {/* Header del modal */}
                    <View className="flex-row items-center justify-between px-4 py-3 border-b border-neutral-200">
                        <TouchableOpacity onPress={() => setShowFullscreenMap(false)}>
                            <Ionicons name="close" size={28} color="#374151" />
                        </TouchableOpacity>
                        <Text className="text-lg font-bold text-neutral-900">Ubicación en Mapa</Text>
                        <View style={{ width: 28 }} />
                    </View>

                    {/* Mapa fullscreen */}
                    <MapView
                        ref={mapRef}
                        provider={PROVIDER_GOOGLE}
                        style={{ flex: 1 }}
                        initialRegion={mapRegion()}
                        showsUserLocation={true}
                        showsMyLocationButton={true}
                    >
                        {/* Polígono de zona */}
                        {zonePolygon.length >= 3 && (
                            <Polygon
                                coordinates={zonePolygon}
                                fillColor="rgba(79, 70, 229, 0.2)"
                                strokeColor="#4F46E5"
                                strokeWidth={3}
                            />
                        )}

                        {/* Marcador de destino */}
                        {location && (
                            <Marker
                                coordinate={location}
                                title={branch ? branch.nombre_sucursal : client.nombre_comercial || client.razon_social}
                                description={branch?.direccion_entrega || client.direccion_texto || undefined}
                            >
                                <View className="items-center">
                                    <View className={`w-12 h-12 rounded-full items-center justify-center shadow-lg ${branch ? 'bg-orange-500' : 'bg-green-500'}`}>
                                        <Ionicons name={branch ? 'storefront' : 'business'} size={24} color="white" />
                                    </View>
                                    <View className="w-3 h-3 bg-neutral-800 rotate-45 -mt-1.5" />
                                </View>
                            </Marker>
                        )}
                    </MapView>

                    {/* Leyenda */}
                    <View className="absolute bottom-6 left-4 right-4 bg-white rounded-2xl shadow-lg p-4">
                        <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center flex-1">
                                <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${branch ? 'bg-orange-100' : 'bg-green-100'}`}>
                                    <Ionicons name={branch ? 'storefront' : 'business'} size={20} color={branch ? '#F59E0B' : '#22C55E'} />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-neutral-900 font-bold" numberOfLines={1}>
                                        {branch ? branch.nombre_sucursal : (client.nombre_comercial || client.razon_social)}
                                    </Text>
                                    {zone && (
                                        <Text className="text-indigo-600 text-xs">
                                            📍 {zone.nombre}
                                        </Text>
                                    )}
                                </View>
                            </View>
                            {zonePolygon.length > 0 && (
                                <View className="bg-indigo-100 px-3 py-1.5 rounded-full">
                                    <Text className="text-indigo-700 text-xs font-medium">Zona visible</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </SafeAreaView>
            </Modal>

            {/* ============ FEEDBACK MODAL ============ */}
            <FeedbackModal
                visible={feedbackModal.visible}
                type={feedbackModal.type}
                title={feedbackModal.title}
                message={feedbackModal.message}
                onClose={() => setFeedbackModal(prev => ({ ...prev, visible: false }))}
            />
        </View>
    )
}

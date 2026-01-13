import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import MapView, { Marker, Polygon, PROVIDER_GOOGLE, Polyline } from 'react-native-maps'
import { Header } from '../../../../components/ui/Header'
import { FeedbackModal, FeedbackType } from '../../../../components/ui/FeedbackModal'
import { GenericModal } from '../../../../components/ui/GenericModal'
import { StatusBadge } from '../../../../components/ui/StatusBadge'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { ZoneService, Zone, ZoneHelpers, LatLng } from '../../../../services/api/ZoneService'
import { RouteService, RoutePlan } from '../../../../services/api/RouteService'
import { ClientService, Client, ClientBranch } from '../../../../services/api/ClientService'

// Extendemos RoutePlan con información del cliente
interface RoutePlanWithClient extends RoutePlan {
    cliente?: {
        razon_social: string
        nombre_comercial: string
        identificacion: string
        direccion_texto?: string
        ubicacion_gps?: {
            type: 'Point'
            coordinates: [number, number]
        } | null
    }
    sucursal?: {
        nombre_sucursal: string
        direccion_entrega?: string
        ubicacion_gps?: {
            type: 'Point'
            coordinates: [number, number]
        } | null
    }
}

const DAYS = [
    { id: 1, label: 'Lunes', short: 'Lun' },
    { id: 2, label: 'Martes', short: 'Mar' },
    { id: 3, label: 'Miércoles', short: 'Mié' },
    { id: 4, label: 'Jueves', short: 'Jue' },
    { id: 5, label: 'Viernes', short: 'Vie' },
]

export function SupervisorRoutesScreen() {
    const navigation = useNavigation()

    // Data State
    const [zones, setZones] = useState<Zone[]>([])
    const [routes, setRoutes] = useState<RoutePlanWithClient[]>([])
    const [allClients, setAllClients] = useState<Map<string, Client>>(new Map())
    
    // Filter State
    const [selectedZone, setSelectedZone] = useState<Zone | null>(null)
    const [selectedDay, setSelectedDay] = useState(1) // Default: Lunes
    
    // UI State
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [showZoneModal, setShowZoneModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [showMapModal, setShowMapModal] = useState(false)
    const [itemToDelete, setItemToDelete] = useState<RoutePlanWithClient | null>(null)

    // Polígono de la zona seleccionada
    const zonePolygon = useMemo((): LatLng[] => {
        if (!selectedZone?.poligono_geografico) return []
        return ZoneHelpers.parsePolygon(selectedZone.poligono_geografico)
    }, [selectedZone])

    // Marcadores de visitas con ubicación GPS
    const routeMarkers = useMemo(() => {
        return routes.map((route, index) => {
            const isBranch = !!route.sucursal
            let coords: { latitude: number, longitude: number } | null = null
            
            // Obtener coordenadas de sucursal o cliente
            if (isBranch && route.sucursal?.ubicacion_gps) {
                coords = {
                    longitude: route.sucursal.ubicacion_gps.coordinates[0],
                    latitude: route.sucursal.ubicacion_gps.coordinates[1]
                }
            } else if (route.cliente?.ubicacion_gps) {
                coords = {
                    longitude: route.cliente.ubicacion_gps.coordinates[0],
                    latitude: route.cliente.ubicacion_gps.coordinates[1]
                }
            }
            
            return {
                id: route.id,
                order: index + 1,
                name: isBranch ? route.sucursal?.nombre_sucursal : route.cliente?.nombre_comercial,
                isBranch,
                coords,
                hora: route.hora_estimada_arribo
            }
        }).filter(m => m.coords !== null) as {
            id: string
            order: number
            name: string | undefined
            isBranch: boolean
            coords: { latitude: number; longitude: number }
            hora?: string
        }[]
    }, [routes])

    // Región inicial del mapa centrada en los marcadores
    const mapInitialRegion = useMemo(() => {
        if (routeMarkers.length > 0) {
            const lats = routeMarkers.map(m => m.coords.latitude)
            const lngs = routeMarkers.map(m => m.coords.longitude)
            const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2
            const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2
            const latDelta = Math.max(0.01, (Math.max(...lats) - Math.min(...lats)) * 1.5)
            const lngDelta = Math.max(0.01, (Math.max(...lngs) - Math.min(...lngs)) * 1.5)
            return {
                latitude: centerLat,
                longitude: centerLng,
                latitudeDelta: latDelta,
                longitudeDelta: lngDelta
            }
        }
        // Default: Loja, Ecuador
        return {
            latitude: -3.99313,
            longitude: -79.20422,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1
        }
    }, [routeMarkers])

    // Línea de ruta conectando los puntos en orden
    const routePath = useMemo(() => {
        return routeMarkers.map(m => m.coords)
    }, [routeMarkers])

    // Feedback State
    const [feedbackModal, setFeedbackModal] = useState<{
        visible: boolean
        type: FeedbackType
        title: string
        message: string
    }>({
        visible: false,
        type: 'success',
        title: '',
        message: ''
    })

    // Reload on focus
    useFocusEffect(
        useCallback(() => {
            loadData()
        }, [selectedZone, selectedDay])
    )

    useEffect(() => {
        loadInitialData()
    }, [])

    useEffect(() => {
        if (selectedZone) {
            loadRoutes()
        }
    }, [selectedZone, selectedDay])

    const loadInitialData = async () => {
        setLoading(true)
        try {
            const [zonesData, clientsData] = await Promise.all([
                ZoneService.getZones(),
                ClientService.getClients()
            ])
            setZones(zonesData)
            
            // Crear mapa de clientes para lookup rápido
            const clientMap = new Map<string, Client>()
            clientsData.forEach(c => clientMap.set(c.id, c))
            setAllClients(clientMap)
            
            if (zonesData.length > 0) {
                setSelectedZone(zonesData[0])
            }
        } catch (error) {
            console.error('Error loading initial data:', error)
            showFeedback('error', 'Error', 'No se pudieron cargar los datos')
        } finally {
            setLoading(false)
        }
    }

    const loadData = async () => {
        if (selectedZone) {
            await loadRoutes()
        }
    }

    const loadRoutes = async () => {
        if (!selectedZone) return
        try {
            const allRoutes = await RouteService.getAll()
            
            // Filtrar por zona y día
            const filteredRoutes = allRoutes.filter(r => 
                r.zona_id === selectedZone.id && 
                r.dia_semana === selectedDay &&
                r.activo
            )
            
            // Enriquecer con datos del cliente y sucursal
            const enrichedRoutes: RoutePlanWithClient[] = await Promise.all(
                filteredRoutes.map(async (route) => {
                    const client = allClients.get(route.cliente_id)
                    let sucursalInfo = undefined
                    
                    // Si tiene sucursal_id, cargar información de la sucursal
                    if (route.sucursal_id && client) {
                        try {
                            const branches = await ClientService.getClientBranches(route.cliente_id)
                            const branch = branches.find(b => b.id === route.sucursal_id)
                            if (branch) {
                                sucursalInfo = {
                                    nombre_sucursal: branch.nombre_sucursal,
                                    direccion_entrega: branch.direccion_entrega || undefined,
                                    ubicacion_gps: branch.ubicacion_gps || undefined
                                }
                            }
                        } catch (e) {
                            // Ignorar error de carga de sucursal
                        }
                    }
                    
                    return {
                        ...route,
                        cliente: client ? {
                            razon_social: client.razon_social,
                            nombre_comercial: client.nombre_comercial || client.razon_social,
                            identificacion: client.identificacion,
                            direccion_texto: client.direccion_texto || undefined,
                            ubicacion_gps: client.ubicacion_gps || undefined
                        } : undefined,
                        sucursal: sucursalInfo
                    }
                })
            )
            
            // Ordenar por orden_sugerido
            enrichedRoutes.sort((a, b) => (a.orden_sugerido || 999) - (b.orden_sugerido || 999))
            
            setRoutes(enrichedRoutes)
        } catch (error) {
            console.error('Error loading routes:', error)
            setRoutes([])
        }
    }

    const onRefresh = async () => {
        setRefreshing(true)
        await loadRoutes()
        setRefreshing(false)
    }

    const showFeedback = (type: FeedbackType, title: string, message: string) => {
        setFeedbackModal({ visible: true, type, title, message })
    }

    const handleDeleteRoute = async () => {
        if (!itemToDelete) return
        setShowDeleteModal(false)
        
        try {
            await RouteService.delete(itemToDelete.id)
            showFeedback('success', 'Eliminado', 'La ruta ha sido eliminada correctamente')
            await loadRoutes()
        } catch (error) {
            console.error('Error deleting route:', error)
            showFeedback('error', 'Error', 'No se pudo eliminar la ruta')
        }
    }

    const confirmDelete = (item: RoutePlanWithClient) => {
        setItemToDelete(item)
        setShowDeleteModal(true)
    }

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'ALTA': return { variant: 'error' as const, label: 'Alta' }
            case 'MEDIA': return { variant: 'warning' as const, label: 'Media' }
            case 'BAJA': return { variant: 'success' as const, label: 'Baja' }
            default: return { variant: 'info' as const, label: 'Normal' }
        }
    }

    const getFrequencyLabel = (freq: string) => {
        switch (freq) {
            case 'SEMANAL': return 'Semanal'
            case 'QUINCENAL': return 'Quincenal'
            case 'MENSUAL': return 'Mensual'
            default: return freq
        }
    }

    return (
        <View className="flex-1 bg-neutral-50">
            <Header 
                title="Planificador de Rutas" 
                variant="standard" 
                onBackPress={() => (navigation as any).goBack()} 
            />

            {/* Instrucción inicial */}
            <View className="mx-4 mt-4 mb-2">
                <Text className="text-neutral-600 text-sm">
                    Gestiona las visitas programadas por zona y día de la semana
                </Text>
            </View>

            {/* Filtro de Zona */}
            <TouchableOpacity
                onPress={() => setShowZoneModal(true)}
                className="mx-4 bg-white p-4 rounded-2xl border border-neutral-100 shadow-sm flex-row items-center justify-between"
            >
                <View className="flex-row items-center flex-1">
                    <View className="w-10 h-10 rounded-xl bg-indigo-100 items-center justify-center mr-3">
                        <Ionicons name="map" size={20} color="#4F46E5" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-neutral-500 text-xs font-medium uppercase">Zona Comercial</Text>
                        <Text className="text-neutral-900 font-bold text-lg" numberOfLines={1}>
                            {selectedZone ? selectedZone.nombre : 'Seleccionar...'}
                        </Text>
                    </View>
                </View>
                <View className="flex-row items-center">
                    {selectedZone && (
                        <View className="bg-indigo-100 px-3 py-1 rounded-full mr-2">
                            <Text className="text-indigo-700 font-bold text-sm">{selectedZone.codigo}</Text>
                        </View>
                    )}
                    <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                </View>
            </TouchableOpacity>

            {/* Filtro de Días */}
            <View className="px-4 py-4">
                <View className="flex-row justify-between">
                    {DAYS.map(day => {
                        const isSelected = selectedDay === day.id
                        return (
                            <TouchableOpacity
                                key={day.id}
                                onPress={() => setSelectedDay(day.id)}
                                className={`flex-1 mx-1 py-3 rounded-xl items-center ${
                                    isSelected ? 'bg-red-500' : 'bg-white border border-neutral-200'
                                }`}
                            >
                                <Text className={`text-xs font-medium ${
                                    isSelected ? 'text-red-100' : 'text-neutral-400'
                                }`}>
                                    {day.short}
                                </Text>
                                <Text className={`font-bold ${
                                    isSelected ? 'text-white' : 'text-neutral-700'
                                }`}>
                                    {day.label.substring(0, 3)}
                                </Text>
                            </TouchableOpacity>
                        )
                    })}
                </View>
            </View>

            {/* Contador de Rutas + Botón Ver Mapa */}
            <View className="px-4 pb-2">
                <View className="flex-row items-center justify-between">
                    <Text className="text-neutral-500 font-medium">
                        {routes.length} {routes.length === 1 ? 'visita programada' : 'visitas programadas'}
                    </Text>
                    <View className="flex-row items-center gap-3">
                        {/* Botón Ver Mapa */}
                        {routes.length > 0 && routeMarkers.length > 0 && (
                            <TouchableOpacity
                                onPress={() => setShowMapModal(true)}
                                className="flex-row items-center bg-blue-500 px-3 py-1.5 rounded-full"
                            >
                                <Ionicons name="map" size={14} color="white" />
                                <Text className="text-white text-xs font-bold ml-1">Ver Mapa</Text>
                            </TouchableOpacity>
                        )}
                        <View className="flex-row items-center">
                            <Ionicons name="calendar-outline" size={16} color="#9CA3AF" />
                            <Text className="text-neutral-400 text-sm ml-1">
                                {DAYS.find(d => d.id === selectedDay)?.label}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Lista de Rutas */}
            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={BRAND_COLORS.red} />
                    <Text className="text-neutral-500 mt-4">Cargando rutas...</Text>
                </View>
            ) : routes.length === 0 ? (
                <View className="flex-1 items-center justify-center px-8">
                    <View className="w-24 h-24 rounded-full bg-neutral-100 items-center justify-center mb-4">
                        <Ionicons name="map-outline" size={48} color="#9CA3AF" />
                    </View>
                    <Text className="text-neutral-900 font-bold text-xl text-center mb-2">
                        Sin rutas programadas
                    </Text>
                    <Text className="text-neutral-500 text-center mb-6">
                        No hay visitas configuradas para {DAYS.find(d => d.id === selectedDay)?.label.toLowerCase()} en esta zona.
                    </Text>
                    <TouchableOpacity
                        onPress={() => (navigation as any).navigate('SupervisorRouteCreate')}
                        className="bg-red-500 px-6 py-3 rounded-xl flex-row items-center"
                    >
                        <Ionicons name="add" size={20} color="white" />
                        <Text className="text-white font-bold ml-2">Agregar Ruta</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView 
                    className="flex-1 px-4"
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[BRAND_COLORS.red]} />
                    }
                    showsVerticalScrollIndicator={false}
                >
                    {routes.map((item, index) => {
                        const priorityBadge = getPriorityBadge(item.prioridad_visita)
                        const isBranch = !!item.sucursal
                        
                        return (
                            <TouchableOpacity
                                key={item.id}
                                onPress={() => (navigation as any).navigate('SupervisorRouteDetail', { routeId: item.id, mode: 'view' })}
                                activeOpacity={0.7}
                                className="bg-white rounded-2xl mb-3 overflow-hidden shadow-sm border border-neutral-100"
                            >
                                {/* Header con Número de Orden */}
                                <View className="bg-neutral-50 px-4 py-3 flex-row items-center justify-between border-b border-neutral-100">
                                    <View className="flex-row items-center flex-1">
                                        <View className="w-10 h-10 rounded-full bg-red-500 items-center justify-center mr-3">
                                            <Text className="text-white font-bold text-lg">{index + 1}</Text>
                                        </View>
                                        <View className="flex-1">
                                            {/* Nombre destino principal */}
                                            <View className="flex-row items-center">
                                                <View className={`w-5 h-5 rounded-full items-center justify-center mr-1.5 ${isBranch ? 'bg-orange-100' : 'bg-green-100'}`}>
                                                    <Ionicons name={isBranch ? 'storefront' : 'business'} size={10} color={isBranch ? '#F59E0B' : '#22C55E'} />
                                                </View>
                                                <Text className="text-neutral-900 font-bold text-base flex-1" numberOfLines={1}>
                                                    {isBranch ? item.sucursal?.nombre_sucursal : (item.cliente?.nombre_comercial || 'Cliente sin nombre')}
                                                </Text>
                                            </View>
                                            {/* Si es sucursal, mostrar cliente padre */}
                                            {isBranch && (
                                                <Text className="text-neutral-400 text-xs mt-0.5">
                                                    De: {item.cliente?.nombre_comercial}
                                                </Text>
                                            )}
                                            {!isBranch && (
                                                <Text className="text-neutral-500 text-xs">
                                                    {item.cliente?.identificacion}
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                    <StatusBadge 
                                        label={priorityBadge.label} 
                                        variant={priorityBadge.variant} 
                                    />
                                </View>

                                {/* Detalles */}
                                <View className="px-4 py-3">
                                    <View className="flex-row flex-wrap gap-2 mb-3">
                                        {/* Frecuencia */}
                                        <View className="flex-row items-center bg-blue-50 px-3 py-1.5 rounded-full">
                                            <Ionicons name="repeat" size={14} color="#3B82F6" />
                                            <Text className="text-blue-700 text-xs font-medium ml-1">
                                                {getFrequencyLabel(item.frecuencia)}
                                            </Text>
                                        </View>
                                        
                                        {/* Hora */}
                                        {item.hora_estimada_arribo && (
                                            <View className="flex-row items-center bg-green-50 px-3 py-1.5 rounded-full">
                                                <Ionicons name="time" size={14} color="#22C55E" />
                                                <Text className="text-green-700 text-xs font-medium ml-1">
                                                    {item.hora_estimada_arribo}
                                                </Text>
                                            </View>
                                        )}
                                    </View>

                                    {/* Dirección */}
                                    {(isBranch ? item.sucursal?.direccion_entrega : item.cliente?.direccion_texto) && (
                                        <View className="flex-row items-start">
                                            <Ionicons name="location-outline" size={16} color="#9CA3AF" />
                                            <Text className="text-neutral-500 text-sm ml-2 flex-1" numberOfLines={2}>
                                                {isBranch ? item.sucursal?.direccion_entrega : item.cliente?.direccion_texto}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                {/* Acciones */}
                                <View className="flex-row border-t border-neutral-100">
                                    <TouchableOpacity 
                                        className="flex-1 py-3 flex-row items-center justify-center border-r border-neutral-100"
                                        onPress={(e) => {
                                            e.stopPropagation()
                                            ;(navigation as any).navigate('SupervisorRouteDetail', { routeId: item.id, mode: 'view' })
                                        }}
                                    >
                                        <Ionicons name="eye-outline" size={18} color="#3B82F6" />
                                        <Text className="text-blue-500 font-medium ml-2">Ver</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        className="flex-1 py-3 flex-row items-center justify-center border-r border-neutral-100"
                                        onPress={(e) => {
                                            e.stopPropagation()
                                            ;(navigation as any).navigate('SupervisorRouteDetail', { routeId: item.id, mode: 'edit' })
                                        }}
                                    >
                                        <Ionicons name="pencil-outline" size={18} color="#22C55E" />
                                        <Text className="text-green-500 font-medium ml-2">Editar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        className="flex-1 py-3 flex-row items-center justify-center"
                                        onPress={(e) => {
                                            e.stopPropagation()
                                            confirmDelete(item)
                                        }}
                                    >
                                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                        <Text className="text-red-500 font-medium ml-2">Eliminar</Text>
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        )
                    })}
                    
                    <View className="h-24" />
                </ScrollView>
            )}

            {/* FAB - Floating Action Button */}
            <TouchableOpacity
                onPress={() => (navigation as any).navigate('SupervisorRouteCreate')}
                className="absolute bottom-6 right-6 w-16 h-16 rounded-full items-center justify-center shadow-lg"
                style={{ backgroundColor: BRAND_COLORS.red, elevation: 8 }}
            >
                <Ionicons name="add" size={32} color="white" />
            </TouchableOpacity>

            {/* Modal Selección de Zona */}
            <GenericModal
                visible={showZoneModal}
                title="Seleccionar Zona"
                onClose={() => setShowZoneModal(false)}
            >
                <ScrollView className="max-h-96">
                    {zones.map(zone => (
                        <TouchableOpacity
                            key={zone.id}
                            onPress={() => {
                                setSelectedZone(zone)
                                setShowZoneModal(false)
                            }}
                            className={`p-4 border-b border-neutral-100 flex-row items-center justify-between ${
                                selectedZone?.id === zone.id ? 'bg-indigo-50' : ''
                            }`}
                        >
                            <View>
                                <Text className="text-neutral-900 font-semibold">{zone.nombre}</Text>
                                <Text className="text-neutral-500 text-sm">{zone.codigo} • {zone.ciudad}</Text>
                            </View>
                            {selectedZone?.id === zone.id && (
                                <Ionicons name="checkmark-circle" size={24} color="#4F46E5" />
                            )}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </GenericModal>

            {/* Modal Confirmar Eliminación */}
            <FeedbackModal
                visible={showDeleteModal}
                type="warning"
                title="Eliminar Ruta"
                message={`¿Estás seguro de eliminar a ${itemToDelete?.cliente?.nombre_comercial || 'este cliente'} de la ruta del ${DAYS.find(d => d.id === selectedDay)?.label?.toLowerCase()}?`}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteRoute}
                showCancel={true}
                confirmText="Eliminar"
            />

            {/* Feedback Modal */}
            <FeedbackModal
                visible={feedbackModal.visible}
                type={feedbackModal.type}
                title={feedbackModal.title}
                message={feedbackModal.message}
                onClose={() => setFeedbackModal(prev => ({ ...prev, visible: false }))}
            />

            {/* Modal Mapa de Rutas del Día */}
            <GenericModal
                visible={showMapModal}
                title={`Ruta ${DAYS.find(d => d.id === selectedDay)?.label} - ${selectedZone?.nombre || ''}`}
                onClose={() => setShowMapModal(false)}
            >
                <View className="h-[550px] rounded-xl overflow-hidden relative bg-neutral-100">
                    {routeMarkers.length > 0 ? (
                        <MapView
                            provider={PROVIDER_GOOGLE}
                            style={{ flex: 1 }}
                            initialRegion={mapInitialRegion}
                        >
                            {/* Polígono de la zona */}
                            {zonePolygon.length > 0 && (
                                <Polygon
                                    coordinates={zonePolygon}
                                    strokeColor={BRAND_COLORS.red}
                                    fillColor="rgba(239, 68, 68, 0.1)"
                                    strokeWidth={2}
                                />
                            )}

                            {/* Línea de ruta conectando puntos */}
                            {routePath.length > 1 && (
                                <Polyline
                                    coordinates={routePath}
                                    strokeColor="#3B82F6"
                                    strokeWidth={3}
                                    lineDashPattern={[10, 5]}
                                />
                            )}

                            {/* Marcadores numerados */}
                            {routeMarkers.map((marker) => (
                                <Marker
                                    key={marker.id}
                                    coordinate={marker.coords}
                                    title={`#${marker.order} - ${marker.name || 'Sin nombre'}`}
                                    description={marker.hora ? `Hora: ${marker.hora}` : undefined}
                                >
                                    <View className="items-center">
                                        {/* Número del orden */}
                                        <View 
                                            className={`w-8 h-8 rounded-full items-center justify-center shadow-md ${
                                                marker.isBranch ? 'bg-orange-500' : 'bg-red-500'
                                            }`}
                                        >
                                            <Text className="text-white font-bold text-sm">{marker.order}</Text>
                                        </View>
                                        {/* Triángulo indicador */}
                                        <View 
                                            style={{
                                                width: 0,
                                                height: 0,
                                                borderLeftWidth: 6,
                                                borderRightWidth: 6,
                                                borderTopWidth: 8,
                                                borderLeftColor: 'transparent',
                                                borderRightColor: 'transparent',
                                                borderTopColor: marker.isBranch ? '#F97316' : BRAND_COLORS.red,
                                                marginTop: -2
                                            }}
                                        />
                                    </View>
                                </Marker>
                            ))}
                        </MapView>
                    ) : (
                        <View className="flex-1 items-center justify-center">
                            <Ionicons name="location-outline" size={48} color="#9CA3AF" />
                            <Text className="text-neutral-500 mt-2">Sin ubicaciones GPS</Text>
                            <Text className="text-neutral-400 text-xs text-center mt-1 px-4">
                                Las visitas no tienen coordenadas GPS registradas
                            </Text>
                        </View>
                    )}

                    {/* Leyenda */}
                    <View className="absolute bottom-4 left-4 right-4 bg-white/95 rounded-xl p-3 shadow-lg">
                        <Text className="text-neutral-700 font-bold text-sm mb-2">Leyenda</Text>
                        <View className="flex-row flex-wrap gap-3">
                            <View className="flex-row items-center">
                                <View className="w-6 h-6 rounded-full bg-red-500 items-center justify-center mr-1.5">
                                    <Ionicons name="business" size={12} color="white" />
                                </View>
                                <Text className="text-neutral-600 text-xs">Matriz</Text>
                            </View>
                            <View className="flex-row items-center">
                                <View className="w-6 h-6 rounded-full bg-orange-500 items-center justify-center mr-1.5">
                                    <Ionicons name="storefront" size={12} color="white" />
                                </View>
                                <Text className="text-neutral-600 text-xs">Sucursal</Text>
                            </View>
                            <View className="flex-row items-center">
                                <View className="w-6 h-0.5 bg-blue-500 mr-1.5" style={{ borderStyle: 'dashed' }} />
                                <Text className="text-neutral-600 text-xs">Ruta</Text>
                            </View>
                            <View className="flex-row items-center">
                                <View className="w-4 h-4 bg-red-500/20 border border-red-500 mr-1.5" />
                                <Text className="text-neutral-600 text-xs">Zona</Text>
                            </View>
                        </View>
                        <Text className="text-neutral-400 text-[10px] mt-2 text-center">
                            Toca cada marcador para ver detalles
                        </Text>
                    </View>
                </View>
            </GenericModal>
        </View>
    )
}

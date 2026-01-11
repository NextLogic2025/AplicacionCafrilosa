import React, { useState, useEffect, useMemo, useCallback } from 'react'
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
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps'
import { Header } from '../../../../components/ui/Header'
import { GenericModal } from '../../../../components/ui/GenericModal'
import { FeedbackModal, FeedbackType } from '../../../../components/ui/FeedbackModal'
import { StatusBadge } from '../../../../components/ui/StatusBadge'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { ZoneService, Zone } from '../../../../services/api/ZoneService'
import { ClientService, Client, ClientBranch } from '../../../../services/api/ClientService'
import { RouteService, RoutePlan } from '../../../../services/api/RouteService'

// ============ TIPOS ============
export interface RouteDestination {
    type: 'client' | 'branch'
    id: string
    name: string
    address?: string
    location?: { latitude: number; longitude: number }
    clientId: string
    clientName: string
    zoneId: number
}

const DEFAULT_REGION: Region = {
    latitude: -3.99313,
    longitude: -79.20422,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05
}

const parseLocation = (ubicacionGps: { coordinates: number[] } | null | undefined) => {
    if (!ubicacionGps?.coordinates) return undefined
    return {
        latitude: ubicacionGps.coordinates[1],
        longitude: ubicacionGps.coordinates[0]
    }
}

// ============ PASO 1: SELECCIÓN DE ZONA Y DESTINOS ============
export function SupervisorRouteCreateScreen() {
    const navigation = useNavigation<any>()
    
    // Data State
    const [zones, setZones] = useState<Zone[]>([])
    const [allClients, setAllClients] = useState<Client[]>([])
    const [existingRoutes, setExistingRoutes] = useState<RoutePlan[]>([])
    
    // Selection State
    const [selectedZone, setSelectedZone] = useState<Zone | null>(null)
    const [selectedDestinations, setSelectedDestinations] = useState<RouteDestination[]>([])
    
    // UI State
    const [initializing, setInitializing] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [showZoneModal, setShowZoneModal] = useState(false)
    const [showDestinationModal, setShowDestinationModal] = useState(false)
    const [showFullscreenMap, setShowFullscreenMap] = useState(false)
    const [expandedClientId, setExpandedClientId] = useState<string | null>(null)
    const [clientBranches, setClientBranches] = useState<Map<string, ClientBranch[]>>(new Map())
    const [loadingBranches, setLoadingBranches] = useState<string | null>(null)
    
    // Feedback
    const [feedbackModal, setFeedbackModal] = useState<{
        visible: boolean
        type: FeedbackType
        title: string
        message: string
    }>({ visible: false, type: 'info', title: '', message: '' })

    // ============ DATA LOADING ============
    useEffect(() => {
        loadInitialData()
    }, [])

    const loadInitialData = async () => {
        setInitializing(true)
        try {
            const [zonesData, clientsData, routesData] = await Promise.all([
                ZoneService.getZones(),
                ClientService.getClients(),
                RouteService.getAll()
            ])
            setZones(zonesData)
            setAllClients(clientsData)
            setExistingRoutes(routesData)
        } catch (error) {
            console.error('Error loading initial data:', error)
            setFeedbackModal({
                visible: true,
                type: 'error',
                title: 'Error',
                message: 'No se pudo cargar la información inicial'
            })
        } finally {
            setInitializing(false)
        }
    }

    const loadBranchesForClient = useCallback(async (clientId: string) => {
        if (clientBranches.has(clientId)) return
        setLoadingBranches(clientId)
        try {
            const branches = await ClientService.getClientBranches(clientId)
            setClientBranches(prev => new Map(prev).set(clientId, branches))
        } catch (error) {
            console.error('Error loading branches:', error)
            setClientBranches(prev => new Map(prev).set(clientId, []))
        } finally {
            setLoadingBranches(null)
        }
    }, [clientBranches])

    // ============ COMPUTED VALUES ============
    const filteredClients = useMemo(() => {
        if (!selectedZone) return []
        return allClients.filter(c => {
            const clientZoneId = Number(c.zona_comercial_id)
            const selectedZoneId = Number(selectedZone.id)
            return clientZoneId === selectedZoneId && !c.bloqueado
        })
    }, [allClients, selectedZone])

    const searchedClients = useMemo(() => {
        if (!searchQuery.trim()) return filteredClients
        const query = searchQuery.toLowerCase()
        return filteredClients.filter(c => 
            c.razon_social.toLowerCase().includes(query) ||
            (c.nombre_comercial?.toLowerCase() || '').includes(query) ||
            c.identificacion.includes(query)
        )
    }, [filteredClients, searchQuery])

    const destinationsWithLocation = useMemo(() => {
        return selectedDestinations.filter(d => d.location != null)
    }, [selectedDestinations])

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
        const minLat = Math.min(...lats)
        const maxLat = Math.max(...lats)
        const minLng = Math.min(...lngs)
        const maxLng = Math.max(...lngs)

        return {
            latitude: (minLat + maxLat) / 2,
            longitude: (minLng + maxLng) / 2,
            latitudeDelta: Math.max(0.01, (maxLat - minLat) * 1.5),
            longitudeDelta: Math.max(0.01, (maxLng - minLng) * 1.5)
        }
    }, [destinationsWithLocation])

    // ============ ACTIONS ============
    const handleExpandClient = useCallback(async (clientId: string) => {
        if (expandedClientId === clientId) {
            setExpandedClientId(null)
        } else {
            setExpandedClientId(clientId)
            await loadBranchesForClient(clientId)
        }
    }, [expandedClientId, loadBranchesForClient])

    const handleAddDestination = useCallback((destination: RouteDestination) => {
        setSelectedDestinations(prev => {
            if (prev.some(d => d.id === destination.id)) return prev
            return [...prev, destination]
        })
    }, [])

    const handleRemoveDestination = useCallback((destinationId: string) => {
        setSelectedDestinations(prev => prev.filter(d => d.id !== destinationId))
    }, [])

    const handleContinue = () => {
        if (!selectedZone || selectedDestinations.length === 0) {
            setFeedbackModal({
                visible: true,
                type: 'warning',
                title: 'Datos incompletos',
                message: 'Selecciona una zona y al menos un destino para continuar.'
            })
            return
        }
        
        // Navegar al paso 2 con los datos seleccionados
        navigation.navigate('SupervisorRouteCreatePaso2', {
            zone: selectedZone,
            destinations: selectedDestinations,
            existingRoutes: existingRoutes
        })
    }

    // ============ RENDER ============
    if (initializing) {
        return (
            <View className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator size="large" color={BRAND_COLORS.red} />
                <Text className="text-neutral-500 mt-4">Cargando datos...</Text>
            </View>
        )
    }

    return (
        <View className="flex-1 bg-neutral-50">
            <Header 
                title="Nueva Ruta (1/2)" 
                variant="standard" 
                onBackPress={() => navigation.goBack()} 
            />

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="p-5">
                    
                    {/* Indicador de pasos */}
                    <View className="flex-row items-center justify-center mb-6">
                        <View className="flex-row items-center">
                            <View className="w-8 h-8 rounded-full bg-red-500 items-center justify-center">
                                <Text className="text-white font-bold">1</Text>
                            </View>
                            <View className="w-16 h-1 bg-neutral-300 mx-2" />
                            <View className="w-8 h-8 rounded-full bg-neutral-300 items-center justify-center">
                                <Text className="text-neutral-500 font-bold">2</Text>
                            </View>
                        </View>
                    </View>

                    {/* ============ ZONA ============ */}
                    <View className="mb-6">
                        <Text className="text-lg font-bold text-neutral-900 mb-3">
                            <Text className="text-red-500">📍</Text> Zona Comercial
                        </Text>
                        <TouchableOpacity
                            onPress={() => setShowZoneModal(true)}
                            className="bg-white p-4 rounded-2xl border border-neutral-200 flex-row items-center shadow-sm"
                        >
                            <View className="w-12 h-12 rounded-xl bg-indigo-100 items-center justify-center mr-4">
                                <Ionicons name="map" size={24} color="#4F46E5" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-neutral-500 text-xs uppercase font-medium">Zona</Text>
                                <Text className={`font-bold text-base ${selectedZone ? 'text-neutral-900' : 'text-neutral-400'}`}>
                                    {selectedZone ? selectedZone.nombre : 'Seleccionar zona...'}
                                </Text>
                                {selectedZone && (
                                    <Text className="text-neutral-500 text-xs">{selectedZone.codigo} • {selectedZone.ciudad}</Text>
                                )}
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>

                    {/* ============ DESTINOS ============ */}
                    <View className="mb-6">
                        <View className="flex-row items-center justify-between mb-3">
                            <Text className="text-lg font-bold text-neutral-900">
                                <Text className="text-red-500">🏢</Text> Destinos
                            </Text>
                            {selectedDestinations.length > 0 && (
                                <View className="bg-blue-100 px-3 py-1 rounded-full">
                                    <Text className="text-blue-700 text-xs font-bold">{selectedDestinations.length} seleccionado(s)</Text>
                                </View>
                            )}
                        </View>
                        
                        {/* Chips de destinos seleccionados */}
                        {selectedDestinations.length > 0 && (
                            <View className="flex-row flex-wrap mb-3">
                                {selectedDestinations.map(dest => (
                                    <View key={dest.id} className="flex-row items-center bg-blue-100 rounded-full px-3 py-2 mr-2 mb-2">
                                        <Ionicons 
                                            name={dest.type === 'branch' ? 'storefront' : 'business'} 
                                            size={14} 
                                            color="#3B82F6" 
                                        />
                                        <Text className="text-blue-700 font-medium text-xs ml-2 max-w-28" numberOfLines={1}>
                                            {dest.name}
                                        </Text>
                                        <TouchableOpacity onPress={() => handleRemoveDestination(dest.id)} className="ml-2">
                                            <Ionicons name="close-circle" size={18} color="#3B82F6" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}

                        <TouchableOpacity
                            onPress={() => {
                                if (!selectedZone) {
                                    setFeedbackModal({
                                        visible: true,
                                        type: 'warning',
                                        title: 'Zona Requerida',
                                        message: 'Primero selecciona una zona comercial'
                                    })
                                    return
                                }
                                setShowDestinationModal(true)
                            }}
                            className={`bg-white p-4 rounded-2xl border flex-row items-center shadow-sm ${
                                selectedZone ? 'border-neutral-200' : 'border-dashed border-neutral-300 opacity-60'
                            }`}
                        >
                            <View className="w-12 h-12 rounded-xl bg-blue-100 items-center justify-center mr-4">
                                <Ionicons name="add-circle" size={24} color="#3B82F6" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-blue-600 font-bold text-base">Agregar destino(s)</Text>
                                <Text className="text-neutral-500 text-xs">
                                    Clientes o sucursales de la zona
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                        </TouchableOpacity>

                        {selectedZone && (
                            <Text className="text-neutral-400 text-xs mt-2 ml-1">
                                <Ionicons name="information-circle-outline" size={12} /> {filteredClients.length} cliente(s) en esta zona
                            </Text>
                        )}
                    </View>

                    {/* ============ MAPA PREVIEW ============ */}
                    {destinationsWithLocation.length > 0 && (
                        <View className="mb-6">
                            <View className="flex-row items-center justify-between mb-3">
                                <Text className="text-lg font-bold text-neutral-900">
                                    <Text className="text-red-500">🗺️</Text> Ubicaciones
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
                                className="h-48 rounded-2xl overflow-hidden border border-neutral-200"
                            >
                                <MapView
                                    provider={PROVIDER_GOOGLE}
                                    style={{ flex: 1 }}
                                    region={mapRegion}
                                    scrollEnabled={false}
                                    zoomEnabled={false}
                                >
                                    {destinationsWithLocation.map((dest, index) => (
                                        <Marker
                                            key={dest.id}
                                            coordinate={dest.location!}
                                            title={dest.name}
                                        >
                                            <View className="items-center">
                                                <View className="w-8 h-8 rounded-full bg-red-500 items-center justify-center">
                                                    <Text className="text-white font-bold text-sm">{index + 1}</Text>
                                                </View>
                                            </View>
                                        </Marker>
                                    ))}
                                </MapView>
                                <View className="absolute bottom-3 left-3 bg-white/90 px-3 py-2 rounded-lg">
                                    <Text className="text-neutral-700 text-xs font-medium">
                                        {destinationsWithLocation.length} ubicación(es)
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* ============ BOTÓN CONTINUAR ============ */}
                    <TouchableOpacity
                        onPress={handleContinue}
                        disabled={!selectedZone || selectedDestinations.length === 0}
                        className={`py-5 rounded-2xl items-center shadow-lg flex-row justify-center ${
                            selectedZone && selectedDestinations.length > 0
                                ? 'bg-red-500' 
                                : 'bg-neutral-300'
                        }`}
                    >
                        <Text className="text-white font-bold text-lg mr-2">Continuar</Text>
                        <Ionicons name="arrow-forward" size={20} color="white" />
                    </TouchableOpacity>

                    <View className="h-6" />
                </View>
            </ScrollView>

            {/* ============ MODAL: ZONA ============ */}
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
                                setSelectedDestinations([])
                                setShowZoneModal(false)
                            }}
                            className={`p-4 border-b border-neutral-100 flex-row items-center justify-between ${
                                selectedZone?.id === zone.id ? 'bg-indigo-50' : ''
                            }`}
                        >
                            <View className="flex-row items-center flex-1">
                                <View className="w-10 h-10 rounded-full bg-indigo-100 items-center justify-center mr-3">
                                    <Ionicons name="map" size={18} color="#4F46E5" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-neutral-900 font-semibold">{zone.nombre}</Text>
                                    <Text className="text-neutral-500 text-xs">{zone.codigo} • {zone.ciudad}</Text>
                                </View>
                            </View>
                            {selectedZone?.id === zone.id && (
                                <Ionicons name="checkmark-circle" size={24} color="#4F46E5" />
                            )}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </GenericModal>

            {/* ============ MODAL: DESTINOS ============ */}
            <GenericModal
                visible={showDestinationModal}
                title={`Destinos (${selectedDestinations.length})`}
                onClose={() => {
                    setShowDestinationModal(false)
                    setSearchQuery('')
                    setExpandedClientId(null)
                }}
            >
                <View>
                    {/* Buscador */}
                    <View className="flex-row items-center bg-neutral-100 rounded-xl px-4 py-3 mb-4">
                        <Ionicons name="search" size={20} color="#9CA3AF" />
                        <TextInput
                            className="flex-1 ml-3 text-neutral-900"
                            placeholder="Buscar cliente..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Info */}
                    <View className="bg-blue-50 p-3 rounded-xl mb-4">
                        <Text className="text-blue-800 text-xs">
                            💡 Toca un cliente para expandir. Puedes seleccionar sede principal o sucursales.
                        </Text>
                    </View>

                    {/* Chips seleccionados */}
                    {selectedDestinations.length > 0 && (
                        <View className="flex-row flex-wrap mb-3 p-2 bg-neutral-50 rounded-xl">
                            {selectedDestinations.slice(0, 4).map(dest => (
                                <View key={dest.id} className="flex-row items-center bg-green-100 rounded-full px-2 py-1 mr-1 mb-1">
                                    <Text className="text-green-700 text-xs font-medium" numberOfLines={1}>{dest.name.substring(0, 12)}</Text>
                                    <TouchableOpacity onPress={() => handleRemoveDestination(dest.id)} className="ml-1">
                                        <Ionicons name="close-circle" size={14} color="#22C55E" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                            {selectedDestinations.length > 4 && (
                                <View className="bg-neutral-200 rounded-full px-2 py-1 mb-1">
                                    <Text className="text-neutral-600 text-xs">+{selectedDestinations.length - 4}</Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Lista */}
                    <ScrollView className="max-h-64">
                        {searchedClients.length === 0 ? (
                            <View className="py-8 items-center">
                                <Ionicons name="business-outline" size={40} color="#9CA3AF" />
                                <Text className="text-neutral-500 mt-2">No hay clientes</Text>
                            </View>
                        ) : (
                            searchedClients.map(client => {
                                const isExpanded = expandedClientId === client.id
                                const branches = clientBranches.get(client.id) || []
                                const isLoadingBranches = loadingBranches === client.id
                                const clientName = client.nombre_comercial || client.razon_social
                                const clientLocation = parseLocation(client.ubicacion_gps)
                                const zoneId = Number(client.zona_comercial_id)

                                const isClientSelected = selectedDestinations.some(d => d.id === client.id)

                                return (
                                    <View key={client.id} className="mb-2">
                                        {/* Cliente */}
                                        <TouchableOpacity
                                            onPress={() => handleExpandClient(client.id)}
                                            className={`p-3 rounded-xl border ${isExpanded ? 'bg-blue-50 border-blue-200' : 'bg-white border-neutral-100'}`}
                                        >
                                            <View className="flex-row items-center justify-between">
                                                <View className="flex-row items-center flex-1">
                                                    <View className="w-9 h-9 rounded-full bg-blue-100 items-center justify-center mr-3">
                                                        <Text className="text-blue-600 font-bold text-sm">{clientName.charAt(0)}</Text>
                                                    </View>
                                                    <View className="flex-1">
                                                        <Text className="text-neutral-900 font-semibold text-sm" numberOfLines={1}>{clientName}</Text>
                                                        <Text className="text-neutral-500 text-xs">{client.identificacion}</Text>
                                                    </View>
                                                </View>
                                                <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color="#9CA3AF" />
                                            </View>
                                        </TouchableOpacity>

                                        {/* Opciones expandidas */}
                                        {isExpanded && (
                                            <View className="mt-2 ml-4 border-l-2 border-blue-200 pl-3">
                                                {/* Sede Principal */}
                                                <TouchableOpacity
                                                    onPress={() => handleAddDestination({
                                                        type: 'client',
                                                        id: client.id,
                                                        name: clientName,
                                                        address: client.direccion_texto || undefined,
                                                        location: clientLocation,
                                                        clientId: client.id,
                                                        clientName: clientName,
                                                        zoneId: zoneId
                                                    })}
                                                    disabled={isClientSelected}
                                                    className={`p-3 rounded-xl border mb-2 flex-row items-center ${
                                                        isClientSelected ? 'bg-green-50 border-green-300' : 'bg-white border-neutral-100'
                                                    }`}
                                                >
                                                    <View className={`w-7 h-7 rounded-full items-center justify-center mr-2 ${isClientSelected ? 'bg-green-200' : 'bg-green-100'}`}>
                                                        <Ionicons name={isClientSelected ? 'checkmark' : 'business'} size={14} color="#22C55E" />
                                                    </View>
                                                    <View className="flex-1">
                                                        <Text className="text-neutral-900 font-medium text-sm">📍 Sede Principal</Text>
                                                        <Text className="text-neutral-500 text-xs" numberOfLines={1}>{client.direccion_texto || 'Sin dirección'}</Text>
                                                    </View>
                                                    {isClientSelected ? (
                                                        <StatusBadge label="✓" variant="success" />
                                                    ) : (
                                                        <Ionicons name="add-circle" size={22} color="#22C55E" />
                                                    )}
                                                </TouchableOpacity>

                                                {/* Sucursales */}
                                                {isLoadingBranches ? (
                                                    <View className="py-3 items-center">
                                                        <ActivityIndicator size="small" color={BRAND_COLORS.red} />
                                                    </View>
                                                ) : branches.length > 0 ? (
                                                    branches.map(branch => {
                                                        const branchLocation = parseLocation(branch.ubicacion_gps)
                                                        const isBranchSelected = selectedDestinations.some(d => d.id === branch.id)
                                                        
                                                        return (
                                                            <TouchableOpacity
                                                                key={branch.id}
                                                                onPress={() => handleAddDestination({
                                                                    type: 'branch',
                                                                    id: branch.id,
                                                                    name: branch.nombre_sucursal,
                                                                    address: branch.direccion_entrega,
                                                                    location: branchLocation,
                                                                    clientId: client.id,
                                                                    clientName: clientName,
                                                                    zoneId: zoneId
                                                                })}
                                                                disabled={isBranchSelected}
                                                                className={`p-3 rounded-xl border mb-2 flex-row items-center ${
                                                                    isBranchSelected ? 'bg-orange-50 border-orange-300' : 'bg-white border-neutral-100'
                                                                }`}
                                                            >
                                                                <View className={`w-7 h-7 rounded-full items-center justify-center mr-2 ${isBranchSelected ? 'bg-orange-200' : 'bg-orange-100'}`}>
                                                                    <Ionicons name={isBranchSelected ? 'checkmark' : 'storefront'} size={14} color="#F59E0B" />
                                                                </View>
                                                                <View className="flex-1">
                                                                    <Text className="text-neutral-900 font-medium text-sm">🏪 {branch.nombre_sucursal}</Text>
                                                                    <Text className="text-neutral-500 text-xs" numberOfLines={1}>{branch.direccion_entrega || 'Sin dirección'}</Text>
                                                                </View>
                                                                {isBranchSelected ? (
                                                                    <StatusBadge label="✓" variant="warning" />
                                                                ) : (
                                                                    <Ionicons name="add-circle" size={22} color="#F59E0B" />
                                                                )}
                                                            </TouchableOpacity>
                                                        )
                                                    })
                                                ) : (
                                                    <Text className="text-neutral-400 text-xs italic py-2">Sin sucursales</Text>
                                                )}
                                            </View>
                                        )}
                                    </View>
                                )
                            })
                        )}
                    </ScrollView>

                    {/* Botón confirmar */}
                    {selectedDestinations.length > 0 && (
                        <TouchableOpacity
                            onPress={() => {
                                setShowDestinationModal(false)
                                setSearchQuery('')
                                setExpandedClientId(null)
                            }}
                            className="mt-4 bg-blue-500 py-4 rounded-2xl items-center"
                        >
                            <Text className="text-white font-bold">Confirmar ({selectedDestinations.length})</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </GenericModal>

            {/* ============ MODAL: MAPA FULLSCREEN ============ */}
            <Modal visible={showFullscreenMap} animationType="slide" onRequestClose={() => setShowFullscreenMap(false)}>
                <SafeAreaView className="flex-1 bg-white">
                    <View className="flex-row items-center justify-between px-4 py-3 border-b border-neutral-200">
                        <TouchableOpacity onPress={() => setShowFullscreenMap(false)}>
                            <Ionicons name="close" size={28} color="#525252" />
                        </TouchableOpacity>
                        <Text className="text-lg font-bold">Mapa ({destinationsWithLocation.length})</Text>
                        <View className="w-7" />
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
                                    <View className="w-10 h-10 rounded-full bg-red-500 items-center justify-center border-2 border-white">
                                        <Text className="text-white font-bold">{index + 1}</Text>
                                    </View>
                                </View>
                            </Marker>
                        ))}
                    </MapView>

                    {/* Lista de destinos */}
                    <View className="max-h-40 bg-white border-t border-neutral-200">
                        <ScrollView className="px-4">
                            {destinationsWithLocation.map((dest, index) => (
                                <View key={dest.id} className="flex-row items-center py-3 border-b border-neutral-100">
                                    <View className="w-7 h-7 rounded-full bg-red-500 items-center justify-center mr-3">
                                        <Text className="text-white font-bold text-xs">{index + 1}</Text>
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-neutral-900 font-medium text-sm" numberOfLines={1}>{dest.name}</Text>
                                        <Text className="text-neutral-500 text-xs">{dest.type === 'branch' ? 'Sucursal' : 'Sede principal'}</Text>
                                    </View>
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
            />
        </View>
    )
}

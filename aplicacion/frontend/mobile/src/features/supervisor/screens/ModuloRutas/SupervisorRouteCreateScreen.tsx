import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { 
    View, 
    Text, 
    ScrollView, 
    TouchableOpacity, 
    TextInput, 
    ActivityIndicator,
    Dimensions,
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

// ============ CONSTANTS ============
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

// ============ INTERFACES ============
interface RouteDestination {
    type: 'client' | 'branch'
    id: string
    name: string
    address?: string
    location?: { latitude: number; longitude: number }
    clientId: string
    clientName: string
    zoneId: number
}

type FrequencyType = 'SEMANAL' | 'QUINCENAL' | 'MENSUAL'
type PriorityType = 'ALTA' | 'MEDIA' | 'BAJA'

// ============ HELPER FUNCTIONS ============
const getPriorityColor = (priority: PriorityType): string => {
    const priorityItem = PRIORITIES.find(p => p.id === priority)
    return priorityItem?.color || BRAND_COLORS.red
}

const parseLocation = (ubicacionGps: { coordinates: number[] } | null | undefined) => {
    if (!ubicacionGps?.coordinates) return undefined
    return {
        latitude: ubicacionGps.coordinates[1],
        longitude: ubicacionGps.coordinates[0]
    }
}

// ============ COMPONENTS ============

// Chip para destino seleccionado
interface DestinationChipProps {
    destination: RouteDestination
    onRemove: () => void
}

const DestinationChip: React.FC<DestinationChipProps> = ({ destination, onRemove }) => (
    <View className="flex-row items-center bg-blue-100 rounded-full px-3 py-2 mr-2 mb-2">
        <Ionicons 
            name={destination.type === 'branch' ? 'storefront' : 'business'} 
            size={14} 
            color="#3B82F6" 
        />
        <Text className="text-blue-700 font-medium text-xs ml-2 max-w-32" numberOfLines={1}>
            {destination.name}
        </Text>
        <TouchableOpacity onPress={onRemove} className="ml-2">
            <Ionicons name="close-circle" size={18} color="#3B82F6" />
        </TouchableOpacity>
    </View>
)

// Botón de selección de día
interface DayButtonProps {
    day: typeof DAYS[number]
    isSelected: boolean
    hasConflict: boolean
    onPress: () => void
}

const DayButton: React.FC<DayButtonProps> = ({ day, isSelected, hasConflict, onPress }) => (
    <TouchableOpacity
        onPress={onPress}
        disabled={hasConflict}
        className={`flex-1 mx-1 py-4 rounded-2xl items-center border-2 ${
            hasConflict 
                ? 'bg-neutral-100 border-neutral-200 opacity-50'
                : isSelected 
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
        {isSelected && <Ionicons name="checkmark-circle" size={16} color="white" style={{ marginTop: 4 }} />}
        {hasConflict && <Ionicons name="lock-closed" size={14} color="#9CA3AF" style={{ marginTop: 4 }} />}
    </TouchableOpacity>
)

// Tarjeta de cliente expandible
interface ClientCardProps {
    client: Client
    isExpanded: boolean
    isLoadingBranches: boolean
    branches: ClientBranch[]
    selectedDestinations: RouteDestination[]
    onExpand: () => void
    onSelectDestination: (destination: RouteDestination) => void
}

const ClientCard: React.FC<ClientCardProps> = ({
    client,
    isExpanded,
    isLoadingBranches,
    branches,
    selectedDestinations,
    onExpand,
    onSelectDestination
}) => {
    const clientLocation = parseLocation(client.ubicacion_gps)
    const clientName = client.nombre_comercial || client.razon_social
    const zoneId = Number(client.zona_comercial_id)

    const isDestinationSelected = useCallback((destId: string) => {
        return selectedDestinations.some(d => d.id === destId)
    }, [selectedDestinations])

    const createClientDestination = (): RouteDestination => ({
        type: 'client',
        id: client.id,
        name: clientName,
        address: client.direccion_texto || undefined,
        location: clientLocation,
        clientId: client.id,
        clientName: clientName,
        zoneId: zoneId
    })

    const createBranchDestination = (branch: ClientBranch): RouteDestination => ({
        type: 'branch',
        id: branch.id,
        name: branch.nombre_sucursal,
        address: branch.direccion_entrega,
        location: parseLocation(branch.ubicacion_gps),
        clientId: client.id,
        clientName: clientName,
        zoneId: zoneId
    })

    return (
        <View className="mb-2">
            <TouchableOpacity
                onPress={onExpand}
                className={`p-4 rounded-2xl border ${
                    isExpanded ? 'bg-blue-50 border-blue-200' : 'bg-white border-neutral-100'
                }`}
            >
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                        <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                            <Text className="text-blue-600 font-bold">
                                {clientName.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-neutral-900 font-semibold" numberOfLines={1}>
                                {clientName}
                            </Text>
                            <Text className="text-neutral-500 text-xs">{client.identificacion}</Text>
                        </View>
                    </View>
                    <Ionicons 
                        name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                        size={20} 
                        color="#9CA3AF" 
                    />
                </View>
            </TouchableOpacity>

            {isExpanded && (
                <View className="mt-2 ml-4 border-l-2 border-blue-200 pl-4">
                    {/* Sede Principal */}
                    <TouchableOpacity
                        onPress={() => onSelectDestination(createClientDestination())}
                        disabled={isDestinationSelected(client.id)}
                        className={`p-3 rounded-xl border mb-2 flex-row items-center ${
                            isDestinationSelected(client.id) 
                                ? 'bg-green-50 border-green-300' 
                                : 'bg-white border-neutral-100'
                        }`}
                    >
                        <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
                            isDestinationSelected(client.id) ? 'bg-green-200' : 'bg-green-100'
                        }`}>
                            <Ionicons 
                                name={isDestinationSelected(client.id) ? 'checkmark' : 'business'} 
                                size={16} 
                                color="#22C55E" 
                            />
                        </View>
                        <View className="flex-1">
                            <Text className="text-neutral-900 font-medium">📍 Sede Principal</Text>
                            <Text className="text-neutral-500 text-xs" numberOfLines={1}>
                                {client.direccion_texto || 'Sin dirección'}
                            </Text>
                        </View>
                        {isDestinationSelected(client.id) ? (
                            <StatusBadge label="Agregado" variant="success" />
                        ) : (
                            <Ionicons name="add-circle" size={24} color="#22C55E" />
                        )}
                    </TouchableOpacity>

                    {/* Sucursales */}
                    {isLoadingBranches ? (
                        <View className="py-4 items-center">
                            <ActivityIndicator size="small" color={BRAND_COLORS.red} />
                            <Text className="text-neutral-400 text-xs mt-1">Cargando sucursales...</Text>
                        </View>
                    ) : branches.length > 0 ? (
                        branches.map(branch => (
                            <TouchableOpacity
                                key={branch.id}
                                onPress={() => onSelectDestination(createBranchDestination(branch))}
                                disabled={isDestinationSelected(branch.id)}
                                className={`p-3 rounded-xl border mb-2 flex-row items-center ${
                                    isDestinationSelected(branch.id) 
                                        ? 'bg-orange-50 border-orange-300' 
                                        : 'bg-white border-neutral-100'
                                }`}
                            >
                                <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
                                    isDestinationSelected(branch.id) ? 'bg-orange-200' : 'bg-orange-100'
                                }`}>
                                    <Ionicons 
                                        name={isDestinationSelected(branch.id) ? 'checkmark' : 'storefront'} 
                                        size={16} 
                                        color="#F59E0B" 
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-neutral-900 font-medium">🏪 {branch.nombre_sucursal}</Text>
                                    <Text className="text-neutral-500 text-xs" numberOfLines={1}>
                                        {branch.direccion_entrega || 'Sin dirección'}
                                    </Text>
                                </View>
                                {isDestinationSelected(branch.id) ? (
                                    <StatusBadge label="Agregado" variant="warning" />
                                ) : (
                                    <Ionicons name="add-circle" size={24} color="#F59E0B" />
                                )}
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View className="py-2 px-3">
                            <Text className="text-neutral-400 text-xs italic">Sin sucursales adicionales</Text>
                        </View>
                    )}
                </View>
            )}
        </View>
    )
}

// ============ MAIN COMPONENT ============
export function SupervisorRouteCreateScreen() {
    const navigation = useNavigation()
    
    // Data State
    const [zones, setZones] = useState<Zone[]>([])
    const [allClients, setAllClients] = useState<Client[]>([])
    const [existingRoutes, setExistingRoutes] = useState<RoutePlan[]>([])
    
    // Selection State - MULTI-SELECT
    const [selectedZone, setSelectedZone] = useState<Zone | null>(null)
    const [selectedDestinations, setSelectedDestinations] = useState<RouteDestination[]>([])
    const [selectedDays, setSelectedDays] = useState<number[]>([])
    const [frequency, setFrequency] = useState<FrequencyType>('SEMANAL')
    const [priority, setPriority] = useState<PriorityType>('MEDIA')
    const [timeEstimate, setTimeEstimate] = useState('')
    
    // UI State
    const [loading, setLoading] = useState(false)
    const [initializing, setInitializing] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [showZoneModal, setShowZoneModal] = useState(false)
    const [showDestinationModal, setShowDestinationModal] = useState(false)
    const [showFullscreenMap, setShowFullscreenMap] = useState(false)
    const [expandedClientId, setExpandedClientId] = useState<string | null>(null)
    const [clientBranches, setClientBranches] = useState<Map<string, ClientBranch[]>>(new Map())
    const [loadingBranches, setLoadingBranches] = useState<string | null>(null)
    
    // Feedback State
    const [feedbackModal, setFeedbackModal] = useState<{
        visible: boolean
        type: FeedbackType
        title: string
        message: string
        onConfirm?: () => void
    }>({
        visible: false,
        type: 'info',
        title: '',
        message: '',
    })

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
            showFeedback('error', 'Error', 'No se pudo cargar la información inicial')
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

        // Calcular centro de todos los puntos
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
    const showFeedback = useCallback((type: FeedbackType, title: string, message: string, onConfirm?: () => void) => {
        setFeedbackModal({ visible: true, type, title, message, onConfirm })
    }, [])

    const toggleDay = useCallback((dayId: number) => {
        setSelectedDays(prev => 
            prev.includes(dayId) 
                ? prev.filter(d => d !== dayId)
                : [...prev, dayId]
        )
    }, [])

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
            // Evitar duplicados
            if (prev.some(d => d.id === destination.id)) return prev
            return [...prev, destination]
        })
    }, [])

    const handleRemoveDestination = useCallback((destinationId: string) => {
        setSelectedDestinations(prev => prev.filter(d => d.id !== destinationId))
    }, [])

    const isDestinationInRoute = useCallback((clientId: string, dayId: number) => {
        return existingRoutes.some(r => 
            r.cliente_id === clientId && 
            r.dia_semana === dayId &&
            r.activo
        )
    }, [existingRoutes])

    const handleSave = async () => {
        if (!selectedZone || selectedDestinations.length === 0 || selectedDays.length === 0) {
            return showFeedback('warning', 'Datos incompletos', 'Selecciona zona, al menos un destino y un día.')
        }

        // Verificar conflictos
        const conflicts: string[] = []
        selectedDestinations.forEach(dest => {
            selectedDays.forEach(day => {
                if (isDestinationInRoute(dest.clientId, day)) {
                    const dayLabel = DAYS.find(d => d.id === day)?.label || ''
                    conflicts.push(`${dest.name} - ${dayLabel}`)
                }
            })
        })

        if (conflicts.length > 0) {
            return showFeedback(
                'warning', 
                'Ya existen rutas', 
                `Los siguientes destinos ya tienen ruta:\n${conflicts.slice(0, 3).join('\n')}${conflicts.length > 3 ? `\n... y ${conflicts.length - 3} más` : ''}`
            )
        }

        setLoading(true)
        try {
            const promises: Promise<any>[] = []
            
            selectedDestinations.forEach((dest, index) => {
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
            
            const totalRoutes = selectedDestinations.length * selectedDays.length
            showFeedback(
                'success', 
                '¡Rutas Creadas!', 
                `Se crearon ${totalRoutes} ruta(s) para ${selectedDestinations.length} destino(s) en ${selectedDays.length} día(s).`,
                () => navigation.goBack()
            )
        } catch (error: any) {
            console.error('Error creating routes:', error)
            showFeedback('error', 'Error', error.message || 'No se pudieron crear las rutas')
        } finally {
            setLoading(false)
        }
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

    const priorityInfo = PRIORITIES.find(p => p.id === priority)
    const priorityColor = priorityInfo?.color || BRAND_COLORS.red

    return (
        <View className="flex-1 bg-neutral-50">
            <Header 
                title="Nueva Ruta" 
                variant="standard" 
                onBackPress={() => navigation.goBack()} 
            />

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="p-5">
                    
                    {/* ============ SECCIÓN 1: ZONA ============ */}
                    <SectionTitle number="1" title="Zona Comercial" />
                    <TouchableOpacity
                        onPress={() => setShowZoneModal(true)}
                        className="bg-white p-4 rounded-2xl border border-neutral-200 flex-row items-center shadow-sm mb-6"
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

                    {/* ============ SECCIÓN 2: DESTINOS (MULTI-SELECT) ============ */}
                    <SectionTitle 
                        number="2" 
                        title="Destinos de Visita" 
                        badge={selectedDestinations.length > 0 ? `${selectedDestinations.length} seleccionado(s)` : undefined}
                    />
                    
                    {/* Destinos seleccionados como chips */}
                    {selectedDestinations.length > 0 && (
                        <View className="flex-row flex-wrap mb-3">
                            {selectedDestinations.map(dest => (
                                <DestinationChip 
                                    key={dest.id}
                                    destination={dest}
                                    onRemove={() => handleRemoveDestination(dest.id)}
                                />
                            ))}
                        </View>
                    )}

                    <TouchableOpacity
                        onPress={() => {
                            if (!selectedZone) {
                                showFeedback('warning', 'Zona Requerida', 'Primero selecciona una zona comercial')
                                return
                            }
                            setShowDestinationModal(true)
                        }}
                        className={`bg-white p-4 rounded-2xl border flex-row items-center shadow-sm mb-2 ${
                            selectedZone ? 'border-neutral-200' : 'border-dashed border-neutral-300 opacity-60'
                        }`}
                    >
                        <View className="w-12 h-12 rounded-xl bg-blue-100 items-center justify-center mr-4">
                            <Ionicons name="add-circle" size={24} color="#3B82F6" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-blue-600 font-bold text-base">
                                Agregar destino(s)
                            </Text>
                            <Text className="text-neutral-500 text-xs">
                                Puedes seleccionar varios clientes o sucursales
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </TouchableOpacity>

                    {selectedZone && (
                        <View className="flex-row items-center mb-6">
                            <Ionicons name="information-circle-outline" size={14} color="#9CA3AF" />
                            <Text className="text-neutral-400 text-xs ml-1">
                                {filteredClients.length} cliente(s) disponibles en esta zona
                            </Text>
                        </View>
                    )}

                    {/* ============ SECCIÓN 3: MAPA DE UBICACIONES ============ */}
                    {destinationsWithLocation.length > 0 && (
                        <View className="mb-6">
                            <View className="flex-row items-center justify-between mb-3">
                                <Text className="text-lg font-bold text-neutral-900">
                                    <Text className="text-red-500">📍</Text> Ubicaciones ({destinationsWithLocation.length})
                                </Text>
                                <TouchableOpacity 
                                    onPress={() => setShowFullscreenMap(true)}
                                    className="flex-row items-center bg-neutral-100 px-3 py-2 rounded-xl"
                                >
                                    <Ionicons name="expand" size={16} color="#525252" />
                                    <Text className="text-neutral-700 font-medium text-xs ml-1">Ampliar</Text>
                                </TouchableOpacity>
                            </View>
                            
                            <View className="h-52 rounded-2xl overflow-hidden border border-neutral-200 shadow-sm">
                                <MapView
                                    provider={PROVIDER_GOOGLE}
                                    style={{ flex: 1 }}
                                    region={mapRegion}
                                    scrollEnabled={false}
                                    zoomEnabled={false}
                                    onPress={() => setShowFullscreenMap(true)}
                                >
                                    {destinationsWithLocation.map((dest, index) => (
                                        <Marker
                                            key={dest.id}
                                            coordinate={dest.location!}
                                            title={dest.name}
                                            description={dest.address}
                                        >
                                            <View className="items-center">
                                                <View 
                                                    className="w-10 h-10 rounded-full items-center justify-center shadow-lg"
                                                    style={{ backgroundColor: priorityColor }}
                                                >
                                                    <Text className="text-white font-bold text-sm">{index + 1}</Text>
                                                </View>
                                                <View 
                                                    className="w-0 h-0 border-l-8 border-r-8 border-t-8"
                                                    style={{ 
                                                        borderLeftColor: 'transparent',
                                                        borderRightColor: 'transparent',
                                                        borderTopColor: priorityColor,
                                                        marginTop: -2
                                                    }}
                                                />
                                            </View>
                                        </Marker>
                                    ))}
                                </MapView>
                                
                                {/* Leyenda de prioridad */}
                                <View className="absolute bottom-3 left-3 bg-white/90 px-3 py-2 rounded-lg flex-row items-center">
                                    <View 
                                        className="w-4 h-4 rounded-full mr-2"
                                        style={{ backgroundColor: priorityColor }}
                                    />
                                    <Text className="text-neutral-700 text-xs font-medium">
                                        Prioridad {priority}
                                    </Text>
                                </View>

                                {/* Botón expandir */}
                                <TouchableOpacity 
                                    onPress={() => setShowFullscreenMap(true)}
                                    className="absolute top-3 right-3 bg-white/90 p-2 rounded-lg shadow"
                                >
                                    <Ionicons name="expand" size={20} color="#525252" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* ============ SECCIÓN 4: DÍAS DE VISITA ============ */}
                    <SectionTitle number="3" title="Días de Visita" />
                    <View className="flex-row justify-between mb-2">
                        {DAYS.map(day => (
                            <DayButton
                                key={day.id}
                                day={day}
                                isSelected={selectedDays.includes(day.id)}
                                hasConflict={false}
                                onPress={() => toggleDay(day.id)}
                            />
                        ))}
                    </View>
                    {selectedDays.length > 0 && (
                        <Text className="text-green-600 text-xs mt-2 text-center font-medium mb-6">
                            ✓ {selectedDays.length} día(s) seleccionado(s)
                        </Text>
                    )}
                    {selectedDays.length === 0 && <View className="mb-6" />}

                    {/* ============ SECCIÓN 5: FRECUENCIA ============ */}
                    <SectionTitle number="4" title="Frecuencia" />
                    <View className="flex-row gap-3 mb-6">
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

                    {/* ============ SECCIÓN 6: PRIORIDAD ============ */}
                    <SectionTitle number="5" title="Prioridad de Visita" />
                    <View className="flex-row gap-3 mb-6">
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

                    {/* ============ SECCIÓN 7: HORA ESTIMADA ============ */}
                    <SectionTitle number="6" title="Hora Estimada" optional />
                    <View className="bg-white p-4 rounded-2xl border border-neutral-200 flex-row items-center mb-6">
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

                    {/* ============ RESUMEN ============ */}
                    {selectedDestinations.length > 0 && selectedDays.length > 0 && (
                        <View className="bg-neutral-900 p-5 rounded-2xl mb-6">
                            <Text className="text-white font-bold text-lg mb-3">📋 Resumen</Text>
                            <View className="space-y-2">
                                <SummaryRow 
                                    label="Destinos" 
                                    value={`${selectedDestinations.length} seleccionado(s)`} 
                                />
                                <SummaryRow 
                                    label="Zona" 
                                    value={selectedZone?.nombre || '-'} 
                                />
                                <SummaryRow 
                                    label="Días" 
                                    value={selectedDays.map(d => DAYS.find(day => day.id === d)?.label).join(', ')} 
                                />
                                <SummaryRow 
                                    label="Frecuencia" 
                                    value={frequency} 
                                />
                                <SummaryRow 
                                    label="Prioridad" 
                                    value={priority}
                                    valueColor={priorityColor}
                                />
                                <View className="border-t border-neutral-700 pt-2 mt-2">
                                    <Text className="text-neutral-300 text-xs">
                                        Total: {selectedDestinations.length * selectedDays.length} ruta(s) a crear
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* ============ BOTÓN GUARDAR ============ */}
                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={loading || selectedDestinations.length === 0 || selectedDays.length === 0}
                        className={`py-5 rounded-2xl items-center shadow-lg ${
                            selectedDestinations.length > 0 && selectedDays.length > 0 && !loading
                                ? 'bg-red-500' 
                                : 'bg-neutral-300'
                        }`}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <View className="flex-row items-center">
                                <Ionicons name="save" size={20} color="white" />
                                <Text className="text-white font-bold text-lg ml-2">
                                    Guardar {selectedDestinations.length > 0 ? `(${selectedDestinations.length * selectedDays.length})` : ''} Ruta(s)
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <View className="h-10" />
                </View>
            </ScrollView>

            {/* ============ MODAL: SELECCIÓN DE ZONA ============ */}
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

            {/* ============ MODAL: SELECCIÓN DE DESTINOS (MULTI) ============ */}
            <GenericModal
                visible={showDestinationModal}
                title={`Agregar Destinos (${selectedDestinations.length})`}
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
                            💡 Toca un cliente para expandirlo. Puedes seleccionar múltiples destinos (sede principal o sucursales).
                        </Text>
                    </View>

                    {/* Destinos seleccionados */}
                    {selectedDestinations.length > 0 && (
                        <View className="flex-row flex-wrap mb-3 p-2 bg-neutral-50 rounded-xl">
                            {selectedDestinations.slice(0, 5).map(dest => (
                                <DestinationChip 
                                    key={dest.id}
                                    destination={dest}
                                    onRemove={() => handleRemoveDestination(dest.id)}
                                />
                            ))}
                            {selectedDestinations.length > 5 && (
                                <View className="bg-neutral-200 rounded-full px-3 py-2 mb-2">
                                    <Text className="text-neutral-600 text-xs font-medium">
                                        +{selectedDestinations.length - 5} más
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Lista de Clientes */}
                    <ScrollView className="max-h-72">
                        {searchedClients.length === 0 ? (
                            <View className="py-8 items-center">
                                <Ionicons name="business-outline" size={40} color="#9CA3AF" />
                                <Text className="text-neutral-500 mt-2 text-center">
                                    {filteredClients.length === 0 
                                        ? 'No hay clientes en esta zona'
                                        : 'No se encontraron resultados'
                                    }
                                </Text>
                            </View>
                        ) : (
                            searchedClients.map(client => (
                                <ClientCard
                                    key={client.id}
                                    client={client}
                                    isExpanded={expandedClientId === client.id}
                                    isLoadingBranches={loadingBranches === client.id}
                                    branches={clientBranches.get(client.id) || []}
                                    selectedDestinations={selectedDestinations}
                                    onExpand={() => handleExpandClient(client.id)}
                                    onSelectDestination={handleAddDestination}
                                />
                            ))
                        )}
                    </ScrollView>

                    {/* Botón de confirmar */}
                    {selectedDestinations.length > 0 && (
                        <TouchableOpacity
                            onPress={() => {
                                setShowDestinationModal(false)
                                setSearchQuery('')
                                setExpandedClientId(null)
                            }}
                            className="mt-4 bg-blue-500 py-4 rounded-2xl items-center"
                        >
                            <Text className="text-white font-bold text-base">
                                Confirmar {selectedDestinations.length} destino(s)
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </GenericModal>

            {/* ============ MODAL: MAPA FULLSCREEN ============ */}
            <Modal
                visible={showFullscreenMap}
                animationType="slide"
                onRequestClose={() => setShowFullscreenMap(false)}
            >
                <SafeAreaView className="flex-1 bg-white">
                    {/* Header del mapa fullscreen */}
                    <View className="flex-row items-center justify-between px-4 py-3 border-b border-neutral-200">
                        <TouchableOpacity onPress={() => setShowFullscreenMap(false)}>
                            <Ionicons name="close" size={28} color="#525252" />
                        </TouchableOpacity>
                        <Text className="text-lg font-bold text-neutral-900">
                            Mapa de Rutas ({destinationsWithLocation.length})
                        </Text>
                        <View className="w-7" />
                    </View>

                    {/* Mapa */}
                    <MapView
                        provider={PROVIDER_GOOGLE}
                        style={{ flex: 1 }}
                        initialRegion={mapRegion}
                        showsUserLocation
                        showsMyLocationButton
                    >
                        {destinationsWithLocation.map((dest, index) => (
                            <Marker
                                key={dest.id}
                                coordinate={dest.location!}
                                title={`${index + 1}. ${dest.name}`}
                                description={dest.address}
                            >
                                <View className="items-center">
                                    <View 
                                        className="w-12 h-12 rounded-full items-center justify-center shadow-lg border-2 border-white"
                                        style={{ backgroundColor: priorityColor }}
                                    >
                                        <Text className="text-white font-bold text-lg">{index + 1}</Text>
                                    </View>
                                    <View 
                                        className="w-0 h-0 border-l-8 border-r-8 border-t-8"
                                        style={{ 
                                            borderLeftColor: 'transparent',
                                            borderRightColor: 'transparent',
                                            borderTopColor: priorityColor,
                                            marginTop: -2
                                        }}
                                    />
                                </View>
                            </Marker>
                        ))}
                    </MapView>

                    {/* Lista de destinos */}
                    <View className="bg-white border-t border-neutral-200 max-h-48">
                        <View className="px-4 py-2 bg-neutral-50 flex-row items-center justify-between">
                            <Text className="text-neutral-700 font-bold text-sm">Destinos en la ruta</Text>
                            <StatusBadge 
                                label={`Prioridad ${priority}`} 
                                variant={priority === 'ALTA' ? 'error' : priority === 'MEDIA' ? 'warning' : 'success'} 
                            />
                        </View>
                        <ScrollView className="px-4">
                            {destinationsWithLocation.map((dest, index) => (
                                <View 
                                    key={dest.id}
                                    className="flex-row items-center py-3 border-b border-neutral-100"
                                >
                                    <View 
                                        className="w-8 h-8 rounded-full items-center justify-center mr-3"
                                        style={{ backgroundColor: priorityColor }}
                                    >
                                        <Text className="text-white font-bold text-sm">{index + 1}</Text>
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-neutral-900 font-medium" numberOfLines={1}>
                                            {dest.name}
                                        </Text>
                                        <Text className="text-neutral-500 text-xs" numberOfLines={1}>
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

            {/* Feedback Modal */}
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

// ============ HELPER COMPONENTS ============
interface SectionTitleProps {
    number: string
    title: string
    optional?: boolean
    badge?: string
}

const SectionTitle: React.FC<SectionTitleProps> = ({ number, title, optional, badge }) => (
    <View className="flex-row items-center justify-between mb-3">
        <Text className="text-lg font-bold text-neutral-900">
            <Text className="text-red-500">{number}.</Text> {title}
            {optional && <Text className="text-neutral-400 font-normal text-sm"> (Opcional)</Text>}
        </Text>
        {badge && (
            <View className="bg-blue-100 px-2 py-1 rounded-full">
                <Text className="text-blue-700 text-xs font-medium">{badge}</Text>
            </View>
        )}
    </View>
)

interface SummaryRowProps {
    label: string
    value: string
    valueColor?: string
}

const SummaryRow: React.FC<SummaryRowProps> = ({ label, value, valueColor }) => (
    <View className="flex-row mt-2">
        <Text className="text-neutral-400 w-24">{label}:</Text>
        <Text 
            className="font-medium flex-1" 
            style={{ color: valueColor || 'white' }}
        >
            {value}
        </Text>
    </View>
)

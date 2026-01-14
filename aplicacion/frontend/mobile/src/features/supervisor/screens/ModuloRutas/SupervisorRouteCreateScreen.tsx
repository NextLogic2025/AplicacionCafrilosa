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
import MapView, { Marker, Polygon, PROVIDER_GOOGLE, Region } from 'react-native-maps'
import { Header } from '../../../../components/ui/Header'
import { GenericModal } from '../../../../components/ui/GenericModal'
import { FeedbackModal, FeedbackType } from '../../../../components/ui/FeedbackModal'
import { StatusBadge } from '../../../../components/ui/StatusBadge'
import { BRAND_COLORS } from '../../../../shared/types'
import { ZoneService, Zone, ZoneHelpers, LatLng } from '../../../../services/api/ZoneService'
import { ClientService, Client, ClientBranch } from '../../../../services/api/ClientService'
import { ClientMultiSelector } from '../../components/ClientMultiSelector'
import { optimizeRouteOrder, OptimizableLocation, OptimizationConfig } from '../../utils/routeOptimizer'
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
    zoneName?: string  // Nombre de la zona para mostrar en UI
    suggested_time?: string
    priority?: string
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
    const [zonePolygon, setZonePolygon] = useState<LatLng[]>([])

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
    const [isListExpanded, setIsListExpanded] = useState(false) // Nuevo estado para colapsar la lista
    const [allBranchesLoaded, setAllBranchesLoaded] = useState(false)
    const [isMultiSelectVisible, setMultiSelectVisible] = useState(false)
    const [isBulkOptimized, setIsBulkOptimized] = useState(false) // Nuevo estado para saber si viene de optimización

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

    // Actualizar polígono cuando cambia la zona
    useEffect(() => {
        if (selectedZone?.poligono_geografico) {
            console.log('[RouteCreate] Parseando polígono de zona:', selectedZone.nombre)
            const polygon = ZoneHelpers.parsePolygon(selectedZone.poligono_geografico)
            console.log('[RouteCreate] Polígono con', polygon.length, 'puntos')
            setZonePolygon(polygon)
        } else {
            console.log('[RouteCreate] Zona sin polígono:', selectedZone?.nombre)
            setZonePolygon([])
        }
    }, [selectedZone])

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

            // Precargar sucursales de todos los clientes para filtrar por zona
            const branchesMap = new Map<string, ClientBranch[]>()
            await Promise.all(
                clientsData.slice(0, 50).map(async (client) => { // Limitar a 50 para rendimiento
                    try {
                        const branches = await ClientService.getClientBranches(client.id)
                        branchesMap.set(client.id, branches)
                    } catch (e) {
                        branchesMap.set(client.id, [])
                    }
                })
            )
            setClientBranches(branchesMap)
            setAllBranchesLoaded(true)
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
    // NUEVA LÓGICA: Mostrar clientes cuya MATRIZ o SUCURSALES estén en la zona seleccionada
    const filteredClients = useMemo(() => {
        if (!selectedZone) return []
        const selectedZoneId = Number(selectedZone.id)

        return allClients.filter(client => {
            if (client.bloqueado) return false

            // 1. ¿La matriz está en esta zona?
            const isMatrizInZone = Number(client.zona_comercial_id) === selectedZoneId

            // 2. ¿Tiene alguna sucursal en esta zona?
            const branches = clientBranches.get(client.id) || []
            const hasBranchInZone = branches.some(
                branch => Number(branch.zona_id) === selectedZoneId
            )

            // Mostrar cliente si la matriz O alguna sucursal está en la zona
            return isMatrizInZone || hasBranchInZone
        })
    }, [allClients, selectedZone, clientBranches])

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



    const availableForBulk: OptimizableLocation[] = useMemo(() => {
        if (!selectedZone) return []
        const selectedZoneId = Number(selectedZone.id)

        // 1. Matriz Clientes
        const clientItems: OptimizableLocation[] = allClients
            .filter(c => !c.bloqueado && Number(c.zona_comercial_id) === selectedZoneId)
            .map(c => ({
                id: c.id,
                name: c.nombre_comercial || c.razon_social,
                type: 'MATRIZ' as const,
                location: c.ubicacion_gps ? {
                    latitude: c.ubicacion_gps.coordinates[1],
                    longitude: c.ubicacion_gps.coordinates[0]
                } : { latitude: 0, longitude: 0 },
                // priority: c.prioridad // Si existiera en el tipo Client
                address: c.direccion_texto || '',
                zoneName: selectedZone.nombre,
                originalObj: c
            }))
            .filter(i => i.location.latitude !== 0)

        // 2. Sucursales
        const branchItems: OptimizableLocation[] = []
        clientBranches.forEach((branches, clientId) => {
            const client = allClients.find(c => c.id === clientId)
            if (!client || client.bloqueado) return

            branches.forEach(b => {
                if (Number(b.zona_id) === selectedZoneId && b.activo && b.ubicacion_gps) {
                    branchItems.push({
                        id: b.id,
                        name: b.nombre_sucursal,
                        type: 'SUCURSAL' as const,
                        location: {
                            latitude: b.ubicacion_gps.coordinates[1],
                            longitude: b.ubicacion_gps.coordinates[0]
                        },
                        address: b.direccion_entrega,
                        zoneName: selectedZone.nombre,
                        originalObj: { ...b, clientName: client.nombre_comercial || client.razon_social }
                    })
                }
            })
        })

        return [...clientItems, ...branchItems]
    }, [allClients, clientBranches, selectedZone])

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

    const handleBulkImport = (
        selected: OptimizableLocation[],
        config: OptimizationConfig,
        constraints: Map<string, string>
    ) => {
        // 1. Ejecutar el algoritmo de optimización
        const optimizedList = optimizeRouteOrder(selected, config, constraints)

        console.log("Ruta Optimizada:", optimizedList.length, "paradas")

        // 2. Convertir optimizedList al formato RouteDestination
        const newDestinations: RouteDestination[] = optimizedList.map((optItem) => {
            let item: RouteDestination;

            if (optItem.type === 'MATRIZ') {
                const client = optItem.originalObj
                item = {
                    type: 'client',
                    id: client.id,
                    name: optItem.name,
                    address: optItem.address,
                    location: optItem.location,
                    clientId: client.id,
                    clientName: optItem.name,
                    zoneId: Number(client.zona_comercial_id),
                    zoneName: optItem.zoneName,
                    suggested_time: optItem.suggested_time,
                    hora_estimada_arribo: optItem.suggested_time, // Mapeo explicito para tarjeta
                    priority: optItem.priority
                }
            } else {
                // SUCURSAL
                const branch = optItem.originalObj
                item = {
                    type: 'branch',
                    id: branch.id,
                    name: optItem.name,
                    address: optItem.address,
                    location: optItem.location,
                    clientId: branch.cliente_id,
                    clientName: branch.clientName,
                    zoneId: Number(branch.zona_id),
                    zoneName: optItem.zoneName,
                    suggested_time: optItem.suggested_time,
                    hora_estimada_arribo: optItem.suggested_time, // Mapeo explicito para tarjeta
                    priority: optItem.priority
                }
            }
            return item
        })

        setSelectedDestinations(newDestinations)
        setIsBulkOptimized(true) // Marcar como optimizado

        // Contar no agendados
        const unscheduledCount = optimizedList.filter(i => i.is_unscheduled).length;

        setFeedbackModal({
            visible: true,
            type: unscheduledCount > 0 ? 'warning' : 'success',
            title: 'Ruta Inteligente Generada',
            message: `Optimización completada. ${newDestinations.length} destinos agendados.${unscheduledCount > 0 ? `\n⚠️ ${unscheduledCount} destinos marcados como "NO AGENDADO" por falta de tiempo.` : ''}`
        })
    }

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
                title="Nueva Ruta"
                variant="standard"
                onBackPress={() => navigation.reset({
                    index: 0,
                    routes: [{ name: 'SupervisorRoutes' }]
                })}
            />

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="p-5">

                    {/* Indicador de pasos con descripción */}
                    <View className="bg-white rounded-2xl p-4 mb-6 border border-neutral-100">
                        <View className="flex-row items-center justify-center mb-3">
                            <View className="items-center">
                                <View className="w-10 h-10 rounded-full bg-red-500 items-center justify-center">
                                    <Text className="text-white font-bold">1</Text>
                                </View>
                                <Text className="text-red-600 text-xs font-medium mt-1">Zona</Text>
                            </View>
                            <View className="w-12 h-1 bg-neutral-200 mx-3" />
                            <View className="items-center">
                                <View className="w-10 h-10 rounded-full bg-neutral-200 items-center justify-center">
                                    <Text className="text-neutral-500 font-bold">2</Text>
                                </View>
                                <Text className="text-neutral-400 text-xs font-medium mt-1">Horario</Text>
                            </View>
                        </View>
                        <Text className="text-center text-neutral-600 text-sm">
                            Selecciona la zona y los clientes/sucursales a visitar
                        </Text>
                    </View>

                    {/* ============ ZONA ============ */}
                    <View className="mb-6">
                        <View className="flex-row items-center justify-between mb-2">
                            <Text className="text-lg font-bold text-neutral-900">
                                <Text className="text-red-500">📍</Text> Zona Comercial
                            </Text>
                            <Text className="text-neutral-400 text-xs">Paso 1 de 2</Text>
                        </View>
                        <Text className="text-neutral-500 text-sm mb-3">
                            Los clientes se filtran automáticamente por zona
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

                        {/* LISTA DE DESTINOS (Vertical + Colapsable) O UPDATE: SUMMARY CARD */}
                        {selectedDestinations.length > 0 && (
                            <View className="mb-3">
                                {isBulkOptimized ? (
                                    // === SUMMARY CARD PARA OPTIMIZACIÓN MASIVA ===
                                    <View className="bg-green-50 border border-green-200 rounded-xl p-4 flex-row items-center justify-between">
                                        <View className="flex-row items-center flex-1">
                                            <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center mr-3">
                                                <Ionicons name="checkmark-circle" size={24} color="#16A34A" />
                                            </View>
                                            <View>
                                                <Text className="text-green-800 font-bold text-base">
                                                    {selectedDestinations.length} Destinos Optimizados
                                                </Text>
                                                {selectedDestinations.length > 0 && (
                                                    <Text className="text-green-600 text-xs mt-0.5">
                                                        Horario: {selectedDestinations[0]?.suggested_time || '??'} - {selectedDestinations[selectedDestinations.length - 1]?.suggested_time || '??'}
                                                    </Text>
                                                )}
                                            </View>
                                        </View>

                                        <TouchableOpacity
                                            onPress={() => setMultiSelectVisible(true)}
                                            className="bg-white border border-green-200 px-3 py-1.5 rounded-lg shadow-sm"
                                        >
                                            <Text className="text-green-700 text-xs font-bold">Ver / Editar</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    // === LISTA NORMAL (Para selección manual) ===
                                    <View>
                                        {selectedDestinations
                                            .slice(0, isListExpanded ? undefined : 5)
                                            .map((dest, index) => {
                                                const isOtherZone = dest.zoneId !== selectedZone?.id
                                                return (
                                                    <View
                                                        key={dest.id}
                                                        className="flex-row items-center bg-white p-3 rounded-xl border border-neutral-100 mb-2 shadow-sm"
                                                    >
                                                        {/* Secuencia */}
                                                        <View className="w-6 h-6 rounded-full bg-neutral-100 items-center justify-center mr-3">
                                                            <Text className="text-neutral-500 font-bold text-xs">{index + 1}</Text>
                                                        </View>

                                                        {/* Icono Tipo */}
                                                        <View className={`p-2 rounded-full mr-3 ${dest.type === 'branch' ? 'bg-orange-100' : 'bg-blue-100'}`}>
                                                            <Ionicons
                                                                name={dest.type === 'branch' ? 'storefront' : 'business'}
                                                                size={16}
                                                                color={dest.type === 'branch' ? '#EA580C' : '#2563EB'}
                                                            />
                                                        </View>

                                                        {/* Info Principal */}
                                                        <View className="flex-1 mr-2">
                                                            <View className="flex-row items-center">
                                                                <Text className="font-bold text-neutral-800 text-sm flex-1" numberOfLines={1}>
                                                                    {dest.name}
                                                                </Text>
                                                                {dest.priority === 'ALTA' && <Ionicons name="flag" size={14} color="#EF4444" style={{ marginLeft: 4 }} />}
                                                                {dest.priority === 'BAJA' && <Ionicons name="flag" size={14} color="#10B981" style={{ marginLeft: 4 }} />}
                                                            </View>

                                                            <Text className="text-neutral-400 text-xs" numberOfLines={1}>
                                                                {dest.address || 'Sin dirección'}
                                                            </Text>

                                                            {isOtherZone && (
                                                                <Text className="text-purple-500 text-[10px] mt-0.5">⚠️ Zona: {dest.zoneName}</Text>
                                                            )}
                                                        </View>

                                                        {/* Hora / Acción */}
                                                        <View className="items-end">
                                                            <TouchableOpacity onPress={() => handleRemoveDestination(dest.id)} className="mt-2 text-red-500">
                                                                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                                            </TouchableOpacity>
                                                        </View>
                                                    </View>
                                                )
                                            })}

                                        {/* Botón Ver Más / Ver Menos */}
                                        {selectedDestinations.length > 5 && (
                                            <TouchableOpacity
                                                onPress={() => setIsListExpanded(!isListExpanded)}
                                                className="py-2 items-center bg-neutral-100 rounded-xl mt-1 border border-neutral-200 border-dashed"
                                            >
                                                <Text className="text-neutral-500 font-medium text-xs">
                                                    {isListExpanded
                                                        ? 'Ver menos destinos'
                                                        : `Ver ${selectedDestinations.length - 5} destinos más...`}
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                )}
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
                            className={`bg-white p-4 rounded-2xl border flex-row items-center shadow-sm ${selectedZone ? 'border-neutral-200' : 'border-dashed border-neutral-300 opacity-60'
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

                        {/* Botón de Carga Masiva Inteligente */}
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
                                setMultiSelectVisible(true)
                            }}
                            className={`flex-row items-center bg-[#FFF5D9] border border-[#F0412D] p-4 rounded-xl mt-3 ${selectedZone ? '' : 'opacity-60'
                                }`}
                        >
                            <View className="bg-[#F0412D] p-2 rounded-full mr-3">
                                <Ionicons name="flash" size={20} color="white" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-[#F0412D] font-bold text-base">
                                    Optimización Masiva
                                </Text>
                                <Text className="text-xs text-neutral-600 mt-1">
                                    Selecciona múltiples locales y crea la ruta más rápida automáticamente.
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#F0412D" />
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
                                    {/* Polígono de zona */}
                                    {zonePolygon.length >= 3 && (
                                        <Polygon
                                            coordinates={zonePolygon}
                                            fillColor="rgba(79, 70, 229, 0.2)"
                                            strokeColor="#4F46E5"
                                            strokeWidth={2}
                                        />
                                    )}

                                    {/* Marcadores de destinos */}
                                    {destinationsWithLocation.map((dest, index) => (
                                        <Marker
                                            key={dest.id}
                                            coordinate={dest.location!}
                                            title={dest.name}
                                        >
                                            <View className="items-center">
                                                <View className="w-8 h-8 rounded-full bg-red-500 items-center justify-center border-2 border-white">
                                                    <Text className="text-white font-bold text-sm">{index + 1}</Text>
                                                </View>
                                            </View>
                                        </Marker>
                                    ))}
                                </MapView>

                                {/* Indicadores del mapa */}
                                <View className="absolute top-2 left-2 right-2 flex-row justify-between">
                                    {selectedZone && (
                                        <View className="bg-indigo-600/90 px-3 py-1 rounded-full flex-row items-center">
                                            <Ionicons name="map" size={12} color="white" />
                                            <Text className="text-white text-xs font-medium ml-1">{selectedZone.nombre}</Text>
                                        </View>
                                    )}
                                    <View className={`px-3 py-1 rounded-full ${zonePolygon.length >= 3 ? 'bg-green-600/90' : 'bg-amber-500/90'}`}>
                                        <Text className="text-white text-xs font-medium">
                                            {zonePolygon.length >= 3 ? '✓ Área' : 'Sin área'}
                                        </Text>
                                    </View>
                                </View>

                                <View className="absolute bottom-3 left-3 bg-white/95 px-3 py-2 rounded-lg shadow">
                                    <Text className="text-neutral-700 text-xs font-medium">
                                        📍 {destinationsWithLocation.length} ubicación(es)
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* ============ BOTÓN CONTINUAR ============ */}
                    <TouchableOpacity
                        onPress={handleContinue}
                        disabled={!selectedZone || selectedDestinations.length === 0}
                        className={`py-5 rounded-2xl items-center shadow-lg flex-row justify-center ${selectedZone && selectedDestinations.length > 0
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
                            className={`p-4 border-b border-neutral-100 flex-row items-center justify-between ${selectedZone?.id === zone.id ? 'bg-indigo-50' : ''
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

            {/* ============ MODAL: IMPORTACIÓN MASIVA ============ */}
            <ClientMultiSelector
                visible={isMultiSelectVisible}
                onClose={() => setMultiSelectVisible(false)}
                onConfirm={handleBulkImport}
                availableItems={availableForBulk}
            />

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

                    {/* Info explicativa - Concepto clave */}
                    <View className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-xl mb-4 border border-indigo-100">
                        <View className="flex-row items-start mb-2">
                            <Ionicons name="bulb" size={18} color="#4F46E5" />
                            <Text className="text-indigo-900 font-bold text-sm ml-2">Regla de Zonas</Text>
                        </View>
                        <Text className="text-indigo-800 text-xs leading-5">
                            El vendedor viaja a la <Text className="font-bold">zona</Text>, no al cliente.
                            Solo puedes agregar destinos que estén en <Text className="font-bold">{selectedZone?.nombre || 'la zona seleccionada'}</Text>.
                        </Text>
                        <View className="flex-row items-center mt-3 space-x-3">
                            <View className="flex-row items-center">
                                <View className="w-3 h-3 rounded-full bg-green-500 mr-1" />
                                <Text className="text-xs text-neutral-600">Matriz en zona</Text>
                            </View>
                            <View className="flex-row items-center ml-3">
                                <View className="w-3 h-3 rounded-full bg-orange-500 mr-1" />
                                <Text className="text-xs text-neutral-600">Sucursal en zona</Text>
                            </View>
                            <View className="flex-row items-center ml-3">
                                <View className="w-3 h-3 rounded-full bg-neutral-300 mr-1" />
                                <Text className="text-xs text-neutral-400">Fuera de zona</Text>
                            </View>
                        </View>
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
                                <Text className="text-neutral-500 mt-2">No hay clientes con presencia en esta zona</Text>
                            </View>
                        ) : (
                            searchedClients.map(client => {
                                const isExpanded = expandedClientId === client.id
                                const branches = clientBranches.get(client.id) || []
                                const isLoadingBranches = loadingBranches === client.id
                                const clientName = client.nombre_comercial || client.razon_social
                                const clientLocation = parseLocation(client.ubicacion_gps)
                                const clientZoneId = Number(client.zona_comercial_id)
                                const isClientSelected = selectedDestinations.some(d => d.id === client.id)

                                // ¿La matriz está en la zona seleccionada?
                                const isMatrizInSelectedZone = clientZoneId === Number(selectedZone?.id)
                                const matrizZone = zones.find(z => z.id === clientZoneId)

                                // Sucursales que están EN la zona seleccionada
                                const branchesInZone = branches.filter(b => Number(b.zona_id) === Number(selectedZone?.id))
                                // Sucursales que están FUERA de la zona seleccionada
                                const branchesOutOfZone = branches.filter(b => Number(b.zona_id) !== Number(selectedZone?.id))

                                return (
                                    <View key={client.id} className="mb-3">
                                        {/* Cabecera del Cliente */}
                                        <TouchableOpacity
                                            onPress={() => handleExpandClient(client.id)}
                                            className={`p-3 rounded-xl border ${isExpanded ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-neutral-100'}`}
                                        >
                                            <View className="flex-row items-center justify-between">
                                                <View className="flex-row items-center flex-1">
                                                    <View className="w-10 h-10 rounded-full bg-indigo-100 items-center justify-center mr-3">
                                                        <Text className="text-indigo-600 font-bold">{clientName.charAt(0)}</Text>
                                                    </View>
                                                    <View className="flex-1">
                                                        <Text className="text-neutral-900 font-semibold text-sm" numberOfLines={1}>{clientName}</Text>
                                                        <View className="flex-row items-center mt-0.5">
                                                            <Text className="text-neutral-500 text-xs">{client.identificacion}</Text>
                                                            {isMatrizInSelectedZone ? (
                                                                <View className="bg-green-100 px-1.5 py-0.5 rounded ml-2">
                                                                    <Text className="text-green-700 text-[10px] font-medium">Matriz aquí</Text>
                                                                </View>
                                                            ) : branchesInZone.length > 0 && (
                                                                <View className="bg-orange-100 px-1.5 py-0.5 rounded ml-2">
                                                                    <Text className="text-orange-700 text-[10px] font-medium">{branchesInZone.length} sucursal(es)</Text>
                                                                </View>
                                                            )}
                                                        </View>
                                                    </View>
                                                </View>
                                                <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color="#6366F1" />
                                            </View>
                                        </TouchableOpacity>

                                        {/* Opciones Expandidas */}
                                        {isExpanded && (
                                            <View className="mt-2 bg-neutral-50 rounded-xl p-3 border border-neutral-100">

                                                {/* ============ SECCIÓN 1: MATRIZ ============ */}
                                                <View className="mb-3">
                                                    <Text className="text-xs font-bold text-neutral-500 uppercase mb-2">🏢 Dirección Principal (Matriz)</Text>
                                                    <TouchableOpacity
                                                        onPress={() => {
                                                            if (!isMatrizInSelectedZone || isClientSelected) return
                                                            handleAddDestination({
                                                                type: 'client',
                                                                id: client.id,
                                                                name: clientName,
                                                                address: client.direccion_texto || undefined,
                                                                location: clientLocation,
                                                                clientId: client.id,
                                                                clientName: clientName,
                                                                zoneId: clientZoneId,
                                                                zoneName: matrizZone?.nombre || 'Zona desconocida'
                                                            })
                                                        }}
                                                        disabled={!isMatrizInSelectedZone || isClientSelected}
                                                        className={`p-3 rounded-xl border flex-row items-center ${isClientSelected
                                                            ? 'bg-green-50 border-green-400'
                                                            : isMatrizInSelectedZone
                                                                ? 'bg-white border-green-200'
                                                                : 'bg-neutral-100 border-neutral-200 opacity-60'
                                                            }`}
                                                    >
                                                        <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${isClientSelected ? 'bg-green-500' : isMatrizInSelectedZone ? 'bg-green-100' : 'bg-neutral-200'
                                                            }`}>
                                                            <Ionicons
                                                                name={isClientSelected ? 'checkmark' : 'business'}
                                                                size={16}
                                                                color={isClientSelected ? 'white' : isMatrizInSelectedZone ? '#22C55E' : '#9CA3AF'}
                                                            />
                                                        </View>
                                                        <View className="flex-1">
                                                            <View className="flex-row items-center">
                                                                <Text className={`font-medium text-sm ${isMatrizInSelectedZone ? 'text-neutral-900' : 'text-neutral-400'}`}>
                                                                    {client.direccion_texto || 'Sin dirección'}
                                                                </Text>
                                                            </View>
                                                            <View className="flex-row items-center mt-1">
                                                                <View className={`px-2 py-0.5 rounded-full ${isMatrizInSelectedZone ? 'bg-green-100' : 'bg-neutral-200'}`}>
                                                                    <Text className={`text-[10px] font-medium ${isMatrizInSelectedZone ? 'text-green-700' : 'text-neutral-500'}`}>
                                                                        📍 {matrizZone?.nombre || 'Zona desconocida'}
                                                                    </Text>
                                                                </View>
                                                                {!isMatrizInSelectedZone && (
                                                                    <Text className="text-red-500 text-[10px] ml-2">⚠️ No está en {selectedZone?.nombre}</Text>
                                                                )}
                                                            </View>
                                                        </View>
                                                        {isClientSelected ? (
                                                            <View className="bg-green-500 px-2 py-1 rounded-full">
                                                                <Text className="text-white text-xs font-bold">✓</Text>
                                                            </View>
                                                        ) : isMatrizInSelectedZone ? (
                                                            <Ionicons name="add-circle" size={24} color="#22C55E" />
                                                        ) : (
                                                            <Ionicons name="close-circle" size={24} color="#D1D5DB" />
                                                        )}
                                                    </TouchableOpacity>
                                                </View>

                                                {/* ============ SECCIÓN 2: SUCURSALES ============ */}
                                                {isLoadingBranches ? (
                                                    <View className="py-4 items-center">
                                                        <ActivityIndicator size="small" color={BRAND_COLORS.red} />
                                                        <Text className="text-neutral-400 text-xs mt-1">Cargando sucursales...</Text>
                                                    </View>
                                                ) : branches.length > 0 ? (
                                                    <View>
                                                        <Text className="text-xs font-bold text-neutral-500 uppercase mb-2">🏪 Sucursales</Text>

                                                        {/* Sucursales EN la zona seleccionada (habilitadas) */}
                                                        {branchesInZone.length > 0 && (
                                                            <View className="mb-2">
                                                                {branchesInZone.map(branch => {
                                                                    const branchLocation = parseLocation(branch.ubicacion_gps)
                                                                    const isBranchSelected = selectedDestinations.some(d => d.id === branch.id)
                                                                    const branchZoneId = Number(branch.zona_id)

                                                                    return (
                                                                        <TouchableOpacity
                                                                            key={branch.id}
                                                                            onPress={() => {
                                                                                if (isBranchSelected) return
                                                                                handleAddDestination({
                                                                                    type: 'branch',
                                                                                    id: branch.id,
                                                                                    name: branch.nombre_sucursal,
                                                                                    address: branch.direccion_entrega,
                                                                                    location: branchLocation,
                                                                                    clientId: client.id,
                                                                                    clientName: clientName,
                                                                                    zoneId: branchZoneId,
                                                                                    zoneName: selectedZone?.nombre || 'Zona desconocida'
                                                                                })
                                                                            }}
                                                                            disabled={isBranchSelected}
                                                                            className={`p-3 rounded-xl border mb-2 flex-row items-center ${isBranchSelected ? 'bg-orange-50 border-orange-400' : 'bg-white border-orange-200'
                                                                                }`}
                                                                        >
                                                                            <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${isBranchSelected ? 'bg-orange-500' : 'bg-orange-100'
                                                                                }`}>
                                                                                <Ionicons
                                                                                    name={isBranchSelected ? 'checkmark' : 'storefront'}
                                                                                    size={16}
                                                                                    color={isBranchSelected ? 'white' : '#F59E0B'}
                                                                                />
                                                                            </View>
                                                                            <View className="flex-1">
                                                                                <Text className="text-neutral-900 font-medium text-sm">{branch.nombre_sucursal}</Text>
                                                                                <Text className="text-neutral-500 text-xs" numberOfLines={1}>{branch.direccion_entrega || 'Sin dirección'}</Text>
                                                                                <View className="bg-green-100 px-2 py-0.5 rounded-full mt-1 self-start">
                                                                                    <Text className="text-green-700 text-[10px] font-medium">✓ En {selectedZone?.nombre}</Text>
                                                                                </View>
                                                                            </View>
                                                                            {isBranchSelected ? (
                                                                                <View className="bg-orange-500 px-2 py-1 rounded-full">
                                                                                    <Text className="text-white text-xs font-bold">✓</Text>
                                                                                </View>
                                                                            ) : (
                                                                                <Ionicons name="add-circle" size={24} color="#F59E0B" />
                                                                            )}
                                                                        </TouchableOpacity>
                                                                    )
                                                                })}
                                                            </View>
                                                        )}

                                                        {/* Sucursales FUERA de la zona seleccionada (deshabilitadas) */}
                                                        {branchesOutOfZone.length > 0 && (
                                                            <View className="opacity-50">
                                                                <Text className="text-[10px] text-neutral-400 mb-1">Otras zonas (no disponibles):</Text>
                                                                {branchesOutOfZone.map(branch => {
                                                                    const branchZone = zones.find(z => z.id === Number(branch.zona_id))
                                                                    return (
                                                                        <View
                                                                            key={branch.id}
                                                                            className="p-2 rounded-lg bg-neutral-100 border border-neutral-200 mb-1 flex-row items-center"
                                                                        >
                                                                            <Ionicons name="storefront" size={14} color="#9CA3AF" />
                                                                            <Text className="text-neutral-400 text-xs ml-2 flex-1">{branch.nombre_sucursal}</Text>
                                                                            <Text className="text-neutral-400 text-[10px]">📍 {branchZone?.nombre || 'Otra zona'}</Text>
                                                                        </View>
                                                                    )
                                                                })}
                                                            </View>
                                                        )}
                                                    </View>
                                                ) : (
                                                    <View className="py-2">
                                                        <Text className="text-neutral-400 text-xs italic">Este cliente no tiene sucursales registradas</Text>
                                                    </View>
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
                        <View className="items-center">
                            <Text className="text-lg font-bold">{selectedZone?.nombre || 'Mapa'}</Text>
                            <Text className="text-neutral-500 text-xs">{destinationsWithLocation.length} destino(s)</Text>
                        </View>
                        <View className="w-7" />
                    </View>

                    <MapView
                        provider={PROVIDER_GOOGLE}
                        style={{ flex: 1 }}
                        initialRegion={mapRegion}
                        showsUserLocation
                        showsMyLocationButton
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

                        {/* Marcadores */}
                        {destinationsWithLocation.map((dest, index) => (
                            <Marker key={dest.id} coordinate={dest.location!} title={`${index + 1}. ${dest.name}`} description={dest.address}>
                                <View className="items-center">
                                    <View className={`w-10 h-10 rounded-full items-center justify-center border-2 border-white ${dest.type === 'branch' ? 'bg-orange-500' : 'bg-green-500'}`}>
                                        <Text className="text-white font-bold">{index + 1}</Text>
                                    </View>
                                </View>
                            </Marker>
                        ))}
                    </MapView>

                    {/* Leyenda del mapa */}
                    {zonePolygon.length >= 3 && (
                        <View className="absolute top-20 left-4 bg-indigo-600/90 px-3 py-2 rounded-xl flex-row items-center">
                            <Ionicons name="shapes" size={14} color="white" />
                            <Text className="text-white text-xs font-medium ml-1.5">Área de zona visible</Text>
                        </View>
                    )}

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

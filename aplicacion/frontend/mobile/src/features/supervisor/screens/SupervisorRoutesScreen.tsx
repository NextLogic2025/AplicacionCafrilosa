import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Header } from '../../../components/ui/Header'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { ZoneService, Zone } from '../../../services/api/ZoneService'
import { RouteService, RoutePlan } from '../../../services/api/RouteService'
import { ClientService } from '../../../services/api/ClientService'
import { RoutePlanningList } from '../components/RoutePlanningList'
import { RoutePlanningMap } from '../components/RoutePlanningMap'
import { SavedRoutesSummary } from '../components/SavedRoutesSummary'
import { RouteItemEditModal } from '../components/RouteItemEditModal'

// Mock days
const DAYS = [
    { id: 1, label: 'Lunes' },
    { id: 2, label: 'Martes' },
    { id: 3, label: 'Miércoles' },
    { id: 4, label: 'Jueves' },
    { id: 5, label: 'Viernes' },
    { id: 6, label: 'Sábado' },
    { id: 7, label: 'Domingo' },
]

export function SupervisorRoutesScreen() {
    const navigation = useNavigation()

    // UI State
    const [activeTab, setActiveTab] = useState<'plan' | 'saved'>('plan')
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
    const [loading, setLoading] = useState(false)

    // Modal State
    const [editModalVisible, setEditModalVisible] = useState(false)
    const [editingItem, setEditingItem] = useState<RoutePlan | null>(null)

    // Data State
    const [zones, setZones] = useState<Zone[]>([])
    const [selectedZone, setSelectedZone] = useState<Zone | null>(null)
    const [selectedDay, setSelectedDay] = useState(1) // Default Lunes
    const [routes, setRoutes] = useState<RoutePlan[]>([])

    // Load Initial Data (Zones)
    useEffect(() => {
        loadZones()
    }, [])

    // Load Routes when Filters Change (Only if in Plan mode)
    useEffect(() => {
        if (selectedZone && activeTab === 'plan') {
            loadRoutes()
        }
    }, [selectedZone, selectedDay, activeTab])

    const loadZones = async () => {
        try {
            const z = await ZoneService.getZones()
            setZones(z)
            if (z.length > 0) setSelectedZone(z[0])
        } catch (error) {
            console.error(error)
            Alert.alert('Error', 'No se pudieron cargar las zonas')
        }
    }

    const loadRoutes = async () => {
        if (!selectedZone) return;
        setLoading(true)
        try {
            // 1. Get ALL Clients & ALL Routes (Simulated efficient fetch)
            const [allClients, allRoutes] = await Promise.all([
                ClientService.getClients(),
                RouteService.getAll()
            ])

            // 2. Filter Clients by Zone
            const zoneClients = allClients.filter(c => c.zona_comercial_id === selectedZone.id)

            // 3. Filter Routes by Zone & Day
            const existingRoutes = allRoutes.filter(r => r.zona_id === selectedZone.id && r.dia_semana === selectedDay)

            // 4. Merge Data
            const mergedRoutes: RoutePlan[] = []

            zoneClients.forEach(client => {
                // Check if this client is already in the route plan
                const foundRoute = existingRoutes.find(r => r.cliente_id === client.id)

                if (foundRoute) {
                    // Use existing plan
                    mergedRoutes.push({
                        ...foundRoute,
                        // Ensure virtual fields are populated if missing from backend join
                        _cliente: {
                            razon_social: client.razon_social,
                            nombre_comercial: client.nombre_comercial || client.razon_social,
                            identificacion: client.identificacion,
                            direccion: client.direccion_texto,
                            ubicacion_gps: client.ubicacion_gps || undefined
                        }
                    })
                } else {
                    // Create "Virtual" Route Plan (Not saved yet)
                    mergedRoutes.push({
                        id: `temp-${client.id}`, // Temp ID
                        cliente_id: client.id,
                        zona_id: selectedZone.id,
                        dia_semana: selectedDay,
                        frecuencia: 'SEMANAL',
                        prioridad_visita: 'MEDIA',
                        orden_sugerido: 9999, // Push to end
                        activo: true,
                        _cliente: {
                            razon_social: client.razon_social,
                            nombre_comercial: client.nombre_comercial || client.razon_social,
                            identificacion: client.identificacion,
                            direccion: client.direccion_texto,
                            ubicacion_gps: client.ubicacion_gps || undefined
                        }
                    })
                }
            })

            // 5. Sort: Lower order first (planned), then 9999s
            mergedRoutes.sort((a, b) => (a.orden_sugerido || 0) - (b.orden_sugerido || 0))

            // 6. Re-normalize order for display (1, 2, 3...)
            const normalized = mergedRoutes.map((r, i) => ({ ...r, orden_sugerido: i + 1 }))

            setRoutes(normalized)
        } catch (error) {
            console.error(error)
            setRoutes([])
        } finally {
            setLoading(false)
        }
    }

    const handleReorder = (fromIndex: number, toIndex: number) => {
        const updated = [...routes]
        const [moved] = updated.splice(fromIndex, 1)
        updated.splice(toIndex, 0, moved)

        // Update order numbers
        const reindexed = updated.map((item, index) => ({
            ...item,
            orden_sugerido: index + 1
        }))

        setRoutes(reindexed)
    }

    const handleEditItem = (item: RoutePlan) => {
        setEditingItem(item)
        setEditModalVisible(true)
    }

    const handleUpdateItem = (updated: RoutePlan) => {
        // Update local state
        const newRoutes = routes.map(r => r.id === updated.id ? updated : r)
        setRoutes(newRoutes)
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            const promises = routes.map(r => {
                if (r.id.startsWith('temp-')) {
                    // It's new, CREATE it
                    // Remove temp id and _cliente before sending
                    const { id, _cliente, ...payload } = r
                    return RouteService.create(payload)
                } else {
                    // It exists, UPDATE everything
                    const { _cliente, ...payload } = r
                    return RouteService.update(r.id, payload)
                }
            })

            await Promise.all(promises)
            Alert.alert('Éxito', 'Ruta guardada correctamente')

            // Reload to get real IDs
            loadRoutes()
        } catch (error) {
            console.error(error)
            Alert.alert('Error', 'No se pudo guardar la ruta')
        } finally {
            setLoading(false)
        }
    }

    // --- RENDER HELPERS ---
    const renderTabs = () => (
        <View className="flex-row bg-white border-b border-neutral-100">
            <TouchableOpacity
                onPress={() => setActiveTab('plan')}
                className={`flex-1 py-3 items-center border-b-2 ${activeTab === 'plan' ? 'border-red-500' : 'border-transparent'}`}
            >
                <Text className={`font-bold ${activeTab === 'plan' ? 'text-red-600' : 'text-neutral-500'}`}>Planificar Ruta</Text>
            </TouchableOpacity>
            <TouchableOpacity
                onPress={() => setActiveTab('saved')}
                className={`flex-1 py-3 items-center border-b-2 ${activeTab === 'saved' ? 'border-red-500' : 'border-transparent'}`}
            >
                <Text className={`font-bold ${activeTab === 'saved' ? 'text-red-600' : 'text-neutral-500'}`}>Ver Rutas Guardadas</Text>
            </TouchableOpacity>
        </View>
    )

    const renderFilters = () => (
        <View className="px-4 py-2 bg-white border-b border-neutral-100">
            {/* Zone Selector (Simple Horizontal Scroll) */}
            <Text className="text-xs font-bold text-neutral-400 mb-1">ZONA</Text>
            <View className="flex-row flex-wrap gap-2 mb-3">
                {zones.map(z => (
                    <TouchableOpacity
                        key={z.id}
                        onPress={() => setSelectedZone(z)}
                        className={`px-3 py-1 rounded-full border ${selectedZone?.id === z.id ? 'bg-red-50 border-red-200' : 'bg-white border-neutral-200'}`}
                    >
                        <Text className={selectedZone?.id === z.id ? 'text-red-700 font-bold' : 'text-neutral-600'}>
                            {z.nombre}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Day Selector */}
            <Text className="text-xs font-bold text-neutral-400 mb-1">DÍA</Text>
            <View className="flex-row justify-between">
                {DAYS.map(d => (
                    <TouchableOpacity
                        key={d.id}
                        onPress={() => setSelectedDay(d.id)}
                        className={`w-10 h-10 rounded-full items-center justify-center ${selectedDay === d.id ? 'bg-red-500' : 'bg-neutral-100'}`}
                    >
                        <Text className={`font-bold ${selectedDay === d.id ? 'text-white' : 'text-neutral-500'}`}>
                            {d.label.substring(0, 1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    )

    return (
        <View className="flex-1 bg-neutral-50">
            <Header
                title="Rutas"
                variant="standard"
                onBackPress={() => navigation.goBack()}
                rightAction={activeTab === 'plan' ? {
                    icon: viewMode === 'list' ? 'map' : 'list',
                    onPress: () => setViewMode(viewMode === 'list' ? 'map' : 'list')
                } : undefined}
            />

            {renderTabs()}

            {activeTab === 'plan' ? (
                <>
                    {renderFilters()}

                    <View className="flex-1">
                        {loading && (
                            <View className="absolute z-10 w-full h-full bg-white/50 items-center justify-center">
                                <ActivityIndicator size="large" color={BRAND_COLORS.red} />
                            </View>
                        )}

                        {viewMode === 'list' ? (
                            <RoutePlanningList
                                routes={routes}
                                onReorder={handleReorder}
                                onEdit={handleEditItem}
                            />
                        ) : (
                            <RoutePlanningMap
                                routes={routes}
                                zonePolygon={selectedZone?.poligono_geografico} // GeoJSON if available
                            />
                        )}
                    </View>

                    {/* Sticky Save Button */}
                    {viewMode === 'list' && routes.length > 0 && (
                        <View className="p-4 bg-white border-t border-neutral-100">
                            <TouchableOpacity
                                onPress={handleSave}
                                className="bg-red-500 rounded-xl py-4 items-center shadow-lg active:opacity-90"
                            >
                                <Text className="text-white font-bold text-base">Guardar Rutero</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </>
            ) : (
                <SavedRoutesSummary
                    onSelectRoute={(zId, day) => {
                        const z = zones.find(mz => mz.id === zId)
                        if (z) {
                            setSelectedZone(z)
                            setSelectedDay(day)
                            setActiveTab('plan')
                        }
                    }}
                />
            )}

            <RouteItemEditModal
                visible={editModalVisible}
                routeItem={editingItem}
                onClose={() => setEditModalVisible(false)}
                onSave={handleUpdateItem}
            />
        </View>
    )
}

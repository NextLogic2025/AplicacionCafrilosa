import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Header } from '../../../components/ui/Header'
import { FeedbackModal, FeedbackType } from '../../../components/ui/FeedbackModal'
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
    const [filtersExpanded, setFiltersExpanded] = useState(true)

    // Modal State
    const [editModalVisible, setEditModalVisible] = useState(false)
    const [editingItem, setEditingItem] = useState<RoutePlan | null>(null)

    // Feedback Modal State
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedZone, selectedDay, activeTab])

    const loadZones = async () => {
        try {
            const z = await ZoneService.getZones()
            setZones(z)
            if (z.length > 0) setSelectedZone(z[0])
        } catch (error) {
            console.error(error)
            setFeedbackModal({
                visible: true,
                type: 'error',
                title: 'Error al cargar',
                message: 'No se pudieron cargar las zonas comerciales'
            })
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

            setFeedbackModal({
                visible: true,
                type: 'success',
                title: 'Ruta Actualizada',
                message: 'Los datos de la ruta se guardaron correctamente'
            })

            // Reload to get real IDs
            loadRoutes()
        } catch (error) {
            console.error(error)
            setFeedbackModal({
                visible: true,
                type: 'error',
                title: 'Error al guardar',
                message: 'No se pudo guardar la ruta. Intenta nuevamente'
            })
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
        <View style={{ backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
            {/* Collapsible Header */}
            <TouchableOpacity
                onPress={() => setFiltersExpanded(!filtersExpanded)}
                style={{
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#FAFAFA',
                    borderBottomWidth: filtersExpanded ? 1 : 0,
                    borderBottomColor: '#E5E7EB'
                }}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: BRAND_COLORS.red,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 10
                    }}>
                        <Ionicons name="options" size={18} color="white" />
                    </View>
                    <View>
                        <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#111827' }}>Filtros de Ruta</Text>
                        {!filtersExpanded && selectedZone && (
                            <Text style={{ fontSize: 12, color: '#6B7280' }}>
                                {selectedZone.nombre} • {DAYS.find(d => d.id === selectedDay)?.label}
                            </Text>
                        )}
                    </View>
                </View>
                <View style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: filtersExpanded ? '#FEE2E2' : '#D1FAE5',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Ionicons
                        name={filtersExpanded ? 'chevron-up' : 'checkmark'}
                        size={16}
                        color={filtersExpanded ? '#DC2626' : '#16A34A'}
                    />
                </View>
            </TouchableOpacity>

            {/* Filters Content */}
            {filtersExpanded && (
                <>
                    {/* Zone Selector */}
                    <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                                <Ionicons name="location" size={16} color="#DC2626" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#6B7280', textTransform: 'uppercase' }}>Zona Comercial</Text>
                                <Text style={{ fontSize: 14, color: '#4B5563' }}>Selecciona el área de trabajo</Text>
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                            {zones.map((z) => (
                                <TouchableOpacity
                                    key={z.id}
                                    onPress={() => setSelectedZone(z)}
                                    style={{
                                        paddingHorizontal: 16,
                                        paddingVertical: 10,
                                        borderRadius: 12,
                                        borderWidth: 2,
                                        backgroundColor: selectedZone?.id === z.id ? '#FEF2F2' : 'white',
                                        borderColor: selectedZone?.id === z.id ? BRAND_COLORS.red : '#E5E7EB',
                                        marginRight: 8,
                                        marginBottom: 8
                                    }}
                                >
                                    <Text style={{
                                        fontWeight: 'bold',
                                        fontSize: 14,
                                        color: selectedZone?.id === z.id ? '#B91C1C' : '#4B5563'
                                    }}>
                                        {z.nombre}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Day Selector */}
                    <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                                <Ionicons name="calendar" size={16} color="#2563EB" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#6B7280', textTransform: 'uppercase' }}>Día de la Semana</Text>
                                <Text style={{ fontSize: 14, color: '#4B5563' }}>Elige el día para la ruta</Text>
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            {DAYS.map((d, idx) => {
                                const isSelected = selectedDay === d.id
                                return (
                                    <TouchableOpacity
                                        key={d.id}
                                        onPress={() => setSelectedDay(d.id)}
                                        style={{
                                            flex: 1,
                                            paddingVertical: 12,
                                            marginLeft: idx > 0 ? 4 : 0,
                                            borderRadius: 12,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderWidth: 2,
                                            backgroundColor: isSelected ? BRAND_COLORS.red : '#F9FAFB',
                                            borderColor: isSelected ? '#DC2626' : '#E5E7EB'
                                        }}
                                    >
                                        <Text style={{ fontWeight: 'bold', fontSize: 10, color: isSelected ? 'white' : '#9CA3AF' }}>
                                            {d.label.substring(0, 3).toUpperCase()}
                                        </Text>
                                        <Text style={{ fontWeight: '900', fontSize: 12, marginTop: 2, color: isSelected ? 'white' : '#4B5563' }}>
                                            {d.label.substring(0, 1)}
                                        </Text>
                                    </TouchableOpacity>
                                )
                            })}
                        </View>
                    </View>

                    {/* Summary Info */}
                    {routes.length > 0 && activeTab === 'plan' && (
                        <View style={{ paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FEF2F2', borderTopWidth: 1, borderTopColor: '#FECACA' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Ionicons name="list" size={16} color="#DC2626" />
                                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#991B1B', marginLeft: 8 }}>
                                        {routes.length} clientes en esta ruta
                                    </Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Ionicons name="save-outline" size={14} color="#DC2626" />
                                    <Text style={{ fontSize: 12, color: '#DC2626', marginLeft: 4 }}>
                                        {routes.filter(r => r.id.startsWith('temp')).length} sin guardar
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}
                </>
            )}
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

            <FeedbackModal
                visible={feedbackModal.visible}
                type={feedbackModal.type}
                title={feedbackModal.title}
                message={feedbackModal.message}
                onClose={() => setFeedbackModal({ ...feedbackModal, visible: false })}
            />
        </View>
    )
}

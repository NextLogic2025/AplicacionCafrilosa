import React, { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert, InteractionManager, ScrollView, Switch } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Header } from '../../../components/ui/Header'
import { GenericTabs } from '../../../components/ui/GenericTabs'
import { Zone, ZoneService, ZoneHelpers, LatLng, ZoneEditState } from '../../../services/api/ZoneService'
import { AssignmentService, Allocation } from '../../../services/api/AssignmentService'
import { RouteService, RouteEntry } from '../../../services/api/RouteService'
import { UserService, UserProfile } from '../../../services/api/UserService'
import { GenericList } from '../../../components/ui/GenericList'
import { GenericModal } from '../../../components/ui/GenericModal'
import { Ionicons } from '@expo/vector-icons'
import { FeedbackModal, FeedbackType } from '../../../components/ui/FeedbackModal'
import { BRAND_COLORS } from '@cafrilosa/shared-types'

export function SupervisorZoneDetailScreen() {
    const navigation = useNavigation()
    const route = useRoute<any>()
    const initialZone = route.params?.zone as Zone | null

    const isEditing = !!initialZone
    const [loading, setLoading] = useState(false)

    // Unified Form State (Zone Info + Vendor Selection)
    const [zoneData, setZoneData] = useState({
        nombre: initialZone?.nombre || '',
        codigo: initialZone?.codigo || '',
        ciudad: initialZone?.ciudad || '',
        macrorregion: initialZone?.macrorregion || '',
        activo: initialZone?.activo ?? true, // Default true
    })

    const [polygon, setPolygon] = useState<LatLng[]>(
        initialZone?.poligono_geografico
            ? ZoneHelpers.parsePolygon(initialZone.poligono_geografico)
            : []
    )

    // Sync State on Focus (Return from Map)
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            if (ZoneEditState.tempPolygon !== null) {
                setPolygon(ZoneEditState.tempPolygon)
                ZoneEditState.tempPolygon = null // Clear after consuming
            }
        })
        return unsubscribe
    }, [navigation])



    const [selectedVendor, setSelectedVendor] = useState<UserProfile | null>(null)
    const [currentAssignment, setCurrentAssignment] = useState<Allocation | null>(null)

    // Data Lists
    const [vendors, setVendors] = useState<UserProfile[]>([])
    const [routeClients, setRouteClients] = useState<RouteEntry[]>([])
    const [showVendorModal, setShowVendorModal] = useState(false)
    const [assignedVendorsMap, setAssignedVendorsMap] = useState<Map<string, string>>(new Map()) // VendorID -> ZoneName

    // Feedback State
    const [feedbackVisible, setFeedbackVisible] = useState(false)
    const [feedbackConfig, setFeedbackConfig] = useState<{
        type: FeedbackType
        title: string
        message: string
        onConfirm?: () => void
    }>({ type: 'info', title: '', message: '' })

    // --- Lifecycle ---

    useEffect(() => {
        loadDependencies()
    }, [])

    const loadDependencies = async () => {
        setLoading(true)
        try {
            // 1. Load Vendors for Selection
            // 2. Load ALL assignments to build the restriction map & Editing Data
            const [allVendors, allAssignments, allZones] = await Promise.all([
                UserService.getVendors(),
                AssignmentService.getAllAssignments(),
                ZoneService.getZones()
            ])
            setVendors(allVendors)

            // Build Map: VendorID -> ZoneName (for active assignments)
            const map = new Map<string, string>()
            allAssignments.forEach(a => {
                const isActive = (a.es_principal === true || String(a.es_principal) === 'true')
                    && !a.fecha_fin
                    && !a.deleted_at

                if (isActive) {
                    // Find zone name
                    const z = allZones.find(z => z.id === Number(a.zona_id))
                    const zName = z ? z.nombre : `Zona #${a.zona_id}`
                    map.set(String(a.vendedor_usuario_id), zName)
                }
            })
            setAssignedVendorsMap(map)

            // 3. If Editing, Load Assignment and Route
            if (isEditing && initialZone?.id) {
                const [allocs, clients] = await Promise.all([
                    AssignmentService.getAssignmentsByZone(initialZone.id),
                    RouteService.getClientsInZone(initialZone.id)
                ])

                setRouteClients(clients)

                // Determine Current Vendor
                const main = allocs.find(a => a.es_principal) || allocs[0]
                if (main) {
                    setCurrentAssignment(main)
                    const foundVendor = allVendors.find(v => v.id === main.vendedor_usuario_id)
                    if (foundVendor) setSelectedVendor(foundVendor)
                }
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    // --- Helper for Feedback ---
    const showFeedback = (type: FeedbackType, title: string, message: string, onConfirm?: () => void) => {
        setFeedbackConfig({ type, title, message, onConfirm })
        setFeedbackVisible(true)
    }

    // --- Main Logic ---

    const handleSave = async () => {
        const nombre = zoneData.nombre.trim()
        const codigo = zoneData.codigo.trim()

        if (!nombre || !codigo) {
            showFeedback('warning', 'Validación', 'El Nombre y el Código de Zona son obligatorios.')
            return
        }

        setLoading(true)
        try {
            // 1. Create or Update ZONE
            let zoneId = initialZone?.id
            const zonePayload = {
                nombre,
                codigo,
                ciudad: zoneData.ciudad.trim() || undefined,
                macrorregion: zoneData.macrorregion.trim() || undefined,
                poligono_geografico: ZoneHelpers.toGeoJson(polygon),
                activo: zoneData.activo
            }

            if (isEditing && zoneId) {
                await ZoneService.updateZone(zoneId, zonePayload)
            } else {
                const createRes = await ZoneService.createZone(zonePayload)
                if (!createRes.success || !createRes.data) {
                    throw new Error(createRes.message || 'Error al crear la zona.')
                }
                zoneId = createRes.data.id
            }

            if (!zoneId) throw new Error('No se pudo obtener el ID de la zona.')

            // 2. Handle Assignment Logic (Chained)
            if (selectedVendor) {
                // Check if vendor changed or if it's new
                const isVendorChanged = !currentAssignment || currentAssignment.vendedor_usuario_id !== selectedVendor.id

                if (isVendorChanged) {
                    // Remove old if exists
                    if (currentAssignment) {
                        await AssignmentService.removeAssignment(currentAssignment.id)
                    }
                    // Create new
                    await AssignmentService.assignVendor({
                        zona_id: zoneId,
                        vendedor_usuario_id: selectedVendor.id,
                        es_principal: true,
                        nombre_vendedor_cache: selectedVendor.name
                    })
                }
            } else if (currentAssignment) {
                // If vendor was deselected (should imply removal)
                await AssignmentService.removeAssignment(currentAssignment.id)
            }

            // Success Flow
            if (!isEditing) {
                showFeedback('success', 'Zona Creada', 'La zona ha sido creada con éxito.', () => navigation.goBack())
            } else {
                showFeedback('success', 'Zona Actualizada', 'Los cambios se han guardado correctamente.', () => navigation.goBack())
            }

        } catch (error: any) {
            let msg = error.message || 'Error desconocido'
            if (msg.includes('500')) msg = 'Error del servidor. Verifica que el CÓDIGO no esté duplicado.'

            showFeedback('error', 'Error', msg)
        } finally {
            setLoading(false)
        }
    }

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title={isEditing ? 'Detalle de Zona' : 'Nueva Zona'} variant="standard" onBackPress={() => navigation.goBack()} />

            <ScrollView className="flex-1 px-4 pt-4">
                <View className={`bg-white p-5 rounded-2xl border mb-6 shadow-sm ${!zoneData.activo ? 'border-neutral-200 opacity-80' : 'border-neutral-100'}`}>

                    {/* Zone Code */}
                    <Text className="text-neutral-500 text-xs font-bold mb-1 uppercase">Código de Zona</Text>
                    <TextInput
                        className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 mb-4 text-neutral-900"
                        value={zoneData.codigo}
                        onChangeText={t => setZoneData(prev => ({ ...prev, codigo: t }))}
                        placeholder="EJ: UIO-N-01"
                        editable={zoneData.activo}
                    />

                    {/* Zone Name */}
                    <Text className="text-neutral-500 text-xs font-bold mb-1 uppercase">Nombre de Zona</Text>
                    <TextInput
                        className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 mb-4 text-neutral-900"
                        value={zoneData.nombre}
                        onChangeText={t => setZoneData(prev => ({ ...prev, nombre: t }))}
                        placeholder="EJ: Quito Norte"
                        editable={zoneData.activo}
                    />

                    <View className="flex-row gap-4 mb-4">
                        <View className="flex-1">
                            <Text className="text-neutral-500 text-xs font-bold mb-1 uppercase">Ciudad</Text>
                            <TextInput
                                className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 text-neutral-900"
                                value={zoneData.ciudad}
                                onChangeText={t => setZoneData(prev => ({ ...prev, ciudad: t }))}
                                placeholder="EJ: Quito"
                                editable={zoneData.activo}
                            />
                        </View>
                        <View className="flex-1">
                            <Text className="text-neutral-500 text-xs font-bold mb-1 uppercase">Macrorregión</Text>
                            <TextInput
                                className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 text-neutral-900"
                                value={zoneData.macrorregion}
                                onChangeText={t => setZoneData(prev => ({ ...prev, macrorregion: t }))}
                                placeholder="EJ: Sierra"
                                editable={zoneData.activo}
                            />
                        </View>
                    </View>

                    {/* Polygon Section */}
                    <View className="mb-4">
                        <Text className="text-neutral-500 text-xs font-bold mb-1 uppercase">Perímetro de Zona</Text>
                        <TouchableOpacity
                            className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex-row items-center justify-between"
                            onPress={() => {
                                (navigation as any).navigate('SupervisorZoneMap', {
                                    mode: 'edit',
                                    initialPolygon: polygon,
                                    onSavePolygon: (poly: LatLng[]) => setPolygon(poly)
                                })
                            }}
                            disabled={!zoneData.activo}
                        >
                            <View className="flex-row items-center">
                                <Ionicons name="map" size={20} color={zoneData.activo ? "#2563EB" : "#9CA3AF"} />
                                <Text className={`font-bold ml-2 ${zoneData.activo ? 'text-blue-900' : 'text-neutral-400'}`}>
                                    {polygon.length > 0
                                        ? `Polígono Definido (${polygon.length} puntos)`
                                        : 'Dibujar en Mapa'
                                    }
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={zoneData.activo ? "#2563EB" : "#9CA3AF"} />
                        </TouchableOpacity>
                        {polygon.length > 0 && zoneData.activo && (
                            <TouchableOpacity
                                onPress={() => {
                                    if (!isEditing) {
                                        setPolygon([])
                                        return
                                    }

                                    Alert.alert(
                                        'Eliminar Perímetro',
                                        '¿Estás seguro de borrar el perímetro de la base de datos ahora mismo?',
                                        [
                                            { text: 'Cancelar', style: 'cancel' },
                                            {
                                                text: 'Eliminar',
                                                style: 'destructive',
                                                onPress: async () => {
                                                    setLoading(true)
                                                    try {
                                                        await ZoneService.updateZone(initialZone!.id, { poligono_geografico: null })
                                                        setPolygon([])
                                                        showFeedback('success', 'Eliminado', 'Perímetro eliminado correctamente.')
                                                    } catch (error) {
                                                        showFeedback('error', 'Error', 'No se pudo eliminar el perímetro.')
                                                    } finally {
                                                        setLoading(false)
                                                    }
                                                }
                                            }
                                        ]
                                    )
                                }}
                                className="mt-3 bg-red-100 py-3 rounded-xl items-center border border-red-200"
                            >
                                <View className="flex-row items-center">
                                    <Ionicons name="trash-outline" size={18} color="#DC2626" />
                                    <Text className="text-red-700 font-bold ml-2">Eliminar Perímetro</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Unified Vendor Selection */}
                    <View className="mt-2 border-t border-neutral-100 pt-4">
                        <View className="flex-row items-center mb-3">
                            <Ionicons name="person-circle-outline" size={22} color={BRAND_COLORS.red} />
                            <Text className="text-neutral-900 font-bold ml-2">Vendedor Responsable</Text>
                        </View>

                        <TouchableOpacity
                            className={`flex-row items-center justify-between p-4 rounded-xl border ${selectedVendor ? 'bg-blue-50 border-blue-200' : 'bg-neutral-50 border-neutral-200'}`}
                            onPress={() => setShowVendorModal(true)}
                            disabled={!zoneData.activo}
                        >
                            {selectedVendor ? (
                                <View className="flex-1">
                                    <Text className="text-blue-900 font-bold text-base">{selectedVendor.name}</Text>
                                    <Text className="text-blue-600 text-xs">{selectedVendor.email}</Text>
                                </View>
                            ) : (
                                <Text className="text-neutral-400 italic">Seleccionar Vendedor (Opcional)</Text>
                            )}
                            <Ionicons name="chevron-down" size={20} color={selectedVendor ? '#1E40AF' : '#9CA3AF'} />
                        </TouchableOpacity>
                    </View>

                </View>

                {/* Configuration / Status Card */}
                <View className="mb-6">
                    <Text className="text-neutral-900 font-bold text-lg mb-3">Configuración</Text>
                    <View className="bg-white p-4 rounded-2xl border border-neutral-100 flex-row items-center justify-between shadow-sm">
                        <View className="flex-row items-center flex-1 mr-4">
                            <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${zoneData.activo ? 'bg-green-100' : 'bg-orange-100'}`}>
                                <Ionicons name="power" size={20} color={zoneData.activo ? '#16A34A' : '#D97706'} />
                            </View>
                            <View>
                                <Text className="font-bold text-neutral-900 text-base">Estado de Zona</Text>
                                <Text className="text-neutral-500 text-xs">
                                    {zoneData.activo ? 'La zona está visible y activa' : 'La zona está oculta y desactivada'}
                                </Text>
                            </View>
                        </View>
                        <Switch
                            trackColor={{ false: '#767577', true: '#16A34A' }}
                            thumbColor={zoneData.activo ? '#ffffff' : '#f4f3f4'}
                            ios_backgroundColor="#3e3e3e"
                            onValueChange={(val) => setZoneData(prev => ({ ...prev, activo: val }))}
                            value={zoneData.activo}
                        />
                    </View>
                </View>

                <TouchableOpacity
                    className={`w-full py-4 rounded-xl items-center shadow-lg mb-10 ${loading ? 'opacity-70' : ''}`}
                    style={{ backgroundColor: BRAND_COLORS.red }}
                    onPress={handleSave}
                    disabled={loading}
                >
                    <Text className="text-white font-bold text-lg">
                        {loading ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Zona')}
                    </Text>
                </TouchableOpacity>

            </ScrollView>

            {/* Vendor Modal */}
            <GenericModal visible={showVendorModal} title="Seleccionar Vendedor" onClose={() => setShowVendorModal(false)}>
                <View className="h-80">
                    <GenericList
                        items={vendors}
                        isLoading={false}
                        onRefresh={() => { }}
                        renderItem={(item: UserProfile) => {
                            const isSelected = selectedVendor?.id === item.id
                            // Check restriction: Assigned to diff zone AND NOT the current one (if editing)
                            // But wait, if we are editing Zone A, and Vendor is in Zone A, that's fine.
                            // If Vendor is in Zone B, that's restricted.
                            // However, map stores Vendor -> ZoneName.
                            // Using ID comparison is safer.

                            const assignedZoneName = assignedVendorsMap.get(String(item.id))
                            // If assignedZoneName exists, check if it is THIS zone.
                            // How do we know "THIS" zone name?
                            // We compare if the vendor is currently assigned to this zone via currentAssignment logic or by ID check if we had zone ID.
                            // Easier: If assignedZoneName exists AND (IsNotEditing OR (IsEditing AND assignedZoneName !== initialZone.nombre? No, names update. Use ID logic ideally, but map values are names.))
                            // Better: We have `currentAssignment`. If `currentAssignment.vendedor_usuario_id === item.id`, they are valid for THIS zone.

                            const isAssignedToOther = !!assignedZoneName && (!currentAssignment || String(currentAssignment.vendedor_usuario_id) !== String(item.id))

                            return (
                                <TouchableOpacity
                                    className={`p-3 mb-2 rounded-xl flex-row items-center justify-between border ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-neutral-100'} ${isAssignedToOther ? 'opacity-60 bg-gray-50' : ''}`}
                                    onPress={() => {
                                        if (isAssignedToOther) {
                                            showFeedback('warning', 'Vendedor Ya Asignado', `Este vendedor ya pertenece a la zona: ${assignedZoneName}`)
                                            return
                                        }
                                        setSelectedVendor(item)
                                        setShowVendorModal(false)
                                    }}
                                >
                                    <View className="flex-row items-center flex-1">
                                        <View className={`w-10 h-10 rounded-full mr-3 items-center justify-center ${isSelected ? 'bg-blue-100' : (isAssignedToOther ? 'bg-gray-200' : 'bg-neutral-100')}`}>
                                            <Text className={`${isSelected ? 'text-blue-600' : 'text-neutral-500'} font-bold`}>{item.name.charAt(0)}</Text>
                                        </View>
                                        <View>
                                            <Text className={`font-bold ${isSelected ? 'text-blue-900' : (isAssignedToOther ? 'text-gray-500' : 'text-neutral-800')}`}>{item.name}</Text>
                                            <Text className="text-xs text-neutral-500">{item.email}</Text>
                                            {isAssignedToOther && (
                                                <Text className="text-xs text-orange-600 font-bold mt-0.5">Asignado a: {assignedZoneName}</Text>
                                            )}
                                        </View>
                                    </View>
                                    {isSelected && <Ionicons name="checkmark-circle" size={24} color="#2563EB" />}
                                </TouchableOpacity>
                            )
                        }}
                        emptyState={{ icon: 'people', title: 'Sin Vendedores', message: 'No se encontraron vendedores disponibles.' }}
                    />
                </View>
            </GenericModal>

            <FeedbackModal
                visible={feedbackVisible}
                type={feedbackConfig.type}
                title={feedbackConfig.title}
                message={feedbackConfig.message}
                onClose={() => setFeedbackVisible(false)}
                onConfirm={feedbackConfig.onConfirm}
            />
        </View >
    )
}

import React, { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert, InteractionManager, ScrollView } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Header } from '../../../components/ui/Header'
import { GenericTabs } from '../../../components/ui/GenericTabs'
import { Zone, ZoneService } from '../../../services/api/ZoneService'
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
    const [activeTab, setActiveTab] = useState('info')

    // Unified Form State (Zone Info + Vendor Selection)
    const [zoneData, setZoneData] = useState({
        nombre: initialZone?.nombre || '',
        codigo: initialZone?.codigo || '',
        ciudad: initialZone?.ciudad || '',
        macrorregion: initialZone?.macrorregion || '',
    })

    const [selectedVendor, setSelectedVendor] = useState<UserProfile | null>(null)
    const [currentAssignment, setCurrentAssignment] = useState<Allocation | null>(null)

    // Data Lists
    const [vendors, setVendors] = useState<UserProfile[]>([])
    const [routeClients, setRouteClients] = useState<RouteEntry[]>([])
    const [showVendorModal, setShowVendorModal] = useState(false)

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
            const allVendors = await UserService.getVendors()
            setVendors(allVendors)

            // 2. If Editing, Load Assignment and Route
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
                macrorregion: zoneData.macrorregion.trim() || undefined
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

    // --- Renders ---

    const renderInfoTab = () => (
        <ScrollView className="flex-1 pt-4">
            <View className="bg-white p-5 rounded-2xl border border-neutral-100 mb-6 shadow-sm">

                {/* Zone Code */}
                <Text className="text-neutral-500 text-xs font-bold mb-1 uppercase">Código de Zona</Text>
                <TextInput
                    className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 mb-4 text-neutral-900"
                    value={zoneData.codigo}
                    onChangeText={t => setZoneData(prev => ({ ...prev, codigo: t }))}
                    placeholder="EJ: UIO-N-01"
                />

                {/* Zone Name */}
                <Text className="text-neutral-500 text-xs font-bold mb-1 uppercase">Nombre de Zona</Text>
                <TextInput
                    className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 mb-4 text-neutral-900"
                    value={zoneData.nombre}
                    onChangeText={t => setZoneData(prev => ({ ...prev, nombre: t }))}
                    placeholder="EJ: Quito Norte"
                />

                <View className="flex-row gap-4 mb-4">
                    <View className="flex-1">
                        <Text className="text-neutral-500 text-xs font-bold mb-1 uppercase">Ciudad</Text>
                        <TextInput
                            className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 text-neutral-900"
                            value={zoneData.ciudad}
                            onChangeText={t => setZoneData(prev => ({ ...prev, ciudad: t }))}
                            placeholder="EJ: Quito"
                        />
                    </View>
                    <View className="flex-1">
                        <Text className="text-neutral-500 text-xs font-bold mb-1 uppercase">Macrorregión</Text>
                        <TextInput
                            className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 text-neutral-900"
                            value={zoneData.macrorregion}
                            onChangeText={t => setZoneData(prev => ({ ...prev, macrorregion: t }))}
                            placeholder="EJ: Sierra"
                        />
                    </View>
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
    )

    const renderRouteTab = () => {
        if (!isEditing) return (
            <View className="flex-1 items-center justify-center p-8">
                <Ionicons name="map-outline" size={48} color="#E5E7EB" />
                <Text className="text-neutral-400 text-center mt-4">Guarda la zona primero para agregar clientes al rutero.</Text>
            </View>
        )

        return (
            <View className="flex-1 pt-4">
                <GenericList
                    items={routeClients}
                    renderItem={(item: RouteEntry) => (
                        <View className="bg-white p-4 mb-2 rounded-xl border border-neutral-100 flex-row justify-between items-center shadow-sm">
                            <View>
                                <Text className="font-bold text-neutral-800">Cliente ID: {item.cliente_id.substring(0, 6)}...</Text>
                                <Text className="text-xs text-neutral-500">Día visita: {item.dia_semana}</Text>
                            </View>
                            <TouchableOpacity onPress={() => RouteService.removeClientFromZone(item.id).then(loadDependencies)}>
                                <Ionicons name="trash-outline" size={20} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    )}
                    isLoading={false}
                    onRefresh={loadDependencies}
                    emptyState={{ icon: 'map', title: 'Ruta Vacía', message: 'No hay clientes asignados a esta ruta.' }}
                />
            </View>
        )
    }

    const tabs = [
        { key: 'info', label: 'Información' },
        { key: 'route', label: 'Rutero' }
    ]

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title={isEditing ? 'Detalle de Zona' : 'Nueva Zona'} variant="standard" onBackPress={() => navigation.goBack()} />

            <GenericTabs
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                containerClassName="pt-2"
            />

            <View className="flex-1 px-4">
                {activeTab === 'info' && renderInfoTab()}
                {activeTab === 'route' && renderRouteTab()}
            </View>

            {/* Vendor Modal */}
            <GenericModal visible={showVendorModal} title="Seleccionar Vendedor" onClose={() => setShowVendorModal(false)}>
                <View className="h-80">
                    <GenericList
                        items={vendors}
                        isLoading={false}
                        onRefresh={() => { }}
                        renderItem={(item: UserProfile) => {
                            const isSelected = selectedVendor?.id === item.id
                            return (
                                <TouchableOpacity
                                    className={`p-3 mb-2 rounded-xl flex-row items-center justify-between border ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-neutral-100'}`}
                                    onPress={() => {
                                        setSelectedVendor(item)
                                        setShowVendorModal(false)
                                    }}
                                >
                                    <View className="flex-row items-center flex-1">
                                        <View className={`w-10 h-10 rounded-full mr-3 items-center justify-center ${isSelected ? 'bg-blue-100' : 'bg-neutral-100'}`}>
                                            <Text className={`${isSelected ? 'text-blue-600' : 'text-neutral-500'} font-bold`}>{item.name.charAt(0)}</Text>
                                        </View>
                                        <View>
                                            <Text className={`font-bold ${isSelected ? 'text-blue-900' : 'text-neutral-800'}`}>{item.name}</Text>
                                            <Text className="text-xs text-neutral-500">{item.email}</Text>
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
        </View>
    )
}

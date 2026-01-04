
import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Header } from '../../../components/ui/Header'
import { GenericTabs } from '../../../components/ui/GenericTabs'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { Zone, ZoneService } from '../../../services/api/ZoneService'
import { AssignmentService, Allocation } from '../../../services/api/AssignmentService'
import { RouteService, RouteEntry } from '../../../services/api/RouteService'
import { UserService, UserProfile } from '../../../services/api/UserService'
import { GenericList } from '../../../components/ui/GenericList'
import { GenericModal } from '../../../components/ui/GenericModal'
import { Ionicons } from '@expo/vector-icons'
import { FeedbackModal } from '../../../components/ui/FeedbackModal'

export function SupervisorZoneDetailScreen() {
    const navigation = useNavigation()
    const route = useRoute<any>()
    const initialZone = route.params?.zone as Zone | null

    const isEditing = !!initialZone
    const [zone, setZone] = useState<Partial<Zone>>((initialZone as Partial<Zone>) || {})
    const [activeTab, setActiveTab] = useState('info')
    const [loading, setLoading] = useState(false)
    const [feedback, setFeedback] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({ visible: false, message: '', type: 'success' })

    // Data State for Tabs
    const [assignment, setAssignment] = useState<Allocation | null>(null)
    const [vendorDetails, setVendorDetails] = useState<UserProfile | null>(null)
    const [routeClients, setRouteClients] = useState<RouteEntry[]>([])

    // Vendor Selection Modal
    const [showVendorModal, setShowVendorModal] = useState(false)
    const [vendors, setVendors] = useState<UserProfile[]>([])
    const [loadingVendors, setLoadingVendors] = useState(false)

    // Initial Fetch
    useEffect(() => {
        if (isEditing && initialZone?.id) {
            fetchDetails()
        }
    }, [])

    const fetchDetails = async () => {
        if (!initialZone?.id) return
        setLoading(true)
        try {
            // 1. Fetch Assignments
            const allocs = await AssignmentService.getAssignmentsByZone(initialZone.id)
            const main = allocs.find(a => a.es_principal) || allocs[0]

            setAssignment(main || null)
            setVendorDetails(null) // Reset first

            // 2. Fetch Full Vendor Profile if assignment exists
            if (main && main.vendedor_usuario_id) {
                // We assume UserService has a way to get user by ID, or we fetch all and find. 
                // Since there isn't a direct getById exposed in previous context (only getUsers), we'll fetch all users or vendors.
                // Optimally we'd have a getById. Falling back to getVendors() filter for now as per available tools.
                const allVendors = await UserService.getVendors() // or getUsers()
                const found = allVendors.find(v => v.id === main.vendedor_usuario_id)
                if (found) setVendorDetails(found)
            }

            // 3. Fetch Route Clients
            const clients = await RouteService.getClientsInZone(initialZone.id)
            setRouteClients(clients)

        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const loadVendors = async () => {
        setLoadingVendors(true)
        const v = await UserService.getVendors()
        setVendors(v)
        setLoadingVendors(false)
    }

    const handleSaveInfo = async () => {
        if (!zone.nombre || !zone.codigo) {
            Alert.alert('Error', 'Nombre y Código son obligatorios')
            return
        }
        setLoading(true)
        try {
            let result
            if (isEditing && zone.id) {
                result = await ZoneService.updateZone(zone.id, { nombre: zone.nombre, codigo: zone.codigo, ciudad: zone.ciudad, macrorregion: zone.macrorregion })
            } else {
                result = await ZoneService.createZone({ nombre: zone.nombre as string, codigo: zone.codigo as string, ciudad: zone.ciudad, macrorregion: zone.macrorregion })
            }

            if (result.success) {
                setFeedback({ visible: true, message: isEditing ? 'Zona actualizada' : 'Zona creada exitosamente', type: 'success' })
                const createdZone = (result as any).data
                if (!isEditing && createdZone) {
                    setZone(createdZone)
                }
            } else {
                setFeedback({ visible: true, message: result.message || 'Error', type: 'error' })
            }
        } catch (e: any) {
            setFeedback({ visible: true, message: e.message || 'Error de conexión', type: 'error' })
        } finally {
            setLoading(false)
        }
    }

    const handleAssignVendor = async (vendor: UserProfile) => {
        if (!zone.id) return

        // If reassigning to SAME vendor, do nothing
        if (assignment && assignment.vendedor_usuario_id === vendor.id) {
            setShowVendorModal(false)
            return
        }

        setLoading(true)
        setShowVendorModal(false)

        try {
            // Reassignment Login:
            // 1. If assignment exists, try to DELETE it first.
            if (assignment) {
                const delRes = await AssignmentService.removeAssignment(assignment.id)
                if (!delRes.success) {
                    throw new Error(delRes.message || 'No se pudo desvincular el vendedor actual (Permisos insuficientes).')
                }
            }

            // 2. Create NEW Assignment
            const res = await AssignmentService.assignVendor({ zona_id: zone.id, vendedor_usuario_id: vendor.id, es_principal: true })

            if (res.success) {
                fetchDetails() // Reload UI
                setFeedback({ visible: true, message: 'Vendedor asignado correctamente', type: 'success' })
            } else {
                throw new Error(res.message)
            }

        } catch (e: any) {
            console.error(e)
            const msg = e.message || 'Error al asignar'

            // Helpful message for Permission Errors
            if (msg.toLowerCase().includes('permiso') || msg.toLowerCase().includes('auth') || msg.includes('403')) {
                Alert.alert('Permiso Denegado', 'Como Supervisor no tienes permiso para eliminar la asignación actual. Contacta al Administrador.')
            } else {
                setFeedback({ visible: true, message: msg, type: 'error' })
            }
        } finally {
            setLoading(false)
        }
    }

    // Render Logic
    const renderInfoTab = () => (
        <View className="bg-white p-5 rounded-2xl border border-neutral-100 mt-4">
            <Text className="text-neutral-500 text-xs font-bold mb-1 uppercase">Código de Zona</Text>
            <TextInput
                className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 mb-4"
                value={zone.codigo}
                onChangeText={t => setZone({ ...zone, codigo: t })}
                placeholder="EJ: UIO-N-01"
            />

            <Text className="text-neutral-500 text-xs font-bold mb-1 uppercase">Nombre de Zona</Text>
            <TextInput
                className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 mb-4"
                value={zone.nombre}
                onChangeText={t => setZone({ ...zone, nombre: t })}
                placeholder="EJ: Quito Norte - Carcelén"
            />

            <Text className="text-neutral-500 text-xs font-bold mb-1 uppercase">Ciudad</Text>
            <TextInput
                className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 mb-6"
                value={zone.ciudad || ''}
                onChangeText={t => setZone({ ...zone, ciudad: t })}
                placeholder="EJ: Quito"
            />

            <Text className="text-neutral-500 text-xs font-bold mb-1 uppercase">Macrorregión</Text>
            <TextInput
                className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 mb-6"
                value={zone.macrorregion || ''}
                onChangeText={t => setZone({ ...zone, macrorregion: t })}
                placeholder="EJ: Sierra"
            />

            <TouchableOpacity
                className="bg-red-500 py-4 rounded-xl items-center shadow-lg"
                onPress={handleSaveInfo}
            >
                <Text className="text-white font-bold text-lg">{isEditing ? 'Guardar Cambios' : 'Crear Zona'}</Text>
            </TouchableOpacity>
        </View>
    )

    const renderVendorTab = () => {
        if (!zone.id) return <Text className="text-center mt-10 text-neutral-400">Guarda la zona primero para asignar vendedores.</Text>

        return (
            <View className="mt-4">
                {assignment ? (
                    <View className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm items-center">
                        {/* Enhanced Vendor Card */}
                        <View className="w-24 h-24 rounded-full bg-red-50 items-center justify-center mb-4 border-4 border-white shadow-sm">
                            {vendorDetails?.photoUrl ? (
                                <Text>IMG</Text>
                            ) : (
                                <Text className="text-red-500 font-bold text-3xl">
                                    {vendorDetails?.name?.charAt(0).toUpperCase() || '?'}
                                </Text>
                            )}
                        </View>

                        <Text className="text-xl font-bold text-neutral-900 mb-1 text-center">
                            {vendorDetails?.name || 'Vendedor Desconocido'}
                        </Text>

                        <View className="bg-neutral-100 px-3 py-1 rounded-full mb-4">
                            <Text className="text-neutral-500 text-xs font-medium">
                                {vendorDetails?.email || `ID: ${assignment.vendedor_usuario_id.substring(0, 8)}`}
                            </Text>
                        </View>

                        <View className="w-full bg-neutral-50 p-4 rounded-xl mb-6">
                            <View className="flex-row justify-between mb-2">
                                <Text className="text-neutral-500 text-xs">Rol</Text>
                                <Text className="text-neutral-900 text-xs font-bold capitalize">{vendorDetails?.role || 'Vendedor'}</Text>
                            </View>
                            <View className="flex-row justify-between">
                                <Text className="text-neutral-500 text-xs">Asignado el</Text>
                                <Text className="text-neutral-900 text-xs font-bold">Hoy</Text>
                                {/* Date logic could be added if API provided allocation date */}
                            </View>
                        </View>

                        <TouchableOpacity
                            className="w-full bg-white border border-neutral-200 py-3 rounded-xl items-center flex-row justify-center space-x-2 shadow-sm"
                            onPress={() => { loadVendors(); setShowVendorModal(true); }}
                        >
                            <Ionicons name="swap-horizontal" size={20} color="#4b5563" />
                            <Text className="text-neutral-700 font-bold">Reasignar Zona</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View className="items-center mt-10 p-8 bg-white rounded-3xl border border-dashed border-neutral-300">
                        <View className="w-20 h-20 bg-neutral-50 rounded-full items-center justify-center mb-4">
                            <Ionicons name="person-add-outline" size={32} color="#d1d5db" />
                        </View>
                        <Text className="text-neutral-900 font-bold text-lg mb-2">Sin Asignación</Text>
                        <Text className="text-neutral-500 text-center mb-6">Esta zona aún no tiene un vendedor responsable.</Text>

                        <TouchableOpacity
                            className="bg-red-500 py-3 px-8 rounded-xl shadow-md"
                            onPress={() => { loadVendors(); setShowVendorModal(true); }}
                        >
                            <Text className="text-white font-bold">Asignar Vendedor</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        )
    }

    const renderRouteTab = () => {
        if (!zone.id) return <Text className="text-center mt-10 text-neutral-400">Guarda la zona primero para agregar clientes.</Text>

        return (
            <View className="mt-4 flex-1">
                <GenericList
                    items={routeClients}
                    renderItem={(item: RouteEntry) => (
                        <View className="bg-white p-4 mb-2 rounded-xl border border-neutral-100 flex-row justify-between items-center shadow-sm">
                            <View>
                                <Text className="font-bold text-neutral-800">Cliente ID: {item.cliente_id.substring(0, 6)}...</Text>
                                <Text className="text-xs text-neutral-500">Día visita: {item.dia_semana}</Text>
                            </View>
                            <TouchableOpacity onPress={() => RouteService.removeClientFromZone(item.id).then(fetchDetails)}>
                                <Ionicons name="trash-outline" size={20} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    )}
                    isLoading={false}
                    onRefresh={fetchDetails}
                    emptyState={{ icon: 'map', title: 'Ruta Vacía', message: 'No hay clientes en esta ruta.' }}
                />
            </View>
        )
    }

    const tabs = [
        { key: 'info', label: 'Información' },
        { key: 'vendor', label: 'Vendedor' },
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
                {activeTab === 'vendor' && renderVendorTab()}
                {activeTab === 'route' && renderRouteTab()}
            </View>

            {/* Vendor Modal */}
            <GenericModal visible={showVendorModal} title="Seleccionar Vendedor" onClose={() => setShowVendorModal(false)}>
                <View className="h-80">
                    <GenericList
                        items={vendors}
                        isLoading={loadingVendors}
                        onRefresh={loadVendors}
                        renderItem={(item: UserProfile) => (
                            <TouchableOpacity
                                className="bg-white p-3 mb-2 rounded-xl border border-neutral-100 flex-row items-center"
                                onPress={() => handleAssignVendor(item)}
                            >
                                <View className="w-10 h-10 rounded-full bg-red-50 mr-3 items-center justify-center border border-red-100">
                                    <Text className="text-red-500 font-bold">{item.name.charAt(0)}</Text>
                                </View>
                                <View>
                                    <Text className="font-bold text-neutral-800">{item.name}</Text>
                                    <Text className="text-xs text-neutral-500">{item.email}</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                        emptyState={{ icon: 'people', title: 'Sin Vendedores', message: 'No se encontraron vendedores.' }}
                    />
                </View>
            </GenericModal>

            <FeedbackModal
                visible={feedback.visible}
                type={feedback.type}
                title={feedback.type === 'success' ? 'Éxito' : 'Error'}
                message={feedback.message}
                onClose={() => {
                    setFeedback({ ...feedback, visible: false })
                }}
            />
        </View>
    )
}

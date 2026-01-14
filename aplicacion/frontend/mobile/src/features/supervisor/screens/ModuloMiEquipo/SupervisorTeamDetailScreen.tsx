import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Switch, TextInput, ActivityIndicator, Alert } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Header } from '../../../../components/ui/Header'
import { BRAND_COLORS } from '../../../../shared/types'
import { Ionicons } from '@expo/vector-icons'
import { UserProfile, UserService } from '../../../../services/api/UserService'
import { ZoneService, Zone } from '../../../../services/api/ZoneService'
import { AssignmentService } from '../../../../services/api/AssignmentService'
import { GenericModal } from '../../../../components/ui/GenericModal'
import { GenericList } from '../../../../components/ui/GenericList'
import { FeedbackModal, FeedbackType } from '../../../../components/ui/FeedbackModal'

export function SupervisorTeamDetailScreen() {
    const navigation = useNavigation()
    const route = useRoute<any>()
    const { user } = route.params as { user: UserProfile | null }
    const isEditing = !!user

    // Form State
    const [name, setName] = useState(user?.name || '')
    const [email, setEmail] = useState(user?.email || '')
    const [password, setPassword] = useState('') // Only for creation
    const [isPasswordVisible, setIsPasswordVisible] = useState(false)
    const [role, setRole] = useState(user?.role || 'vendedor') // Default to 'vendedor'
    const [isActive, setIsActive] = useState(user ? user.active : true) // Initialize with user.active

    // Zone Assignment State (Only for Vendors)
    const [zones, setZones] = useState<Zone[]>([])
    const [selectedZone, setSelectedZone] = useState<Zone | null>(null)
    const [currentAssignmentId, setCurrentAssignmentId] = useState<number | null>(null)
    const [occupiedZones, setOccupiedZones] = useState<Map<number, string>>(new Map()) // ZoneID -> VendorName

    // UI State
    const [showRoleModal, setShowRoleModal] = useState(false)
    const [showZoneModal, setShowZoneModal] = useState(false)
    const [loading, setLoading] = useState(false)
    const [initializing, setInitializing] = useState(true)

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
    const [deleteModalVisible, setDeleteModalVisible] = useState(false)

    // Roles map
    const roles = [
        { id: '1', name: 'admin', label: 'Administrador' },
        { id: '2', name: 'supervisor', label: 'Supervisor' },
        { id: '3', name: 'bodeguero', label: 'Bodeguero' },
        { id: '4', name: 'vendedor', label: 'Vendedor' },
        { id: '5', name: 'transportista', label: 'Transportista' },
    ]

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setInitializing(true)
        try {
            const [allZones, allAssignments, allUsers] = await Promise.all([
                ZoneService.getZones(),
                AssignmentService.getAllAssignments(),
                UserService.getUsers()
            ])
            setZones(allZones)

            // Map Users for quick lookup
            const userMap = new Map<string, string>()
            allUsers.forEach(u => userMap.set(u.id, u.name))

            // Identify Occupied Zones (Assignments where es_principal is true AND active)
            const occupied = new Map<number, string>()
            allAssignments.forEach(a => {
                // Backend rule: es_principal=true AND fecha_fin IS NULL AND deleted_at IS NULL
                // Ensure we respect deleted_at and fecha_fin
                const isActive = (a.es_principal === true || String(a.es_principal) === 'true')
                    && !a.fecha_fin
                    && !a.deleted_at

                if (isActive) {
                    const vendorName = a.nombre_vendedor_cache || userMap.get(a.vendedor_usuario_id) || 'Otro Vendedor'
                    occupied.set(Number(a.zona_id), vendorName)
                }
            })
            setOccupiedZones(occupied)

            // If editing a Vendor, set current selection
            if (isEditing && user && user.role.toLowerCase() === 'vendedor') {
                // Find MY active assignment
                const myAssignment = allAssignments.find(a => {
                    const isActive = (a.es_principal === true || String(a.es_principal) === 'true') && !a.fecha_fin && !a.deleted_at
                    const isMe = String(a.vendedor_usuario_id).toLowerCase() === String(user.id).toLowerCase()
                    return isMe && isActive
                })

                if (myAssignment) {
                    const assignedZone = allZones.find(z => z.id === Number(myAssignment.zona_id))
                    if (assignedZone) setSelectedZone(assignedZone)
                    setCurrentAssignmentId(myAssignment.id)
                }
            }
        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setInitializing(false)
        }
    }

    const showFeedback = (type: FeedbackType, title: string, message: string, onConfirm?: () => void) => {
        setFeedbackModal({ visible: true, type, title, message, onConfirm })
    }

    const handleSave = async () => {
        if (!name.trim() || !email.trim()) {
            return showFeedback('warning', 'Faltan datos', 'Por favor completa nombre y correo.')
        }
        
        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email.trim())) {
            return showFeedback('warning', 'Email Inválido', 'Por favor ingresa un correo válido (ej: usuario@dominio.com)')
        }
        
        if (!isEditing && !password) {
            return showFeedback('warning', 'Faltan datos', 'La contraseña es obligatoria para nuevos usuarios.')
        }

        setLoading(true)
        try {
            const selectedRoleObj = roles.find(r => r.name.toLowerCase() === role.toLowerCase())
            const rolId = selectedRoleObj ? parseInt(selectedRoleObj.id) : 4 // Default Vendedor

            let targetUserId = user?.id

            if (isEditing && user) {
                // UPDATE USER
                const payload: any = { activo: isActive }
                if (selectedRoleObj) payload.rolId = rolId
                if (name !== user.name) payload.nombre = name

                const result = await UserService.updateUser(user.id, payload)
                if (!result.success) throw new Error(result.message)

            } else {
                // CREATE USER
                const payload = {
                    nombre: name,
                    email: email,
                    password: password,
                    rolId: rolId
                }
                const result = await UserService.createUser(payload)
                if (!result.success || !result.userId) throw new Error(result.message)
                targetUserId = result.userId
            }

            // --- HANDLE ZONE ASSIGNMENT LOGIC ---
            const isVendedor = role.toLowerCase() === 'vendedor'
            const shouldHaveAssignment = isActive && isVendedor

            // 1. Release Zone if: User Deactivated OR Role changed from Vendedor
            if (!shouldHaveAssignment && currentAssignmentId) {
                await AssignmentService.removeAssignment(currentAssignmentId)
                setCurrentAssignmentId(null)
            }

            // 2. Create/Update Assignment if: Vendedor AND Active AND Zone Selected
            if (shouldHaveAssignment && targetUserId && selectedZone) {
                if (currentAssignmentId) {
                    // Update existing assignment (Move to new zone)
                    await AssignmentService.updateAssignment(currentAssignmentId, {
                        zona_id: selectedZone.id,
                        vendedor_usuario_id: targetUserId,
                        es_principal: true,
                        nombre_vendedor_cache: name
                    })
                } else {
                    // Create new assignment
                    await AssignmentService.assignVendor({
                        zona_id: selectedZone.id,
                        vendedor_usuario_id: targetUserId,
                        es_principal: true,
                        nombre_vendedor_cache: name
                    })
                }
            }

            showFeedback(
                'success',
                isEditing ? 'Empleado Actualizado' : 'Empleado Creado',
                isEditing ? 'Los cambios se han guardado exitosamente.' : 'El nuevo miembro ha sido agregado al equipo.',
                () => navigation.goBack()
            )

        } catch (error: any) {
            console.error(error)
            showFeedback('error', 'Error', error.message || 'Error al guardar cambios')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!user) return
        setLoading(true)
        setDeleteModalVisible(false)
        try {
            const result = await UserService.deleteUser(user.id)
            if (result.success) {
                showFeedback('success', 'Eliminado', 'Usuario eliminado correctamente', () => navigation.goBack())
            } else {
                showFeedback('error', 'Error', result.message || 'No se pudo eliminar')
            }
        } catch (error) {
            console.error(error)
            showFeedback('error', 'Error', 'Error al eliminar usuario')
        } finally {
            setLoading(false)
        }
    }

    if (initializing) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color={BRAND_COLORS.red} />
            </View>
        )
    }

    return (
        <View className="flex-1 bg-neutral-50">
            <Header
                title={isEditing ? 'Detalle del Empleado' : 'Nuevo Empleado'}
                variant="standard"
                onBackPress={() => navigation.goBack()}
            />

            <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>

                {/* Profile Header / Basic Info */}
                <View className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100 items-center mb-6">
                    <View className="w-24 h-24 rounded-full bg-red-50 items-center justify-center mb-4 border-2 border-red-100">
                        <Text className="text-red-500 font-bold text-4xl">
                            {name ? name.charAt(0).toUpperCase() : '?'}
                        </Text>
                    </View>

                    {/* Inputs for Name/Email */}
                    <View className="w-full">
                        <Text className="text-neutral-500 text-xs font-bold mb-1 uppercase">Nombre Completo</Text>
                        <TextInput
                            className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 mb-4 text-neutral-900 font-medium"
                            value={name}
                            onChangeText={setName}
                            placeholder="Ej: Juan Perez"
                        />

                        <Text className="text-neutral-500 text-xs font-bold mb-1 uppercase">Correo Electrónico</Text>
                        <TextInput
                            className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 mb-4 text-neutral-900"
                            value={email}
                            onChangeText={setEmail}
                            placeholder="ejemplo@correo.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            editable={!isEditing}
                        />

                        {!isEditing && (
                            <>
                                <Text className="text-neutral-500 text-xs font-bold mb-1 uppercase">Contraseña Temporal</Text>
                                <View className="flex-row items-center bg-neutral-50 rounded-xl border border-neutral-200 mb-2">
                                    <TextInput
                                        className="flex-1 p-4 text-neutral-900"
                                        value={password}
                                        onChangeText={setPassword}
                                        placeholder="********"
                                        secureTextEntry={!isPasswordVisible}
                                    />
                                    <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)} className="px-4">
                                        <Ionicons name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} size={24} color="#9ca3af" />
                                    </TouchableOpacity>
                                </View>
                                <TouchableOpacity
                                    onPress={() => setPassword('mipass123')}
                                    className="self-end mb-4 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100"
                                >
                                    <Text className="text-red-500 font-bold text-xs uppercase">
                                        Generar: mipass123
                                    </Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>

                    {isEditing && (
                        <View className={`px-4 py-1.5 rounded-full mt-2 ${isActive ? 'bg-green-100' : 'bg-red-100'}`}>
                            <Text className={`${isActive ? 'text-green-700' : 'text-red-700'} font-bold text-sm`}>
                                {isActive ? 'Activo' : 'Inactivo'}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Settings Section */}
                <View className="bg-white p-5 rounded-3xl shadow-sm border border-neutral-100 mb-20">
                    <Text className="text-neutral-900 font-bold text-lg mb-5 border-b border-neutral-100 pb-2">Configuración</Text>

                    {/* Role Selector */}
                    <Text className="text-neutral-500 font-medium mb-2">Rol Asignado</Text>
                    <TouchableOpacity
                        className="flex-row items-center justify-between p-4 bg-neutral-50 rounded-xl border border-neutral-200 mb-6"
                        onPress={() => setShowRoleModal(true)}
                    >
                        <View className="flex-row items-center">
                            <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center mr-3">
                                <Ionicons name="briefcase-outline" size={16} color="#3b82f6" />
                            </View>
                            <Text className="text-neutral-900 font-semibold uppercase">
                                {roles.find(r => r.name.toLowerCase() === role.toLowerCase())?.label || role}
                            </Text>
                        </View>
                        <Ionicons name="chevron-down" size={20} color="#9ca3af" />
                    </TouchableOpacity>

                    {/* Zone Selector (Only for Vendors) */}
                    {role.toLowerCase() === 'vendedor' && (
                        <View>
                            <Text className="text-neutral-500 font-medium mb-2">Zona Asignada</Text>
                            <TouchableOpacity
                                className="flex-row items-center justify-between p-4 bg-neutral-50 rounded-xl border border-neutral-200 mb-6"
                                onPress={() => setShowZoneModal(true)}
                            >
                                <View className="flex-row items-center">
                                    <View className="w-8 h-8 rounded-full bg-indigo-100 items-center justify-center mr-3">
                                        <Ionicons name="map-outline" size={16} color="#4f46e5" />
                                    </View>
                                    <Text className={selectedZone ? "text-neutral-900 font-semibold" : "text-neutral-400 italic"}>
                                        {selectedZone ? selectedZone.nombre : 'Seleccionar Zona...'}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-down" size={20} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Status Toggle - Only show if editing */}
                    {isEditing && (
                        <View className="flex-row items-center justify-between p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                            <View className="flex-row items-center">
                                <View className="w-8 h-8 rounded-full bg-orange-100 items-center justify-center mr-3">
                                    <Ionicons name="power-outline" size={16} color="orange" />
                                </View>
                                <View>
                                    <Text className="text-neutral-900 font-semibold">Estado de Cuenta</Text>
                                    <Text className="text-neutral-500 text-xs">Habilitar acceso al sistema</Text>
                                </View>
                            </View>
                            <Switch
                                value={isActive}
                                onValueChange={setIsActive}
                                trackColor={{ false: "#d1d5db", true: "#22c55e" }}
                            />
                        </View>
                    )}
                </View>

            </ScrollView>

            <View className="p-5 bg-white border-t border-neutral-100 pb-8">
                <TouchableOpacity
                    className="w-full py-4 rounded-xl items-center shadow-lg mb-3"
                    style={{ backgroundColor: BRAND_COLORS.red }}
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="white" /> : (
                        <Text className="text-white font-bold text-lg">{isEditing ? 'Guardar Cambios' : 'Crear Empleado'}</Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Role Selection Modal */}
            <GenericModal
                visible={showRoleModal}
                title="Seleccionar Rol"
                onClose={() => setShowRoleModal(false)}
            >
                <View className="h-64">
                    <GenericList
                        items={roles}
                        renderItem={(item: any) => (
                            <TouchableOpacity
                                className={`p-4 mb-2 rounded-xl flex-row items-center justify-between border ${role.toLowerCase() === item.name.toLowerCase() ? 'bg-red-50 border-red-200' : 'bg-white border-neutral-100'}`}
                                onPress={() => {
                                    setRole(item.name)
                                    setShowRoleModal(false)
                                }}
                            >
                                <Text className={`font-semibold ${role.toLowerCase() === item.name.toLowerCase() ? 'text-neutral-900' : 'text-neutral-700'}`}>
                                    {item.label}
                                </Text>
                                {role.toLowerCase() === item.name.toLowerCase() && <Ionicons name="checkmark-circle" size={22} color="#ef4444" />}
                            </TouchableOpacity>
                        )}
                        isLoading={false}
                        onRefresh={() => { }}
                        emptyState={{ icon: 'alert-circle-outline', title: 'Sin Roles', message: 'No hay roles disponibles.' }}
                    />
                </View>
            </GenericModal>

            {/* Zone Selection Modal */}
            <GenericModal
                visible={showZoneModal}
                title="Seleccionar Zona"
                onClose={() => setShowZoneModal(false)}
            >
                <View className="h-96">
                    <GenericList
                        items={zones}
                        renderItem={(item: Zone) => {
                            // Check if zone is occupied by SOMEONE ELSE
                            const occupiedBy = occupiedZones.get(item.id)
                            const isMyZone = selectedZone?.id === item.id
                            const isOccupied = !!occupiedBy

                            return (
                                <TouchableOpacity
                                    className={`p-4 mb-2 rounded-xl flex-row items-center justify-between border ${selectedZone?.id === item.id ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-neutral-100'} ${isOccupied && !isMyZone ? 'opacity-70 bg-gray-50' : ''}`}
                                    onPress={() => {
                                        if (isOccupied && !isMyZone) {
                                            showFeedback('warning', 'Zona Ocupada', `Esta zona ya está asignada a: ${occupiedBy}. No se puede seleccionar.`)
                                            return
                                        }
                                        setSelectedZone(item)
                                        setShowZoneModal(false)
                                    }}
                                >
                                    <View className="flex-1">
                                        <Text className={`font-semibold ${selectedZone?.id === item.id ? 'text-indigo-900' : 'text-neutral-900'}`}>
                                            {item.nombre}
                                        </Text>
                                        <Text className="text-xs text-neutral-500">{item.ciudad} - {item.codigo}</Text>
                                        {isOccupied && !isMyZone && (
                                            <Text className="text-xs text-orange-500 font-bold mt-1">
                                                🔒 Ocupado por: {occupiedBy}
                                            </Text>
                                        )}
                                        {isMyZone && (
                                            <Text className="text-xs text-indigo-600 font-bold mt-1">
                                                ✅ Asignada actualmente
                                            </Text>
                                        )}
                                    </View>
                                    {selectedZone?.id === item.id && <Ionicons name="checkmark-circle" size={22} color="#4f46e5" />}
                                </TouchableOpacity>
                            )
                        }}
                        isLoading={false}
                        onRefresh={() => { }}
                        emptyState={{ icon: 'map-outline', title: 'Sin Zonas', message: 'No hay zonas registradas.' }}
                    />
                </View>
            </GenericModal>

            {/* Confirmation Delete Modal */}
            <FeedbackModal
                visible={deleteModalVisible}
                type="warning"
                title="Eliminar Usuario"
                message="¿Estás seguro de que deseas eliminar a este usuario? Esta acción no se puede deshacer."
                onClose={() => setDeleteModalVisible(false)}
                onConfirm={handleDelete}
                showCancel={true}
                confirmText="Eliminar"
            />

            {/* General Feedback Modal */}
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

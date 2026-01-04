
import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Switch, TextInput } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Header } from '../../../components/ui/Header'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { Ionicons } from '@expo/vector-icons'
import { UserProfile, UserService } from '../../../services/api/UserService'
import { GenericModal } from '../../../components/ui/GenericModal'
import { GenericList } from '../../../components/ui/GenericList'
import { FeedbackModal } from '../../../components/ui/FeedbackModal'

export function SupervisorTeamDetailScreen() {
    const navigation = useNavigation()
    const route = useRoute<any>()
    const { user } = route.params as { user: UserProfile }

    const [role, setRole] = useState(user.role)
    const [isActive, setIsActive] = useState(true) // Default true until we fetch real status if available
    const [showRoleModal, setShowRoleModal] = useState(false)
    const [loading, setLoading] = useState(false)
    const [feedbackVisible, setFeedbackVisible] = useState(false)

    // Mock Roles
    // Roles from auth_db schema
    const roles = [
        { id: '1', name: 'admin', label: 'Administrador' },
        { id: '2', name: 'supervisor', label: 'Supervisor' },
        { id: '3', name: 'bodeguero', label: 'Bodeguero' },
        { id: '4', name: 'vendedor', label: 'Vendedor' },
        { id: '5', name: 'transportista', label: 'Transportista' },
    ]

    const [deleteModalVisible, setDeleteModalVisible] = useState(false)

    const handleSave = async () => {
        setLoading(true)
        try {
            // Map role name to ID from our hardcoded list for now, or ensure backend accepts names. 
            // DB schema says 'rol_id' (int). Our list has IDs.
            const selectedRole = roles.find(r => r.name === role)

            const payload: any = {
                activo: isActive
            }

            if (selectedRole) {
                payload.rolId = parseInt(selectedRole.id)
            }

            const result = await UserService.updateUser(user.id, payload)

            if (result.success) {
                setFeedbackVisible(true)
            } else {
                alert('Error: ' + result.message)
            }
        } catch (error) {
            console.error(error)
            alert('Error al guardar cambios')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        setLoading(true)
        setDeleteModalVisible(false) // Close modal first
        try {
            const result = await UserService.deleteUser(user.id)
            if (result.success) {
                // Show success feedback then navigate back
                setFeedbackVisible(true) // We can reuse or make a specific one
            } else {
                alert('Error al eliminar: ' + result.message)
            }
        } catch (error) {
            console.error(error)
            alert('Error al eliminar usuario')
        } finally {
            setLoading(false)
        }
    }

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Detalle del Empleado" variant="standard" onBackPress={() => navigation.goBack()} />

            <ScrollView className="flex-1 px-5 pt-6">

                {/* Profile Header Card */}
                <View className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100 items-center mb-6">
                    <View className="w-24 h-24 rounded-full bg-red-50 items-center justify-center mb-4 border-2 border-red-100">
                        <Text className="text-red-500 font-bold text-4xl">{user.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text className="text-2xl font-bold text-neutral-900 mb-1 text-center">{user.name}</Text>
                    <Text className="text-neutral-500 font-medium mb-4">{user.email}</Text>

                    <View className={`px-4 py-1.5 rounded-full ${isActive ? 'bg-green-100' : 'bg-red-100'}`}>
                        <Text className={`${isActive ? 'text-green-700' : 'text-red-700'} font-bold text-sm`}>
                            {isActive ? 'Activo' : 'Inactivo'}
                        </Text>
                    </View>
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
                                {roles.find(r => r.name === role)?.label || role}
                            </Text>
                        </View>
                        <Ionicons name="chevron-down" size={20} color="#9ca3af" />
                    </TouchableOpacity>

                    {/* Status Toggle */}
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
                </View>

            </ScrollView>

            <View className="p-5 bg-white border-t border-neutral-100 pb-8">
                <TouchableOpacity
                    className="w-full py-4 rounded-xl items-center shadow-lg mb-3"
                    style={{ backgroundColor: BRAND_COLORS.red }}
                    onPress={handleSave}
                >
                    <Text className="text-white font-bold text-lg">{loading ? 'Guardando...' : 'Guardar Cambios'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className="w-full py-3 items-center"
                    onPress={() => setDeleteModalVisible(true)}
                >
                    <Text className="text-red-500 font-semibold">Eliminar Empleado</Text>
                </TouchableOpacity>
            </View>

            {/* Role Selection Modal */}
            <GenericModal
                visible={showRoleModal}
                title="Cambiar Rol"
                onClose={() => setShowRoleModal(false)}
            >
                <View className="h-64">
                    <GenericList
                        items={roles}
                        renderItem={(item: any) => (
                            <TouchableOpacity
                                className={`p-4 mb-2 rounded-xl flex-row items-center justify-between border ${role === item.name ? 'bg-red-50 border-red-200' : 'bg-white border-neutral-100'}`}
                                onPress={() => {
                                    setRole(item.name)
                                    setShowRoleModal(false)
                                }}
                            >
                                <Text className={`font-semibold ${role === item.name ? 'text-neutral-900' : 'text-neutral-700'}`}>
                                    {item.label}
                                </Text>
                                {role === item.name && <Ionicons name="checkmark-circle" size={22} color="#ef4444" />}
                            </TouchableOpacity>
                        )}
                        isLoading={false}
                        onRefresh={() => { }}
                        emptyState={{
                            icon: 'alert-circle-outline',
                            title: 'Sin Roles',
                            message: 'No hay roles disponibles.'
                        }}
                    />
                </View>
            </GenericModal>

            {/* Confirmation Delete Modal */}
            <GenericModal
                visible={deleteModalVisible}
                title="Eliminar Usuario"
                onClose={() => setDeleteModalVisible(false)}
            >
                <View className="p-4">
                    <Text className="text-neutral-600 mb-6 text-center">
                        ¿Estás seguro de que deseas eliminar a este usuario? Esta acción no se puede deshacer.
                    </Text>
                    <View className="flex-row justify-between space-x-3">
                        <TouchableOpacity
                            className="flex-1 py-3 bg-neutral-100 rounded-xl items-center"
                            onPress={() => setDeleteModalVisible(false)}
                        >
                            <Text className="font-semibold text-neutral-700">Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="flex-1 py-3 bg-red-100 rounded-xl items-center"
                            onPress={handleDelete}
                        >
                            <Text className="font-semibold text-red-600">Eliminar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </GenericModal>


            <FeedbackModal
                visible={feedbackVisible}
                type="success"
                title="Empleado Actualizado"
                message="Los cambios se han guardado exitosamente."
                onClose={() => {
                    setFeedbackVisible(false)
                    navigation.goBack()
                }}
            />
        </View>
    )
}

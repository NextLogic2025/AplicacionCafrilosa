import { Ionicons } from '@expo/vector-icons'
import React, { useState, useCallback } from 'react'
import { View, StyleSheet, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { GenericList } from '../../../components/ui/GenericList'
import { GenericModal } from '../../../components/ui/GenericModal'
import { CategoryFilter } from '../../../components/ui/CategoryFilter'
import { UserService, UserProfile, CreateUserPayload } from '../../../services/api/UserService'
import { useToast } from '../../../context/ToastContext'
import { Header } from '../../../components/ui/Header'
import { SearchBar } from '../../../components/ui/SearchBar'
import { BRAND_COLORS } from '@cafrilosa/shared-types'

export const SupervisorTeamScreen = () => {
    const navigation = useNavigation()
    const { showToast } = useToast()

    // Data State
    const [users, setUsers] = useState<UserProfile[]>([])
    const [loading, setLoading] = useState(false)

    // Filter State
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedRoleFilter, setSelectedRoleFilter] = useState<number | string>('all')

    // Modal State
    const [modalVisible, setModalVisible] = useState(false)

    // Create User Form State
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [rolId, setRolId] = useState(5) // Default to Vendedor

    const fetchUsers = async () => {
        setLoading(true)
        const data = await UserService.getUsers()
        setUsers(data)
        setLoading(false)
    }

    useFocusEffect(
        useCallback(() => {
            fetchUsers()
        }, [])
    )

    // Filter Logic
    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase())

        let matchesRole = true
        if (selectedRoleFilter !== 'all') {
            // Mapping numeric IDs to role names for filtering (assuming user.role is string like 'Supervisor')
            // This is a naive client-side mapping. Ideally backend sends ID or consistent string.
            // For now, if role filter is active, we check if user.role string includes the selected filter name or ID logic.
            // Since `user.role` is a string (e.g. "Vendedor"), and selectedRoleFilter is ID (e.g. 4), 
            // we might need a map. Let's try to match loosely or use the logic if available.
            // For this stub, we might just skip strict filtering if data is mock/empty, but let's do:
            const roleMap: Record<number, string> = {
                2: 'Supervisor',
                3: 'Bodeguero',
                4: 'Vendedor',
                5: 'Transportista'
            }
            const expectedRole = roleMap[selectedRoleFilter as number]
            if (expectedRole) {
                matchesRole = user.role === expectedRole
            }
        }

        return matchesSearch && matchesRole
    })

    const handleOpenModal = () => {
        setName('')
        setEmail('')
        setPassword('')
        setRolId(5)
        setModalVisible(true)
    }

    const handleCreateUser = async () => {
        if (!name || !email || !password) {
            showToast('Complete todos los campos', 'warning')
            return
        }

        setLoading(true)
        const payload: CreateUserPayload = {
            nombre: name,
            email: email,
            password: password,
            rolId: rolId
        }

        const result = await UserService.createUser(payload)
        setLoading(false)

        if (result.success) {
            showToast('Usuario creado exitosamente', 'success')
            setModalVisible(false)
            fetchUsers()
        } else {
            showToast(result.message || 'Error al crear', 'error')
        }
    }

    const renderItem = (item: UserProfile) => (
        <View style={styles.card}>
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.role}>{item.role}</Text>
                <Text style={styles.email}>{item.email}</Text>
            </View>
            <View style={styles.status}>
                <MaterialCommunityIcons name="check-circle" size={20} color={BRAND_COLORS.red || '#D50000'} />
            </View>
        </View>
    )

    return (
        <View className="flex-1 bg-neutral-50">
            <Header
                title="Mi Equipo"
                variant="standard"
                showNotification={true}
                onBackPress={() => navigation.goBack()}
            />

            {/* Filter & Action Section */}
            <View className="px-5 pt-4 pb-2 bg-white shadow-sm z-10">
                {/* Search and Create Button Row */}
                <View className="flex-row gap-3 mb-4">
                    <View className="flex-1">

                        <View className="flex-1">
                            <SearchBar
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                placeholder="Buscar miembro..."
                                onClear={() => setSearchQuery('')}
                            />
                        </View>
                    </View>
                    <TouchableOpacity
                        className="h-12 w-12 bg-brand-red rounded-xl items-center justify-center shadow-sm"
                        style={{ backgroundColor: BRAND_COLORS.red || '#EF4444' }}
                        onPress={() => handleOpenModal()}
                    >
                        <Ionicons name="person-add-outline" size={24} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Category Filter for Roles */}
                <View className="pb-2">
                    <CategoryFilter
                        categories={[
                            { id: 'all', name: 'Todos' },
                            { id: 2, name: 'Supervisor' },
                            { id: 3, name: 'Bodeguero' },
                            { id: 4, name: 'Vendedor' },
                            { id: 5, name: 'Transportista' },
                        ]}
                        selectedId={selectedRoleFilter}
                        onSelect={(id) => setSelectedRoleFilter(id)}
                    />
                </View>
            </View>

            <GenericList
                items={filteredUsers}
                isLoading={loading}
                onRefresh={fetchUsers}
                renderItem={renderItem}
                emptyState={{
                    icon: 'people-outline',
                    title: 'Sin Miembros',
                    message: loading ? 'Cargando equipo...' : 'No hay usuarios registrados en tu equipo.'
                }}
            />

            {/* Modal Create User */}
            <GenericModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                title="Nuevo Integrante"
            >
                <Text className="font-semibold text-neutral-700 mb-2">Nombre Completo</Text>
                <TextInput
                    className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 mb-4 text-base"
                    placeholder="Ej: Juan Pérez"
                    value={name}
                    onChangeText={setName}
                />

                <Text className="font-semibold text-neutral-700 mb-2">Correo Electrónico</Text>
                <TextInput
                    className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 mb-4 text-base"
                    placeholder="correo@ejemplo.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                />

                <Text className="font-semibold text-neutral-700 mb-2">Contraseña Temporal</Text>
                <TextInput
                    className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 mb-4 text-base"
                    placeholder="******"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />

                <Text className="font-semibold text-neutral-700 mb-2">Rol</Text>
                <View className="flex-row flex-wrap gap-2 mb-6">
                    {[
                        { id: 2, label: 'Supervisor' },
                        { id: 3, label: 'Bodeguero' },
                        { id: 4, label: 'Vendedor' },
                        { id: 5, label: 'Transportista' }
                    ].map((role) => (
                        <TouchableOpacity
                            key={role.id}
                            onPress={() => setRolId(role.id)}
                            className={`px-4 py-2 rounded-full border ${rolId === role.id ? 'bg-brand-red border-brand-red' : 'bg-neutral-100 border-neutral-200'}`}
                            style={rolId === role.id ? { backgroundColor: BRAND_COLORS.red || '#EF4444' } : {}}
                        >
                            <Text className={`font-medium ${rolId === role.id ? 'text-white' : 'text-neutral-600'}`}>
                                {role.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity
                    className="bg-brand-red p-4 rounded-xl items-center shadow-lg shadow-red-500/30"
                    onPress={handleCreateUser}
                    style={{ backgroundColor: BRAND_COLORS.red || '#EF4444' }}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-bold text-lg">Crear Usuario</Text>
                    )}
                </TouchableOpacity>
            </GenericModal>
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5' },
    content: { flex: 1, padding: 0 }, // GenericList has its own padding
    card: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 2
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#EEE',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16
    },
    avatarText: { fontSize: 20, fontWeight: 'bold', color: '#666' },
    info: { flex: 1 },
    name: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    role: { fontSize: 14, color: '#D50000', marginTop: 2 },
    email: { fontSize: 12, color: '#999', marginTop: 2 },
    status: { justifyContent: 'center' },

    // Form
    form: { width: '100%' },
    label: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 4, marginTop: 12 },
    input: {
        backgroundColor: '#F9F9F9',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        padding: 12,
        fontSize: 16
    },
    roleContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
    roleChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#EEE' },
    roleChipActive: { backgroundColor: '#D50000' },
    roleText: { color: '#666' },
    roleTextActive: { color: '#FFF', fontWeight: 'bold' },
    submitButton: {
        backgroundColor: '#D50000',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 24
    },
    submitButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
})

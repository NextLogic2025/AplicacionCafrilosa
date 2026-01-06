
import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { Header } from '../../../components/ui/Header'
import { GenericList } from '../../../components/ui/GenericList'
import { SearchBar } from '../../../components/ui/SearchBar'
import { CategoryFilter } from '../../../components/ui/CategoryFilter'
import { UserService, UserProfile } from '../../../services/api/UserService'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { Ionicons } from '@expo/vector-icons'

export function SupervisorTeamScreen() {
    const navigation = useNavigation<any>()
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedRole, setSelectedRole] = useState('Todos')
    const [employees, setEmployees] = useState<UserProfile[]>([])
    const [loading, setLoading] = useState(false)
    const [filteredEmployees, setFilteredEmployees] = useState<UserProfile[]>([])

    const roles = ['Todos', 'Supervisor', 'Vendedor', 'Bodeguero', 'Transportista']

    const fetchEmployees = async () => {
        setLoading(true)
        try {
            const users = await UserService.getUsers()
            setEmployees(users)
            setFilteredEmployees(users)
        } catch (error) {
            console.error('Error fetching employees:', error)
        } finally {
            setLoading(false)
        }
    }

    useFocusEffect(
        React.useCallback(() => {
            fetchEmployees()
        }, [])
    )

    useEffect(() => {
        let result = employees

        // Filter by Role
        if (selectedRole !== 'Todos') {
            result = result.filter(u => u.role.toLowerCase() === selectedRole.toLowerCase())
        }

        // Filter by Search
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter(u =>
                u.name.toLowerCase().includes(query) ||
                u.email.toLowerCase().includes(query)
            )
        }

        setFilteredEmployees(result)
    }, [searchQuery, selectedRole, employees])

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Mi Equipo" variant="standard" onBackPress={() => navigation.goBack()} />

            <View className="px-5 py-4 bg-white shadow-sm z-10">
                <View className="flex-row items-center mb-3">
                    <View className="flex-1 mr-3">
                        <SearchBar
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="Buscar miembro..."
                            onClear={() => setSearchQuery('')}
                        />
                    </View>
                    <TouchableOpacity
                        className="w-12 h-12 rounded-xl items-center justify-center shadow-sm"
                        style={{ backgroundColor: BRAND_COLORS.red }}
                        onPress={() => navigation.navigate('SupervisorTeamDetail', { user: null })}
                    >
                        <Ionicons name="add" size={24} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Filter Chips - Horizontal Scroll via CategoryFilter */}
                <View className="mb-2">
                    <CategoryFilter
                        categories={roles.map(r => ({ id: r, name: r }))}
                        selectedId={selectedRole}
                        onSelect={(id) => setSelectedRole(String(id))}
                    />
                </View>
            </View>

            <GenericList
                items={filteredEmployees}
                onRefresh={fetchEmployees}
                isLoading={loading}
                renderItem={(item: UserProfile) => (
                    <TouchableOpacity
                        className="bg-white p-4 mb-3 rounded-2xl border border-neutral-100 flex-row items-center shadow-sm"
                        onPress={() => navigation.navigate('SupervisorTeamDetail', { user: item })}
                    >
                        {/* Avatar */}
                        <View className="w-12 h-12 rounded-full bg-red-50 items-center justify-center mr-4 border border-red-100">
                            {item.photoUrl ? (
                                <Text>IMG</Text>
                            ) : (
                                <Text className="text-red-500 font-bold text-lg">{item.name.charAt(0).toUpperCase()}</Text>
                            )}
                        </View>

                        <View className="flex-1">
                            <Text className="font-bold text-neutral-900 text-base">{item.name}</Text>
                            <Text className="text-neutral-500 text-sm capitalize">{item.role}</Text>
                        </View>

                        {/* Status Indicator */}
                        {item.active ? (
                            <View className="bg-green-100 px-2 py-1 rounded-full">
                                <Text className="text-green-700 text-xs font-medium">Activo</Text>
                            </View>
                        ) : (
                            <View className="bg-red-100 px-2 py-1 rounded-full">
                                <Text className="text-red-700 text-xs font-medium">Inactivo</Text>
                            </View>
                        )}

                        <Ionicons name="chevron-forward" size={20} color="#9ca3af" className="ml-2" />
                    </TouchableOpacity>
                )}
                emptyState={{
                    icon: 'people-outline',
                    title: 'Sin Resultados',
                    message: 'No se encontraron miembros con los filtros actuales.'
                }}
            />
        </View>
    )
}

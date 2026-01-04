
import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Header } from '../../../components/ui/Header'
import { GenericList } from '../../../components/ui/GenericList'
import { UserService, UserProfile } from '../../../services/api/UserService'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { Ionicons } from '@expo/vector-icons'

export function SupervisorTeamScreen() {
    const navigation = useNavigation<any>()
    const [employees, setEmployees] = useState<UserProfile[]>([])
    const [loading, setLoading] = useState(false)

    const fetchEmployees = async () => {
        setLoading(true)
        try {
            const users = await UserService.getUsers()
            // Backend endpoint 'getUsers' specifically returns users excluding 'cliente' role
            // We can double check filtering if needed, but backend handles it.
            setEmployees(users)
        } catch (error) {
            console.error('Error fetching employees:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchEmployees()
    }, [])

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Mi Equipo" variant="standard" onBackPress={() => navigation.goBack()} />

            <View className="flex-1 px-4 pt-4">
                <GenericList
                    items={employees}
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
                                    <Text>IMG</Text> // Todo: Implement Image
                                ) : (
                                    <Text className="text-red-500 font-bold text-lg">{item.name.charAt(0).toUpperCase()}</Text>
                                )}
                            </View>

                            <View className="flex-1">
                                <Text className="font-bold text-neutral-900 text-base">{item.name}</Text>
                                <Text className="text-neutral-500 text-sm">{item.role}</Text>
                            </View>

                            {/* Status Indicator */}
                            {/* Assuming we might have filtering or active status in future, generic 'active' design for now */}
                            <View className="bg-green-100 px-2 py-1 rounded-full">
                                <Text className="text-green-700 text-xs font-medium">Activo</Text>
                            </View>

                            <Ionicons name="chevron-forward" size={20} color="#9ca3af" className="ml-2" />
                        </TouchableOpacity>
                    )}
                    emptyState={{
                        icon: 'people-outline',
                        title: 'Sin Empleados',
                        message: 'No se encontraron miembros del equipo.'
                    }}
                />
            </View>

            {/* FAB to add potentially? Or just list? User didn't explicitly ask for creation here, but usually yes. 
               For now sticking to List + Detail as requested.
            */}
        </View>
    )
}

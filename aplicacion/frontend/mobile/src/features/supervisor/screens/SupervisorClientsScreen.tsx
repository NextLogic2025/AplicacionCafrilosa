import React, { useState, useCallback } from 'react'
import { View, Text, TouchableOpacity, Alert } from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '@cafrilosa/shared-types'

import { Header } from '../../../components/ui/Header'
import { GenericList } from '../../../components/ui/GenericList'
import { SupervisorService, type SupervisorClient } from '../../../services/api/SupervisorService'

export function SupervisorClientsScreen() {
    const navigation = useNavigation()
    const [clients, setClients] = useState<SupervisorClient[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const loadClients = async () => {
        try {
            setIsLoading(true)
            const data = await SupervisorService.getClients()
            setClients(data)
        } catch (error) {
            console.error('Error loading clients', error)
        } finally {
            setIsLoading(false)
        }
    }

    useFocusEffect(useCallback(() => { loadClients() }, []))

    const handleAction = (id: string, action: 'block' | 'unlock' | 'validate') => {
        // Placeholder for future logic
        console.log('Client Action:', action, id)
    }

    const renderItem = (item: SupervisorClient) => (
        <View className="bg-white p-4 rounded-xl border border-neutral-200 mb-3 shadow-sm">
            <View className="flex-row justify-between items-start mb-2">
                <View>
                    <Text className="font-bold text-neutral-900 text-base">{item.name}</Text>
                    <Text className="text-xs text-neutral-500">{item.address}</Text>
                </View>
                <View className={`px-2 py-1 rounded ${item.status === 'active' ? 'bg-green-100' : item.status === 'blocked' ? 'bg-red-100' : 'bg-yellow-100'}`}>
                    <Text className={`text-xs font-bold uppercase ${item.status === 'active' ? 'text-green-700' : item.status === 'blocked' ? 'text-red-700' : 'text-yellow-700'}`}>
                        {item.status === 'active' ? 'Activo' : item.status === 'blocked' ? 'Bloqueado' : 'Pendiente'}
                    </Text>
                </View>
            </View>

            <View className="flex-row items-center mb-3">
                <Ionicons name="person-outline" size={14} color="gray" />
                <Text className="text-sm text-neutral-600 ml-1">Vendedor: {item.sellerName}</Text>
            </View>

            <View className="flex-row gap-2 pt-2 border-t border-neutral-100">
                {item.status === 'pending_validation' ? (
                    <TouchableOpacity
                        className="flex-1 py-2 bg-brand-red rounded-lg items-center"
                        onPress={() => handleAction(item.id, 'validate')}
                    >
                        <Text className="text-white font-bold text-xs">Validar Alta</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        className={`flex-1 py-2 border rounded-lg items-center ${item.status === 'blocked' ? 'border-green-600' : 'border-red-600'}`}
                        onPress={() => handleAction(item.id, item.status === 'blocked' ? 'unlock' : 'block')}
                    >
                        <Text className={`font-bold text-xs ${item.status === 'blocked' ? 'text-green-600' : 'text-red-600'}`}>
                            {item.status === 'blocked' ? 'Desbloquear' : 'Bloquear'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    )

    return (
        <View className="flex-1 bg-neutral-50">
            <Header
                title="Gestión de Clientes"
                variant="standard"
                showNotification={false}
                onBackPress={() => navigation.goBack()}
            />
            <GenericList
                items={clients}
                isLoading={isLoading}
                onRefresh={loadClients}
                renderItem={renderItem}
                emptyState={{
                    icon: 'people-outline',
                    title: 'Sin clientes',
                    message: 'No hay clientes para mostrar.'
                }}
            />
        </View>
    )
}

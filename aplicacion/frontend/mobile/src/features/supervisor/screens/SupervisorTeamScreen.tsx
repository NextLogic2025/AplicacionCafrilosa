import React, { useState, useCallback } from 'react'
import { View, Text, TouchableOpacity, Alert } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '@cafrilosa/shared-types'

import { Header } from '../../../components/ui/Header'
import { GenericList } from '../../../components/ui/GenericList'
import { SupervisorService, type SupervisorTeamMember } from '../../../services/api/SupervisorService'

export function SupervisorTeamScreen() {
    const [team, setTeam] = useState<SupervisorTeamMember[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const loadTeam = async () => {
        try {
            setIsLoading(true)
            const data = await SupervisorService.getTeamMembers()
            setTeam(data)
        } catch (error) {
            console.error('Error loading team', error)
        } finally {
            setIsLoading(false)
        }
    }

    useFocusEffect(useCallback(() => { loadTeam() }, []))

    const handleReassign = (id: string, type: 'routes' | 'clients') => {
        Alert.alert('Reasignar', `Reasignar ${type === 'routes' ? 'rutas' : 'clientes'} para este miembro.`, [{ text: 'OK' }])
    }

    const renderItem = (item: SupervisorTeamMember) => (
        <View className="bg-white p-4 rounded-xl border border-neutral-200 mb-3 shadow-sm">
            <View className="flex-row justify-between items-start mb-3">
                <View className="flex-row items-center">
                    <View className="w-10 h-10 bg-neutral-100 rounded-full items-center justify-center mr-3">
                        <Text className="font-bold text-neutral-600">{item.name.charAt(0)}</Text>
                    </View>
                    <View>
                        <Text className="font-bold text-neutral-900 text-base">{item.name}</Text>
                        <Text className="text-xs text-neutral-500">{item.role}</Text>
                    </View>
                </View>
                <View className={`px-2 py-1 rounded ${item.status === 'active' ? 'bg-green-100' : item.status === 'on_route' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <Text className={`text-xs font-bold ${item.status === 'active' ? 'text-green-700' : item.status === 'on_route' ? 'text-blue-700' : 'text-gray-700'}`}>
                        {item.status === 'active' ? 'ACTIVO' : item.status === 'on_route' ? 'EN RUTA' : 'INACTIVO'}
                    </Text>
                </View>
            </View>

            {/* Metrics */}
            <View className="flex-row justify-between bg-neutral-50 p-3 rounded-lg border border-neutral-100 mb-3">
                <View className="items-center">
                    <Text className="text-lg font-bold text-neutral-800">{item.metrics.completed}</Text>
                    <Text className="text-[10px] text-neutral-400 uppercase">Completados</Text>
                </View>
                <View className="w-px bg-neutral-200" />
                <View className="items-center">
                    <Text className="text-lg font-bold text-red-600">{item.metrics.incidents}</Text>
                    <Text className="text-[10px] text-neutral-400 uppercase">Incidencias</Text>
                </View>
                <View className="w-px bg-neutral-200" />
                <View className="items-center">
                    <Text className="text-lg font-bold text-green-600">{item.metrics.compliance}%</Text>
                    <Text className="text-[10px] text-neutral-400 uppercase">Cumplimiento</Text>
                </View>
            </View>

            <View className="flex-row justify-between items-center">
                <Text className="text-xs text-neutral-400 italic">Actividad: {item.lastActivity}</Text>
                <View className="flex-row gap-2">
                    <TouchableOpacity onPress={() => handleReassign(item.id, 'clients')}>
                        <Ionicons name="people-outline" size={20} color={BRAND_COLORS.gray} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleReassign(item.id, 'routes')}>
                        <Ionicons name="map-outline" size={20} color={BRAND_COLORS.gray} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    )

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Mi Equipo" variant="standard" showNotification={false} />
            <GenericList
                items={team}
                isLoading={isLoading}
                onRefresh={loadTeam}
                renderItem={renderItem}
                emptyState={{
                    icon: 'people-outline',
                    title: 'Sin Equipo',
                    message: 'No tienes personal asignado.'
                }}
            />
        </View>
    )
}

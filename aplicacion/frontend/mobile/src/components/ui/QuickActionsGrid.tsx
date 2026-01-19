/// <reference types="nativewind/types" />
import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'

export function QuickActionsGrid() {
    const navigation = useNavigation<any>()

    const actions = [
        {
            label: 'Aprobar Pedidos',
            icon: 'checkmark-done-circle-outline',
            color: '#10B981',
            onPress: () => navigation.navigate('Pedidos'),
        },
        {
            label: 'Almacenes',
            icon: 'business-outline',
            color: '#EF4444',
            onPress: () => navigation.navigate('SupervisorAlmacenes'),
        },
        {
            label: 'Reporte',
            icon: 'stats-chart-outline',
            color: '#6366F1',
            onPress: () => navigation.navigate('SupervisorReports'),
        },
        {
            label: 'Lotes',
            icon: 'cube-outline',
            color: '#F97316',
            onPress: () => navigation.navigate('SupervisorLotes'),
        },
        {
            label: 'Stock',
            icon: 'analytics-outline',
            color: '#0EA5E9',
            onPress: () => navigation.navigate('SupervisorStock'),
        },
        {
            label: 'Picking',
            icon: 'clipboard-outline',
            color: '#22C55E',
            onPress: () => navigation.navigate('SupervisorPickingList'),
        },
        {
            label: 'Reservas',
            icon: 'lock-closed-outline',
            color: '#F59E0B',
            onPress: () => navigation.navigate('SupervisorReservations'),
        },
    ]

    return (
        <View className="mb-6">
            <Text className="text-lg font-bold text-neutral-800 mb-3 px-1">Accesos Rapidos</Text>
            <View className="flex-row flex-wrap justify-between">
                {actions.map((action, index) => (
                    <TouchableOpacity
                        key={index}
                        className="bg-white p-3 rounded-xl border border-neutral-200 mb-3 shadow-sm items-center justify-center w-[31%]"
                        onPress={action.onPress}
                        activeOpacity={0.7}
                        style={{ aspectRatio: 1 }}
                    >
                        <View
                            className="w-12 h-12 rounded-full items-center justify-center mb-2"
                            style={{ backgroundColor: `${action.color}15` }}
                        >
                            <Ionicons name={action.icon as any} size={24} color={action.color} />
                        </View>
                        <Text className="text-xs text-center font-bold text-neutral-700 leading-tight">{action.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    )
}

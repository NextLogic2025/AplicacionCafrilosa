import React, { useState } from 'react'
import { View, Text, TouchableOpacity, Alert } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Header } from '../../../components/ui/Header'
import { GenericList } from '../../../components/ui/GenericList'

const MOCK_ZONES = [
    { id: 1, name: 'Zona Norte', code: 'ZN-01', city: 'Quito', active: true },
    { id: 2, name: 'Zona Centro', code: 'ZC-02', city: 'Quito', active: true },
    { id: 3, name: 'Zona Sur', code: 'ZS-03', city: 'Quito', active: true },
    { id: 4, name: 'Valles', code: 'VA-04', city: 'Cumbayá', active: true },
]

export function SupervisorZonesScreen() {
    const navigation = useNavigation()
    const [zones] = useState(MOCK_ZONES)

    const renderItem = (item: typeof MOCK_ZONES[0]) => (
        <TouchableOpacity
            className="flex-row items-center bg-white p-4 mb-3 rounded-xl shadow-sm border border-neutral-100"
            activeOpacity={0.7}
            onPress={() => Alert.alert('Detalle', `Gestionar Zona ${item.name}`)}
        >
            <View className="w-12 h-12 bg-violet-50 rounded-lg items-center justify-center mr-4">
                <Ionicons name="map-outline" size={24} color="#7C3AED" />
            </View>
            <View className="flex-1">
                <Text className="font-bold text-neutral-900 text-lg">{item.name}</Text>
                <Text className="text-neutral-500 text-sm">{item.city} ({item.code})</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
        </TouchableOpacity>
    )

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Zonas Comerciales" variant="standard" onBackPress={() => navigation.goBack()} />

            <GenericList
                items={zones}
                isLoading={false}
                onRefresh={() => { }}
                renderItem={renderItem}
                emptyState={{
                    icon: 'map-outline',
                    title: 'Sin Zonas',
                    message: 'No hay zonas configuradas.'
                }}
            />
        </View>
    )
}

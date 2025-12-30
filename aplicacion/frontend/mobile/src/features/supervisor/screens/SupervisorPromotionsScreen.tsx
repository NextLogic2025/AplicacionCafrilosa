import React, { useState } from 'react'
import { View, Text, TouchableOpacity, Alert } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Header } from '../../../components/ui/Header'
import { GenericList } from '../../../components/ui/GenericList'

const MOCK_PROMOS = [
    { id: 1, name: 'Descuento Fin de Mes', type: 'percentage', value: '10%', active: true, dates: '25 Oct - 30 Oct' },
    { id: 2, name: 'Pack Desayuno', type: 'combo', value: '2x1', active: true, dates: 'Todo Noviembre' },
    { id: 3, name: 'Liquidación Embutidos', type: 'clearance', value: '30%', active: false, dates: 'Finalizada' },
]

export function SupervisorPromotionsScreen() {
    const navigation = useNavigation()
    const [promos] = useState(MOCK_PROMOS)

    const renderItem = (item: typeof MOCK_PROMOS[0]) => (
        <TouchableOpacity
            className="flex-row items-center bg-white p-4 mb-3 rounded-xl shadow-sm border border-neutral-100"
            activeOpacity={0.7}
            onPress={() => Alert.alert('Detalle', `Editar promo ${item.name}`)}
        >
            <View className="w-12 h-12 bg-pink-50 rounded-lg items-center justify-center mr-4">
                <Ionicons name="megaphone-outline" size={24} color="#DB2777" />
            </View>
            <View className="flex-1">
                <Text className="font-bold text-neutral-900 text-lg">{item.name}</Text>
                <Text className="text-neutral-500 text-xs">{item.dates} • {item.value}</Text>
            </View>
            <View className={`px-2 py-1 rounded-md ${item.active ? 'bg-green-100' : 'bg-neutral-100'}`}>
                <Text className={`text-[10px] font-bold uppercase ${item.active ? 'text-green-700' : 'text-neutral-400'}`}>
                    {item.active ? 'Activa' : 'Inactiva'}
                </Text>
            </View>
        </TouchableOpacity>
    )

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Promociones y Campañas" variant="standard" onBackPress={() => navigation.goBack()} />

            <GenericList
                items={promos}
                isLoading={false}
                onRefresh={() => { }}
                renderItem={renderItem}
                emptyState={{
                    icon: 'megaphone-outline',
                    title: 'Sin Promociones',
                    message: 'No hay campañas activas.'
                }}
            />

            <TouchableOpacity
                className="absolute bottom-6 right-6 w-14 h-14 bg-brand-red rounded-full items-center justify-center shadow-lg shadow-red-500/40 z-50 elevation-5"
                onPress={() => Alert.alert('Nuevo', 'Crear Campaña')}
                style={{ position: 'absolute', bottom: 30, right: 30 }}
            >
                <Ionicons name="add" size={30} color="white" />
            </TouchableOpacity>
        </View>
    )
}

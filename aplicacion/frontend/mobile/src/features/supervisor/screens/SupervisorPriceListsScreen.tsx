import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, Alert } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Header } from '../../../components/ui/Header'
import { GenericList } from '../../../components/ui/GenericList'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { CatalogService, PriceList } from '../../../services/api/CatalogService'

export function SupervisorPriceListsScreen() {
    const navigation = useNavigation()
    const [lists, setLists] = useState<PriceList[]>([])
    const [loading, setLoading] = useState(false)

    const fetchLists = async () => {
        setLoading(true)
        try {
            const data = await CatalogService.getPriceLists()
            setLists(data)
        } catch (error) {
            console.error(error)
            Alert.alert('Error', 'No se pudieron cargar las listas de precios.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLists()
    }, [])

    const renderItem = (item: PriceList) => (
        <TouchableOpacity
            className="flex-row items-center bg-white p-4 mb-3 rounded-xl shadow-sm border border-neutral-100"
            activeOpacity={0.7}
            onPress={() => Alert.alert('Detalle', `Lista: ${item.nombre}`)}
        >
            <View className="w-12 h-12 bg-amber-50 rounded-lg items-center justify-center mr-4">
                <Ionicons name="pricetag-outline" size={24} color="#D97706" />
            </View>
            <View className="flex-1">
                <Text className="font-bold text-neutral-900 text-lg">{item.nombre}</Text>
                <Text className="text-neutral-500 text-sm">Moneda: {item.moneda || 'USD'}</Text>
            </View>
            <View className={`px-2 py-1 rounded-md ${item.activa ? 'bg-green-100' : 'bg-neutral-100'}`}>
                <Text className={`text-[10px] font-bold uppercase ${item.activa ? 'text-green-700' : 'text-neutral-400'}`}>
                    {item.activa ? 'Activa' : 'Inactiva'}
                </Text>
            </View>
        </TouchableOpacity>
    )

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Listas de Precios" variant="standard" onBackPress={() => navigation.goBack()} />

            <GenericList
                items={lists}
                isLoading={loading}
                onRefresh={fetchLists}
                renderItem={renderItem}
                emptyState={{
                    icon: 'pricetags-outline',
                    title: 'Sin Listas',
                    message: 'No hay listas de precios configuradas.'
                }}
            />

            {/* FAB for Add */}
            <TouchableOpacity
                className="absolute bottom-6 right-6 w-14 h-14 bg-brand-red rounded-full items-center justify-center shadow-lg shadow-red-500/40 z-50 elevation-5"
                onPress={() => Alert.alert('Nuevo', 'Crear Lista (Implementar Formulario)')}
                style={{ position: 'absolute', bottom: 30, right: 30 }}
            >
                <Ionicons name="add" size={30} color="white" />
            </TouchableOpacity>
        </View>
    )
}

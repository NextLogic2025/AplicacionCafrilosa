import React, { useState, useCallback } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Header } from '../../../components/ui/Header'
import { GenericList } from '../../../components/ui/GenericList'
import { SearchBar } from '../../../components/ui/SearchBar'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { PromotionService, PromotionCampaign } from '../../../services/api/PromotionService'

export function SupervisorPromotionsScreen() {
    const navigation = useNavigation<any>()
    const [campaigns, setCampaigns] = useState<PromotionCampaign[]>([])
    const [loading, setLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    const fetchData = async () => {
        setLoading(true)
        try {
            const data = await PromotionService.getCampaigns()
            setCampaigns(data)
        } catch (error) {
            console.error('Error fetching campaigns:', error)
        } finally {
            setLoading(false)
        }
    }

    useFocusEffect(
        useCallback(() => {
            fetchData()
        }, [])
    )

    const filteredCampaigns = campaigns.filter(c =>
        c.nombre.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const renderItem = (item: PromotionCampaign) => (
        <TouchableOpacity
            className="bg-white p-4 mb-3 rounded-xl shadow-sm border border-neutral-100"
            activeOpacity={0.7}
            onPress={() => navigation.navigate('SupervisorPromotionForm', { campaign: item })}
        >
            <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1 mr-2">
                    <Text className="font-bold text-neutral-900 text-base">{item.nombre}</Text>
                    {item.descripcion && (
                        <Text className="text-neutral-500 text-xs mt-1" numberOfLines={2}>{item.descripcion}</Text>
                    )}
                </View>
                <View className={`px-2 py-1 rounded-md ${item.activo ? 'bg-green-100' : 'bg-neutral-100'}`}>
                    <Text className={`text-[10px] font-bold uppercase ${item.activo ? 'text-green-700' : 'text-neutral-500'}`}>
                        {item.activo ? 'Activa' : 'Inactiva'}
                    </Text>
                </View>
            </View>

            {/* Info Row */}
            <View className="flex-row flex-wrap gap-2 mt-2 pt-2 border-t border-dashed border-neutral-100">
                <View className="flex-row items-center bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                    <Ionicons name="calendar-outline" size={12} color="#2563EB" />
                    <Text className="text-blue-700 text-[10px] font-bold ml-1">
                        {new Date(item.fecha_inicio).toLocaleDateString()} - {new Date(item.fecha_fin).toLocaleDateString()}
                    </Text>
                </View>

                <View className="flex-row items-center bg-purple-50 px-2 py-1 rounded-md border border-purple-100">
                    <Ionicons name="pricetag-outline" size={12} color="#9333ea" />
                    <Text className="text-purple-700 text-[10px] font-bold ml-1">
                        {item.tipo_descuento === 'PORCENTAJE' ? `${item.valor_descuento}%` : `$${item.valor_descuento}`}
                    </Text>
                </View>

                <View className="flex-row items-center bg-orange-50 px-2 py-1 rounded-md border border-orange-100">
                    <Ionicons name="people-outline" size={12} color="#ea580c" />
                    <Text className="text-orange-700 text-[10px] font-bold ml-1">
                        {item.alcance}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    )

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Promociones" variant="standard" onBackPress={() => navigation.goBack()} />

            <View className="px-5 py-4 bg-white shadow-sm z-10">
                <View className="flex-row items-center">
                    <View className="flex-1 mr-3">
                        <SearchBar
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="Buscar campaña..."
                            onClear={() => setSearchQuery('')}
                        />
                    </View>
                    <TouchableOpacity
                        className="w-12 h-12 rounded-xl items-center justify-center shadow-lg"
                        style={{ backgroundColor: BRAND_COLORS.red }}
                        onPress={() => navigation.navigate('SupervisorPromotionForm')}
                    >
                        <Ionicons name="add" size={28} color="white" />
                    </TouchableOpacity>
                </View>
            </View>

            <View className="flex-1 px-5 mt-2">
                <GenericList
                    items={filteredCampaigns}
                    isLoading={loading}
                    onRefresh={fetchData}
                    renderItem={renderItem}
                    emptyState={{
                        icon: 'pricetags-outline',
                        title: 'Sin Promociones',
                        message: 'No hay campañas activas o registradas.'
                    }}
                />
            </View>
        </View>
    )
}

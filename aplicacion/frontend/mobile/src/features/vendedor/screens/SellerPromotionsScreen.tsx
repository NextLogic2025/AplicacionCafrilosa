import React, { useState, useEffect } from 'react'
import { View, Text, FlatList, ActivityIndicator } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Header } from '../../../components/ui/Header'
import { EmptyState } from '../../../components/ui/EmptyState'
import { PromotionsService, type Promotion } from '../../../services/api/PromotionsService'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { Ionicons } from '@expo/vector-icons'

export function SellerPromotionsScreen() {
    const navigation = useNavigation()
    const [loading, setLoading] = useState(false)
    const [promotions, setPromotions] = useState<Promotion[]>([])

    useEffect(() => {
        loadPromos()
    }, [])

    const loadPromos = async () => {
        setLoading(true)
        try {
            const data = await PromotionsService.getActivePromotions()
            setPromotions(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Promociones Vigentes" variant="standard" onBackPress={() => navigation.goBack()} notificationRoute="SellerNotifications" />

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={BRAND_COLORS.red} />
                </View>
            ) : (
                <FlatList
                    data={promotions}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ padding: 20 }}
                    ListEmptyComponent={
                        <EmptyState
                            icon="ticket-outline"
                            title="Sin Promociones"
                            description="No hay promociones activas en este momento."
                            actionLabel="Recargar"
                            onAction={loadPromos}
                        />
                    }
                    renderItem={({ item }) => (
                        <View className="bg-white p-5 rounded-xl border border-neutral-100 mb-4 shadow-sm relative overflow-hidden">
                            <View className="absolute top-0 right-0 bg-brand-red px-3 py-1 rounded-bl-xl">
                                <Text className="text-white text-[10px] font-bold">-{item.discountPercentage}%</Text>
                            </View>

                            <View className="flex-row items-center mb-2">
                                <Ionicons name="pricetag" size={20} color={BRAND_COLORS.red} style={{ marginRight: 8 }} />
                                <Text className="font-bold text-neutral-900 text-lg flex-1 mr-8">{item.title}</Text>
                            </View>

                            <Text className="text-neutral-600 text-sm mb-3 leading-5">{item.description}</Text>

                            <View className="flex-row justify-between items-center pt-3 border-t border-neutral-50">
                                <Text className="text-neutral-400 text-xs">Válido hasta: {item.validUntil}</Text>
                                <Text className="font-bold text-brand-red text-xs uppercase">Aplicar</Text>
                            </View>
                        </View>
                    )}
                />
            )}
        </View>
    )
}

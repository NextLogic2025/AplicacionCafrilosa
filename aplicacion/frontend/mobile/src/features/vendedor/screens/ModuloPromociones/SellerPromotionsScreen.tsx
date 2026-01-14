import React, { useState, useEffect } from 'react'
import { View, Text, FlatList, ActivityIndicator } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Header } from '../../../../components/ui/Header'
import { EmptyState } from '../../../../components/ui/EmptyState'
import { PromotionService, type PromotionCampaign } from '../../../../services/api/PromotionService'
import { BRAND_COLORS } from '../../../../shared/types'
import { Ionicons } from '@expo/vector-icons'

export function SellerPromotionsScreen() {
    const navigation = useNavigation()
    const [loading, setLoading] = useState(false)
    const [promotions, setPromotions] = useState<PromotionCampaign[]>([])

    useEffect(() => {
        loadPromos()
    }, [])

    const loadPromos = async () => {
        setLoading(true)
        try {
            const data = await PromotionService.getCampaigns()
            setPromotions(data.filter(p => p.activo))
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
                    keyExtractor={item => item.id.toString()}
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
                                <Text className="text-white text-[10px] font-bold">
                                    {item.tipo_descuento === 'PORCENTAJE' ? `-${item.valor_descuento}%` : `-$${item.valor_descuento}`}
                                </Text>
                            </View>

                            <View className="flex-row items-center mb-2">
                                <Ionicons name="pricetag" size={20} color={BRAND_COLORS.red} style={{ marginRight: 8 }} />
                                <Text className="font-bold text-neutral-900 text-lg flex-1 mr-8">{item.nombre}</Text>
                            </View>

                            <Text className="text-neutral-600 text-sm mb-3 leading-5">{item.descripcion}</Text>

                            <View className="flex-row justify-between items-center pt-3 border-t border-neutral-50">
                                <Text className="text-neutral-400 text-xs">Válido hasta: {new Date(item.fecha_fin).toLocaleDateString()}</Text>
                                <Text className="font-bold text-brand-red text-xs uppercase">Aplicar</Text>
                            </View>
                        </View>
                    )}
                />
            )}
        </View>
    )
}

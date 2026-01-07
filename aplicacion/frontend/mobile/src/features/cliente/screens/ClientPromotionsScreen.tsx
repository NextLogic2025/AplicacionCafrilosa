import React, { useState, useEffect } from 'react'
import { View, Text, FlatList, ActivityIndicator, Image, Pressable } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { Header } from '../../../components/ui/Header'
import { EmptyState } from '../../../components/ui/EmptyState'
import { PromotionService, PromotionCampaign } from '../../../services/api/PromotionService'

export function ClientPromotionsScreen() {
    const navigation = useNavigation()
    const [promotions, setPromotions] = useState<PromotionCampaign[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const data = await PromotionService.getCampaigns()
            setPromotions(data.filter(p => p.activo))
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const renderItem = ({ item }: { item: PromotionCampaign }) => (
        <View className="bg-white rounded-xl mb-4 overflow-hidden shadow-sm shadow-neutral-100 border border-neutral-100">
            {item.imagen_banner_url && (
                <Image source={{ uri: item.imagen_banner_url }} className="w-full h-40" resizeMode="cover" />
            )}
            <View className="p-4">
                <Text className="text-lg font-bold text-brand-red mb-1">{item.nombre}</Text>
                <Text className="text-neutral-600 text-sm mb-3">{item.descripcion}</Text>

                <View className="flex-row justify-between items-center mt-2 border-t border-neutral-100 pt-3">
                    <Text className="text-neutral-400 text-xs italic">Vence: {new Date(item.fecha_fin || '').toLocaleDateString()}</Text>
                    <Pressable
                        className="bg-brand-red px-4 py-2 rounded-lg flex-row items-center"
                        onPress={() => console.log('Agregar promo al carrito', item.id)}
                    >
                        <Ionicons name="cart-outline" size={16} color="white" style={{ marginRight: 4 }} />
                        <Text className="text-white text-xs font-bold">Ver Detalles</Text>
                    </Pressable>
                </View>
            </View>
        </View>
    )

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Promociones" variant="standard" onBackPress={() => navigation.goBack()} />

            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator color={BRAND_COLORS.red} size="large" />
                </View>
            ) : promotions.length > 0 ? (
                <FlatList
                    data={promotions}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={{ padding: 20 }}
                />
            ) : (
                <View className="flex-1 justify-center items-center p-8">
                    <EmptyState
                        icon="pricetag-outline"
                        title="Sin promociones"
                        description="No hay ofertas disponibles en este momento."
                    />
                </View>
            )}
        </View>
    )
}

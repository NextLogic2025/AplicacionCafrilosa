import React, { useState, useEffect } from 'react'
import { View, Text, FlatList, ActivityIndicator, Image, Pressable } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { Header } from '../../../components/ui/Header'
import { EmptyState } from '../../../components/ui/EmptyState'
import { PromotionsService, Promotion } from '../../../services/api/PromotionsService'

export function ClientPromotionsScreen() {
    const navigation = useNavigation()
    const [promotions, setPromotions] = useState<Promotion[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const data = await PromotionsService.getPromotions()
            setPromotions(data)
        } finally {
            setLoading(false)
        }
    }

    const renderItem = ({ item }: { item: Promotion }) => (
        <View className="bg-white rounded-xl mb-4 overflow-hidden shadow-sm shadow-neutral-100 border border-neutral-100">
            {item.imageUrl && (
                <Image source={{ uri: item.imageUrl }} className="w-full h-40" resizeMode="cover" />
            )}
            <View className="p-4">
                <Text className="text-lg font-bold text-brand-red mb-1">{item.title}</Text>
                <Text className="text-neutral-600 text-sm mb-3">{item.description}</Text>

                {item.includedProducts && item.includedProducts.length > 0 && (
                    <View className="mb-3">
                        <Text className="text-xs font-bold text-neutral-500 uppercase mb-1">Productos Incluidos:</Text>
                        <View className="flex-row flex-wrap gap-2">
                            {item.includedProducts.map((prod, idx) => (
                                <View key={idx} className="bg-neutral-100 px-2 py-1 rounded-md">
                                    <Text className="text-xs text-neutral-700">{prod}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                <View className="flex-row justify-between items-center mt-2 border-t border-neutral-100 pt-3">
                    <Text className="text-neutral-400 text-xs italic">Vence: {item.validUntil}</Text>
                    <Pressable
                        className="bg-brand-red px-4 py-2 rounded-lg flex-row items-center"
                        onPress={() => console.log('Agregar promo al carrito', item.id)}
                    >
                        <Ionicons name="cart-outline" size={16} color="white" style={{ marginRight: 4 }} />
                        <Text className="text-white text-xs font-bold">Agregar</Text>
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
                    keyExtractor={item => item.id}
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

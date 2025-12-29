import React, { useState, useEffect } from 'react'
import { View, Text, FlatList, ActivityIndicator, TextInput, Pressable } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Header } from '../../../components/ui/Header'
import { EmptyState } from '../../../components/ui/EmptyState'
import { ProductService, type Product } from '../../../services/api/ProductService'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '@cafrilosa/shared-types'

export function SellerProductsScreen() {
    const navigation = useNavigation()
    const [loading, setLoading] = useState(false)
    const [products, setProducts] = useState<Product[]>([])
    const [search, setSearch] = useState('')

    useEffect(() => {
        loadProducts()
    }, [])

    const loadProducts = async () => {
        setLoading(true)
        try {
            const data = await ProductService.getProducts(search)
            setProducts(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddToOrder = (product: Product) => {
        // In a real app, this would use a Context or Redux to add to the global "Current Order" state.
        // For now, we'll navigate to the Order screen with the product as a param or just show feedback.
        // Given the requirement "backend ready", we'll mock the action.
        console.log('Adding to order:', product.name)
        // Feedback could be a toast or alert, but let's keep it simple as per instructions.
    }

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Catálogo de Productos" variant="standard" onBackPress={() => navigation.goBack()} notificationRoute="SellerNotifications" />

            <View className="px-5 py-3 bg-white border-b border-neutral-100">
                <View className="flex-row items-center bg-neutral-100 rounded-xl px-4 h-12">
                    <Ionicons name="search" size={20} color="#9CA3AF" style={{ marginRight: 10 }} />
                    <TextInput
                        placeholder="Buscar producto..."
                        className="flex-1 text-neutral-900 font-medium"
                        placeholderTextColor="#9CA3AF"
                        value={search}
                        onChangeText={setSearch}
                        onSubmitEditing={loadProducts}
                    />
                </View>
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={BRAND_COLORS.red} />
                </View>
            ) : (
                <FlatList
                    data={products}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
                    ListEmptyComponent={
                        <EmptyState
                            icon="cube-outline"
                            title="Sin Productos"
                            description="No se encontraron productos en el catálogo."
                            actionLabel="Recargar"
                            onAction={loadProducts}
                        />
                    }
                    renderItem={({ item }) => (
                        <View className="bg-white p-4 rounded-xl border border-neutral-100 mb-3 shadow-sm flex-row justify-between items-start">
                            <View className="flex-1 mr-3">
                                <Text className="font-bold text-neutral-900 text-base">{item.name}</Text>
                                <Text className="text-neutral-500 text-sm mb-1">{item.description}</Text>
                                <View className="flex-row items-center flex-wrap gap-2">
                                    <View className="bg-neutral-100 px-2 py-1 rounded">
                                        <Text className="text-neutral-600 text-[10px] font-bold">Base: ${item.price.toFixed(2)}</Text>
                                    </View>
                                    {item.stock !== undefined && (
                                        <Text className={`text-[10px] font-bold ${item.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {item.stock > 0 ? `Stock: ${item.stock}` : 'Agontado'}
                                        </Text>
                                    )}
                                </View>
                            </View>
                            <Pressable
                                onPress={() => handleAddToOrder(item)}
                                className="bg-red-50 p-2 rounded-full items-center justify-center active:bg-red-100"
                            >
                                <Ionicons name="add" size={24} color={BRAND_COLORS.red} />
                            </Pressable>
                        </View>
                    )}
                />
            )}
        </View>
    )
}

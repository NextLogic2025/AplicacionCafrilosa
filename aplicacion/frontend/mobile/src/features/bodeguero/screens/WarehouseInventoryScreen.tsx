import React, { useState, useEffect } from 'react'
import { View, Text, FlatList, ActivityIndicator, TextInput, TouchableOpacity, Alert } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { Header } from '../../../components/ui/Header'
import { EmptyState } from '../../../components/ui/EmptyState'
import { ProductService, type Product } from '../../../services/api/ProductService'

export function WarehouseInventoryScreen() {
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(false)
    const [products, setProducts] = useState<Product[]>([])

    useEffect(() => {
        loadInventory()
    }, [])

    const loadInventory = async () => {
        setLoading(true)
        try {
            const data = await ProductService.getProducts()
            setProducts(data)
        } catch (error) {
            console.error('Error loading inventory', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAdjustment = (product: Product) => {
        Alert.alert(
            'Registrar Ajuste',
            `Seleccione el tipo de ajuste para ${product.name}`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Merma',
                    onPress: () => performAdjustment(product.id, 'merma')
                },
                {
                    text: 'Daño',
                    onPress: () => performAdjustment(product.id, 'damage')
                },
                {
                    text: 'Diferencia',
                    onPress: () => performAdjustment(product.id, 'difference')
                }
            ]
        )
    }

    const performAdjustment = async (id: string, type: 'merma' | 'damage' | 'difference') => {
        // En una app real, aquí abriríamos un modal para ingresar la cantidad.
        // Simularemos un ajuste de 1 unidad por ahora.
        setLoading(true)
        await ProductService.adjustInventory(id, type, 1, 'Ajuste manual desde app')
        setLoading(false)
        Alert.alert('Éxito', 'Ajuste registrado correctamente')
        loadInventory()
    }

    return (
        <View className="flex-1 bg-neutral-50 relative">
            <Header title="Inventario Físico" variant="standard" />

            <View className="px-5 py-3 bg-white border-b border-neutral-100 z-10">
                <View className="flex-row items-center bg-neutral-100 rounded-xl px-4 h-12">
                    <Ionicons name="search" size={20} color="#9CA3AF" style={{ marginRight: 10 }} />
                    <TextInput
                        placeholder="Buscar por código, lote o nombre"
                        className="flex-1 text-neutral-900 font-medium"
                        placeholderTextColor="#9CA3AF"
                        value={search}
                        onChangeText={setSearch}
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
                    contentContainerStyle={{ padding: 20 }}
                    ListEmptyComponent={
                        <EmptyState
                            icon="cube-outline"
                            title="Inventario vacío"
                            description="No se encontraron productos en bodega."
                            actionLabel="Recargar"
                            onAction={loadInventory}
                        />
                    }
                    renderItem={({ item }) => (
                        <View className="bg-white p-4 rounded-xl border border-neutral-100 mb-3 shadow-sm">
                            <View className="flex-row justify-between items-start mb-3">
                                <View>
                                    <View className="flex-row gap-2 mb-1">
                                        <Text className="bg-neutral-100 px-1.5 py-0.5 rounded text-[10px] font-bold text-neutral-500">{item.code}</Text>
                                        <Text className="bg-blue-50 px-1.5 py-0.5 rounded text-[10px] font-bold text-blue-600">Ubic: {item.location ?? 'N/A'}</Text>
                                        {item.critical && <Text className="bg-red-100 px-1.5 py-0.5 rounded text-[10px] font-bold text-red-700">STOCK BAJO</Text>}
                                    </View>
                                    <Text className="text-neutral-900 font-bold text-base">{item.name}</Text>
                                </View>
                                <View className="items-end">
                                    <View className="flex-row items-baseline">
                                        <Text className={`text-xl font-bold ${item.critical ? 'text-red-600' : 'text-neutral-900'}`}>{item.stock ?? '--'}</Text>
                                        <Text className="text-neutral-400 text-xs font-medium uppercase ml-1">{item.unit ?? 'UND'}</Text>
                                    </View>
                                    <Text className="text-neutral-400 text-[10px]">Disponible</Text>
                                </View>
                            </View>

                            {/* Detalles Adicionales */}
                            <View className="flex-row justify-between items-center pt-3 border-t border-neutral-50">
                                <View className="flex-row gap-4">
                                    <View>
                                        <Text className="text-[10px] text-neutral-400 uppercase font-bold">Reservado</Text>
                                        <Text className="text-neutral-700 font-medium">{item.reservedStock ?? 0} {item.unit}</Text>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    onPress={() => handleAdjustment(item)}
                                    className="bg-neutral-100 px-3 py-1.5 rounded-lg flex-row items-center"
                                >
                                    <Ionicons name="construct-outline" size={14} color="#4B5563" />
                                    <Text className="text-xs font-bold text-neutral-700 ml-1">Ajustar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                />
            )}
        </View>
    )
}
